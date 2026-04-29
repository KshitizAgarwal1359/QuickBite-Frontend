import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderApiService } from '../../core/services/order-api.service';
import { DeliveryApiService } from '../../core/services/delivery-api.service';
import { ToastService } from '../../core/services/toast.service';
import { OrderResponse, AgentResponse } from '../../core/models/api.models';
import { environment } from '../../../environments/environment';
import { Subject, timer } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';

declare var L: any;

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page container">
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (order) {
        <div class="page-header">
          <h1>Order #{{ order.orderId }}</h1>
          <p class="text-muted">Placed on {{ order.orderDate | date:'medium' }}</p>
          @if (estimatedMin !== null) {
            <h3 class="text-primary mt-8">⏱️ Estimated arrival in {{ estimatedMin }} min</h3>
          }
        </div>
        <div class="tracking-layout">
          <div class="card"><div class="card-body">
            <h3>Order Status</h3>
            <div class="status-stepper mt-24">
              @for (step of statusSteps; track step) {
                <div class="step" [class.active]="isStepActive(step)" [class.current]="order.orderStatus === step">
                  <div class="step-dot"></div>
                  <span class="step-label">{{ step.replace('_', ' ') }}</span>
                </div>
              }
            </div>
          </div></div>
          <div class="card mt-24"><div class="card-body">
            <h3>Items</h3>
            @for (item of order.items; track item.orderItemId) {
              <div class="summary-row"><span>{{ item.name }} × {{ item.quantity }}</span><span>₹{{ item.subTotal }}</span></div>
            }
            <div class="summary-row total mt-8"><span>Total</span><span class="price">₹{{ order.finalAmount }}</span></div>
            <div class="mt-16 text-sm text-muted">
              <p>📍 {{ order.deliveryAddress }}</p>
              <p>💰 {{ order.modeOfPayment }}</p>
              @if (agent) { 
                <div class="agent-card mt-8">
                  <p><strong>🚴 Delivery Agent:</strong> {{ agent.fullName }}</p>
                  <p>📞 {{ agent.phone }} | 🚗 {{ agent.vehicleType }} ({{ agent.vehicleNumber }})</p>
                  @if (agent.avgRating) { <p>⭐ {{ agent.avgRating }} / 5.0</p> }
                </div>
              } @else if (order.deliveryAgentId) { 
                <p>🚴 Agent ID: {{ order.deliveryAgentId }}</p> 
              }
            </div>
            @if (order.orderStatus === 'PLACED' || order.orderStatus === 'CONFIRMED') {
              <button class="btn btn-danger btn-block mt-16" (click)="cancelOrder()">Cancel Order</button>
            }
            @if (order.orderStatus === 'CANCELLED') {
              <div class="mt-16 p-12 text-sm" style="background: var(--surface-hover); border-left: 3px solid var(--danger); border-radius: var(--radius-sm);">
                <strong>Order Cancelled.</strong>
                @if (order.modeOfPayment !== 'COD') {
                  <p class="mt-4">Your refund has been initiated and will be processed to your original payment method shortly.</p>
                }
              </div>
            }

            @if ((order.orderStatus === 'PICKED_UP' || order.orderStatus === 'DELIVERED') && agent) {
              <div class="live-map mt-24">
                <h4>Live Tracking</h4>
                <div id="tracking-map" class="map-container mt-8">
                  @if (!agentLocation) {
                    <div class="map-placeholder">Waiting for GPS signal...</div>
                  }
                </div>
              </div>
            }
          </div></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tracking-layout { max-width: 700px; }
    .status-stepper { display: flex; justify-content: space-between; position: relative; }
    .status-stepper::before { content: ''; position: absolute; top: 12px; left: 0; right: 0; height: 3px; background: var(--border); z-index: 0; }
    .step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 1; flex: 1; }
    .step-dot { width: 24px; height: 24px; border-radius: 50%; background: var(--border); border: 3px solid #fff; box-shadow: 0 0 0 2px var(--border); transition: var(--transition); }
    .step.active .step-dot { background: var(--success); box-shadow: 0 0 0 2px var(--success); }
    .step.current .step-dot { background: var(--primary); box-shadow: 0 0 0 2px var(--primary), 0 0 12px rgba(255,75,43,0.4); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 2px var(--primary); } 50% { box-shadow: 0 0 0 6px rgba(255,75,43,0.3); } }
    .step-label { margin-top: 10px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); text-align: center; }
    .step.active .step-label { color: var(--success); }
    .step.current .step-label { color: var(--primary); }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
    .summary-row.total { font-weight: 700; border: none; }
    .agent-card { background: var(--surface-hover); padding: 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--primary); }
    .live-map { border-top: 1px solid var(--border); padding-top: 16px; }
    .map-container { position: relative; height: 300px; background: #e5e7eb; border-radius: var(--radius-md); overflow: hidden; }
    .map-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 400; font-size: 0.9rem; color: var(--text-muted); background: rgba(229, 231, 235, 0.8); backdrop-filter: blur(2px); }
    .text-primary { color: var(--primary); }
    ::ng-deep .custom-div-icon { font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); display: flex; justify-content: center; align-items: center; }
  `]
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  order: OrderResponse | null = null; loading = true;
  agent: AgentResponse | null = null;
  agentLocation: { lat: number, lng: number } | null = null;
  statusSteps = ['PLACED', 'CONFIRMED', 'PREPARING', 'PICKED_UP', 'DELIVERED'];
  estimatedMin: number | null = null;
  
  private destroy$ = new Subject<void>();
  private hubConnection: signalR.HubConnection | null = null;
  private map: any = null;
  private marker: any = null;
  private timerInt: any;

  constructor(private route: ActivatedRoute, private orderApi: OrderApiService, private deliveryApi: DeliveryApiService, private toast: ToastService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    this.loadLeaflet();
    
    // Polling logic
    timer(0, 15000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.orderApi.getOrder(id))
    ).subscribe({
      next: (o) => {
        this.order = o;
        this.loading = false;
        this.updateTimer();
        
        // Fetch agent if assigned
        if (o.deliveryAgentId && !this.agent) {
          this.deliveryApi.getAgent(o.deliveryAgentId).subscribe({
            next: (a) => this.agent = a,
            error: () => {}
          });
        }
        
        if (o.orderStatus === 'DELIVERED' || o.orderStatus === 'CANCELLED') {
          this.destroy$.next(); // Stop polling
          this.disconnectSignalR();
        } else if (o.orderStatus === 'PICKED_UP' && !this.hubConnection) {
          this.connectSignalR();
        }
      },
      error: () => this.loading = false
    });

    this.timerInt = setInterval(() => this.updateTimer(), 10000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectSignalR();
    if (this.timerInt) clearInterval(this.timerInt);
  }

  updateTimer() {
    if (!this.order?.estimatedDelivery || this.order.orderStatus === 'DELIVERED' || this.order.orderStatus === 'CANCELLED') {
      this.estimatedMin = null;
      return;
    }
    const diff = new Date(this.order.estimatedDelivery).getTime() - new Date().getTime();
    this.estimatedMin = diff <= 0 ? 0 : Math.floor(diff / 60000);
  }

  private loadLeaflet(): Promise<void> {
    return new Promise((resolve) => {
      if (document.getElementById('leaflet-script')) {
        resolve();
        return;
      }
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);

      const script = document.createElement('script');
      script.id = 'leaflet-script';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  private initMap(lat: number, lng: number) {
    if (!this.map && typeof L !== 'undefined') {
      const mapEl = document.getElementById('tracking-map');
      if (mapEl) {
        this.map = L.map('tracking-map').setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        
        const icon = L.divIcon({
          html: '🚴',
          className: 'custom-div-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        
        this.marker = L.marker([lat, lng], { icon }).addTo(this.map);
      }
    } else if (this.map && this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.map.panTo([lat, lng]);
    }
  }

  private connectSignalR() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.apiUrls.deliveryHub)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveLocationUpdate', (agentId: number, lat: number, lng: number) => {
      if (this.order && this.order.deliveryAgentId === agentId) {
        this.agentLocation = { lat, lng };
        this.initMap(lat, lng);
      }
    });

    this.hubConnection.start().then(() => {
      if (this.order && this.order.deliveryAgentId) {
        this.hubConnection!.invoke('SubscribeToAgent', this.order.deliveryAgentId).catch(err => console.error('SignalR Subscribe Error:', err));
      }
    }).catch(err => console.error('SignalR error:', err));
  }

  private disconnectSignalR() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  isStepActive(step: string): boolean { return this.statusSteps.indexOf(step) <= this.statusSteps.indexOf(this.order!.orderStatus); }
  
  cancelOrder() { 
    this.orderApi.cancelOrder(this.order!.orderId).subscribe({ 
      next: (o) => { this.order = o; this.toast.info('Order cancelled'); this.destroy$.next(); }, 
      error: (e) => this.toast.error(e.error?.message || 'Failed') 
    }); 
  }
}
