import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeliveryApiService } from '../../core/services/delivery-api.service';
import { OrderApiService } from '../../core/services/order-api.service';
import { ToastService } from '../../core/services/toast.service';
import { OrderResponse } from '../../core/models/api.models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    const storedId = localStorage.getItem('qb_agent_id');
    if (storedId) {
      this.agentId = Number(storedId);
      this.loadDeliveries();
    } else {
      this.loading = false;
    }
  }

  loadDeliveries() {
    if (!this.agentId) return;
    this.loading = true;
    this.deliveryApi.getActiveDeliveries(this.agentId).subscribe({
      next: (orderIds) => {
        if (orderIds.length === 0) {
          this.orders = [];
          this.loading = false;
          return;
        }
        const requests = orderIds.map(id => this.orderApi.getOrder(id).pipe(catchError(() => of(null))));
        forkJoin(requests).subscribe(results => {
          this.orders = results.filter((o): o is OrderResponse => o !== null);
          this.loading = false;
        });
      },
      error: () => { this.loading = false; }
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
