import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderApiService } from '../../core/services/order-api.service';
import { DeliveryApiService } from '../../core/services/delivery-api.service';
import { ToastService } from '../../core/services/toast.service';
import { OrderResponse, AgentResponse } from '../../core/models/api.models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page container">
      <div class="page-header flex-between align-center">
        <div>
          <h1>📦 Active Orders</h1>
          <p>All active orders across the platform — assign agents and manage status</p>
        </div>
        <button class="btn btn-outline btn-sm" (click)="loadOrders(); loadAgents()">🔄 Refresh</button>
      </div>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (orders.length === 0) { <div class="empty-state"><h3>No active orders</h3></div> }
      @else {
        <div class="orders-list">
          @for (order of orders; track order.orderId) {
            <div class="card mb-16"><div class="card-body">
              <div class="flex-between">
                <div>
                  <h3>Order #{{ order.orderId }}</h3>
                  <p class="text-sm text-muted">Customer #{{ order.customerId }} • Restaurant #{{ order.restaurantId }} • {{ order.orderDate | date:'short' }}</p>
                </div>
                <span [class]="'badge badge-' + getColor(order.orderStatus)">{{ order.orderStatus }}</span>
              </div>
              <div class="mt-8">
                @for (item of order.items; track item.orderItemId) {
                  <span class="item-chip">{{ item.name }} × {{ item.quantity }}</span>
                }
              </div>
              <p class="text-sm mt-8">📍 {{ order.deliveryAddress }}</p>
              <div class="flex-between mt-8">
                <span class="price">₹{{ order.finalAmount }} ({{ order.modeOfPayment }})</span>
              </div>

              <!-- Agent Assignment Section -->
              <div class="agent-section mt-16">
                @if (order.deliveryAgentId) {
                  <div class="agent-assigned">
                    <span class="badge badge-success">🚴 Agent #{{ order.deliveryAgentId }} assigned</span>
                  </div>
                } @else {
                  <div class="assign-agent-row">
                    <label class="text-sm font-bold">Assign Agent:</label>
                    <select class="form-control" style="max-width:250px" [(ngModel)]="selectedAgentId[order.orderId]">
                      <option [ngValue]="0" disabled>Select an agent</option>
                      @for (agent of availableAgents; track agent.agentId) {
                        <option [ngValue]="agent.agentId">{{ agent.fullName }} (#{{ agent.agentId }}) — {{ agent.vehicleType }} {{ agent.isAvailable ? '🟢 Online' : '🔴 Offline' }}</option>
                      }
                    </select>
                    <button class="btn btn-primary btn-sm" (click)="assignAgent(order)" [disabled]="!selectedAgentId[order.orderId]">Assign</button>
                  </div>
                  @if (availableAgents.length === 0) {
                    <p class="text-sm text-muted mt-4">No verified & online agents available right now.</p>
                  }
                }
              </div>

              <!-- Status Controls -->
              <div class="flex gap-8 mt-12">
                @if (order.orderStatus === 'PLACED') { <button class="btn btn-success btn-sm" (click)="updateStatus(order, 'CONFIRMED')">Confirm</button> }
                @if (order.orderStatus === 'CONFIRMED') { <button class="btn btn-accent btn-sm" (click)="updateStatus(order, 'PREPARING')">Start Preparing</button> }
                @if (order.orderStatus === 'PREPARING') { <button class="btn btn-primary btn-sm" (click)="updateStatus(order, 'PICKED_UP')">Out for Delivery (Picked Up)</button> }
                @if (order.orderStatus === 'PICKED_UP') { <button class="btn btn-success btn-sm" (click)="updateStatus(order, 'DELIVERED')">Mark Delivered</button> }
                @if (order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED') {
                  <button class="btn btn-danger btn-sm" (click)="cancelOrder(order)">Cancel</button>
                }
              </div>
            </div></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .item-chip { display: inline-block; background: var(--surface-hover); padding: 4px 10px; border-radius: var(--radius-pill); font-size: 0.85rem; margin-right: 6px; margin-bottom: 4px; }
    .agent-section { padding: 12px 16px; background: #F8F9FA; border-radius: var(--radius-sm); }
    .assign-agent-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .agent-assigned { display: flex; align-items: center; gap: 8px; }
  `]
})
export class ActiveOrdersComponent implements OnInit, OnDestroy {
  orders: OrderResponse[] = [];
  availableAgents: AgentResponse[] = [];
  selectedAgentId: Record<number, number> = {};
  loading = true;
  pollInterval: any;

  constructor(private orderApi: OrderApiService, private deliveryApi: DeliveryApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadOrders();
    this.loadAgents();
    this.pollInterval = setInterval(() => { this.loadOrders(false); this.loadAgents(); }, 30000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadOrders(showSpinner = true) {
    if (showSpinner) this.loading = true;
    this.orderApi.getActiveOrders().subscribe({
      next: (o) => { this.orders = o; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadAgents() {
    this.deliveryApi.getAllAgents().subscribe({
      next: (agents) => {
        // Only show agents that are BOTH verified AND currently online (isAvailable)
        this.availableAgents = agents.filter(a => a.isVerified && a.isAvailable);
      }
    });
  }

  assignAgent(order: OrderResponse) {
    const agentId = this.selectedAgentId[order.orderId];
    if (!agentId) return;
    this.orderApi.assignAgent(order.orderId, { deliveryAgentId: agentId }).subscribe({
      next: (o) => { order.deliveryAgentId = o.deliveryAgentId; this.toast.success('Agent #' + agentId + ' assigned to Order #' + order.orderId); },
      error: (e) => this.toast.error(e.error?.message || 'Failed to assign agent')
    });
  }

  updateStatus(order: OrderResponse, status: string) {
    this.orderApi.updateStatus(order.orderId, { orderStatus: status }).subscribe({
      next: (o) => { order.orderStatus = o.orderStatus; this.toast.success('Order #' + order.orderId + ' → ' + status); },
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  cancelOrder(order: OrderResponse) {
    this.orderApi.cancelOrder(order.orderId).subscribe({
      next: (o) => { order.orderStatus = o.orderStatus; this.toast.info('Order #' + order.orderId + ' cancelled'); },
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  getColor(s: string): string {
    const m: Record<string, string> = { PLACED: 'info', CONFIRMED: 'info', PREPARING: 'warning', PICKED_UP: 'warning', DELIVERED: 'success', CANCELLED: 'error' };
    return m[s] || 'info';
  }
}
