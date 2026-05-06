import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryApiService } from '../../core/services/delivery-api.service';
import { OrderApiService } from '../../core/services/order-api.service';
import { ToastService } from '../../core/services/toast.service';
import { OrderResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-agent-active-deliveries',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page container">
      <div class="page-header flex-between">
        <h1>📦 Active Deliveries</h1>
        <button class="btn btn-outline btn-sm" (click)="loadDeliveries()">🔄 Refresh</button>
      </div>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (!agentId) {
        <div class="empty-state"><h3>Agent profile not found</h3><p>Please complete agent registration and log in as an agent.</p></div>
      }
      @else if (orders.length === 0) {
        <div class="empty-state"><h3>No active deliveries</h3><p>You'll see assigned orders here when they arrive.</p></div>
      } @else {
        <div class="grid grid-2">
          @for (order of orders; track order.orderId) {
            <div class="card">
              <div class="card-body">
                <div class="flex-between mb-8">
                  <h3>Order #{{ order.orderId }}</h3>
                  <span class="badge badge-info">{{ order.orderStatus }}</span>
                </div>
                <p class="text-sm mt-4"><strong>Deliver to:</strong> {{ order.deliveryAddress }}</p>
                <p class="text-sm mt-4"><strong>Total Amount:</strong> ₹{{ order.finalAmount }}</p>
                <div class="mt-16">
                  @if (order.orderStatus === 'CUSTOMER_RECEIVED') {
                    <button class="btn btn-success btn-block" (click)="completeDelivery(order)">✓ Complete Delivery</button>
                  } @else if (order.orderStatus === 'PICKED_UP') {
                    <p class="text-sm text-warning" style="margin-bottom: 8px; font-weight: 500; color: #f59e0b;">🕒 Waiting for customer to confirm receipt...</p>
                    <button class="btn btn-success btn-block" disabled style="opacity: 0.6; cursor: not-allowed;">✓ Complete Delivery</button>
                  } @else {
                    <p class="text-sm text-muted">Status: {{ order.orderStatus }}</p>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AgentActiveDeliveriesComponent implements OnInit, OnDestroy {
  orders: OrderResponse[] = [];
  loading = true;
  agentId: number | null = null;
  pollInterval: any;

  constructor(
    private deliveryApi: DeliveryApiService,
    private orderApi: OrderApiService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Resolve agent identity from JWT via /agents/me — works even after a fresh login
    // (sessionStorage 'qb_agent_id' is only a best-effort cache; we don't rely on it here)
    this.deliveryApi.getMyProfile().subscribe({
      next: (agent) => {
        this.agentId = agent.agentId;
        sessionStorage.setItem('qb_agent_id', agent.agentId.toString());
        this.loadDeliveries();
        this.pollInterval = setInterval(() => { this.loadDeliveries(false); }, 15000);
      },
      error: () => {
        // Agent has not registered yet
        this.loading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadDeliveries(showSpinner = true) {
    if (!this.agentId) return;
    if (showSpinner) this.loading = true;
    // Query Order Service directly for orders assigned to this agent
    this.orderApi.getAgentOrders(this.agentId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (e) => {
        this.toast.error(e.error?.message || 'Failed to load deliveries');
        this.loading = false;
      }
    });
  }

  completeDelivery(order: OrderResponse) {
    if (!this.agentId) return;
    
    // First update the order status to DELIVERED
    this.orderApi.updateStatus(order.orderId, { orderStatus: 'DELIVERED' }).subscribe({
      next: () => {
        // Then complete delivery in the delivery service to increment stats
        this.deliveryApi.completeDelivery(this.agentId!, { orderId: order.orderId }).subscribe({
          next: () => {
            this.toast.success('Delivery marked as complete!');
            this.orders = this.orders.filter(o => o.orderId !== order.orderId);
          },
          error: (e) => {
            this.toast.error('Partially completed: ' + (e.error?.message || 'Failed to update agent stats'));
            this.orders = this.orders.filter(o => o.orderId !== order.orderId);
          }
        });
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed to update order status')
    });
  }
}
