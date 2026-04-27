import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryApiService } from '../../core/services/delivery-api.service';
import { ToastService } from '../../core/services/toast.service';
import { AgentResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-agent-verification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page container">
      <div class="page-header"><h1>🚴 Agent Verification</h1><p class="text-muted">Review and verify delivery agent registrations</p></div>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (agents.length === 0) {
        <div class="empty-state"><h3>No agents found</h3><p>No delivery agents have registered yet.</p></div>
      } @else {
        <div class="mb-16 flex gap-8">
          <button class="chip" [class.active]="filter === 'all'" (click)="filter = 'all'">All ({{ agents.length }})</button>
          <button class="chip" [class.active]="filter === 'pending'" (click)="filter = 'pending'">Pending ({{ pendingCount }})</button>
          <button class="chip" [class.active]="filter === 'verified'" (click)="filter = 'verified'">Verified ({{ agents.length - pendingCount }})</button>
        </div>
        @for (agent of filteredAgents; track agent.agentId) {
          <div class="card mb-16"><div class="card-body flex-between">
            <div>
              <h3>{{ agent.fullName }}</h3>
              <p class="text-muted text-sm">📞 {{ agent.phone }} • Agent ID: {{ agent.agentId }} • User ID: {{ agent.userId }}</p>
              <p class="text-sm mt-4">🚗 {{ agent.vehicleType }} — {{ agent.vehicleNumber }}</p>
              <p class="text-sm mt-4">{{ agent.totalDeliveries }} deliveries • {{ agent.isAvailable ? '🟢 Online' : '🔴 Offline' }}</p>
            </div>
            <div>
              @if (!agent.isVerified) {
                <button class="btn btn-success btn-sm" (click)="verify(agent)">✓ Verify Agent</button>
              } @else {
                <span class="badge badge-success">✓ Verified</span>
              }
            </div>
          </div></div>
        }
      }
    </div>
  `,
  styles: [`
    .chip { padding: 8px 20px; border: 2px solid var(--border); border-radius: var(--radius-pill); background: #fff; font-family: var(--font); font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: var(--transition); }
    .chip:hover, .chip.active { border-color: var(--primary); background: var(--primary); color: #fff; }
  `]
})
export class AgentVerificationComponent implements OnInit {
  agents: AgentResponse[] = [];
  loading = true;
  filter: 'all' | 'pending' | 'verified' = 'all';

  constructor(private deliveryApi: DeliveryApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadAllAgents();
  }

  loadAllAgents() {
    this.loading = true;
    this.deliveryApi.getAllAgents().subscribe({
      next: (results) => {
        this.agents = results;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get pendingCount(): number {
    return this.agents.filter(a => !a.isVerified).length;
  }

  get filteredAgents(): AgentResponse[] {
    if (this.filter === 'pending') return this.agents.filter(a => !a.isVerified);
    if (this.filter === 'verified') return this.agents.filter(a => a.isVerified);
    return this.agents;
  }

  verify(agent: AgentResponse) {
    this.deliveryApi.verifyAgent(agent.agentId).subscribe({
      next: (u) => { agent.isVerified = true; this.toast.success(agent.fullName + ' verified!'); },
      error: (e) => this.toast.error(e.error?.message || 'Verification failed')
    });
  }
}
