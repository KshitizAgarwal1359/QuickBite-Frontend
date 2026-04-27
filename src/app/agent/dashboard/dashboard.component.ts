import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeliveryApiService } from '../../core/services/delivery-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { AgentResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page container">
      <div class="page-header"><h1>🚴 Agent Dashboard</h1></div>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (!agent) {
        <div class="empty-state">
          <h3>You haven't registered as an agent yet</h3>
          <a routerLink="/agent/register" class="btn btn-primary mt-16">Register Now</a>
        </div>
      } @else {
        <div class="grid grid-2">
          <div class="card"><div class="card-body">
            <h3>{{ agent.fullName }}</h3>
            <p class="text-muted text-sm">📞 {{ agent.phone }}</p>
            <p class="mt-8">🚗 {{ agent.vehicleType }} — {{ agent.vehicleNumber }}</p>
            <div class="flex gap-16 mt-16">
              <div><p class="text-muted text-sm">Total Deliveries</p><h2>{{ agent.totalDeliveries }}</h2></div>
            </div>
            <div class="mt-24 flex gap-8">
              <span [class]="agent.isVerified ? 'badge badge-success' : 'badge badge-warning'">{{ agent.isVerified ? 'Verified' : 'Pending Verification' }}</span>
              <span [class]="agent.isAvailable ? 'badge badge-success' : 'badge badge-error'">{{ agent.isAvailable ? 'Online' : 'Offline' }}</span>
            </div>
          </div></div>
          <div class="card"><div class="card-body">
            <h3>Quick Actions</h3>
            @if (!agent.isVerified) { <p class="text-muted mt-8">Your profile is pending admin verification. You cannot go online yet.</p> }
            @else {
              <button class="btn btn-block mt-16" [class.btn-success]="!agent.isAvailable" [class.btn-danger]="agent.isAvailable" (click)="toggleAvail()">{{ agent.isAvailable ? '🔴 Go Offline' : '🟢 Go Online' }}</button>
            }
          </div></div>
        </div>
      }
    </div>
  `
})
export class AgentDashboardComponent implements OnInit {
  agent: AgentResponse | null = null; loading = true;
  watchId: number | null = null;
  constructor(private deliveryApi: DeliveryApiService, private auth: AuthApiService, private toast: ToastService) {}
  ngOnInit() {
    this.loadAgent();
  }
  loadAgent() {
    const storedAgentId = sessionStorage.getItem('qb_agent_id');
    if (storedAgentId) {
      this.deliveryApi.getAgent(Number(storedAgentId)).subscribe({
        next: (a) => { this.agent = a; this.loading = false; },
        error: () => { this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }
  toggleAvail() {
    this.deliveryApi.setAvailability(this.agent!.agentId, !this.agent!.isAvailable).subscribe({
      next: (a) => { 
        this.agent = a; 
        this.toast.success(a.isAvailable ? 'You are now online!' : 'You are now offline.'); 
        if (a.isAvailable) {
          this.startGpsTracking();
        } else {
          this.stopGpsTracking();
        }
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  startGpsTracking() {
    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.deliveryApi.updateLocation(this.agent!.agentId, { 
             latitude: pos.coords.latitude, 
             longitude: pos.coords.longitude 
          }).subscribe();
        },
        (err) => console.error('GPS error:', err),
        { enableHighAccuracy: true }
      );
    }
  }

  stopGpsTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
