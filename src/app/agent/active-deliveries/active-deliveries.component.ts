import { Component, OnInit } from '@angular/core';
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
                  <button class="btn btn-success btn-block" (click)="completeDelivery(order.orderId)">✓ Complete Delivery</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class AgentActiveDeliveriesComponent implements OnInit {
  orders: OrderResponse[] = [];
  loading = true;
  agentId: number | null = null;

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
      },
      error: () => {
        // Agent has not registered yet
        this.loading = false;
      }
    });
  }

  loadDeliveries() {
    if (!this.agentId) return;
    this.loading = true;
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

  completeDelivery(orderId: number) {
    if (!this.agentId) return;
    this.deliveryApi.completeDelivery(this.agentId, { orderId }).subscribe({
      next: () => {
        this.toast.success('Delivery marked as complete!');
        this.orders = this.orders.filter(o => o.orderId !== orderId);
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed to complete delivery')
    });
  }
}
