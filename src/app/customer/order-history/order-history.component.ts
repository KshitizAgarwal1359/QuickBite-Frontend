import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OrderApiService } from '../../core/services/order-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { OrderResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page container">
      <div class="page-header"><h1>📦 Order History</h1></div>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (orders.length === 0) { <div class="empty-state"><h3>No orders yet</h3><p>Start ordering from your favorite restaurants!</p></div> }
      @else {
        <div class="orders-list">
          @for (order of orders; track order.orderId) {
            <div class="card order-card">
              <div class="card-body">
                <div class="flex-between">
                  <div><h3>Order #{{ order.orderId }}</h3><p class="text-muted text-sm">{{ order.orderDate | date:'medium' }}</p></div>
                  <span [class]="'badge badge-' + getStatusColor(order.orderStatus)">{{ order.orderStatus }}</span>
                </div>
                <div class="order-items mt-8">
                  @for (item of order.items; track item.orderItemId) { <span class="text-sm">{{ item.name }} × {{ item.quantity }}</span> }
                </div>
                <div class="flex-between mt-16">
                  <span class="price">₹{{ order.finalAmount }}</span>
                  <div class="flex gap-8">
                    <a [routerLink]="['/order', order.orderId]" class="btn btn-outline btn-sm">Track</a>
                    <button class="btn btn-primary btn-sm" (click)="reorder(order.orderId)" [disabled]="reordering === order.orderId">
                      {{ reordering === order.orderId ? '...' : 'Reorder' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-list { display: flex; flex-direction: column; gap: 16px; }
    .order-card:hover { transform: none; }
    .order-card h3 { font-size: 1rem; font-weight: 700; }
    .order-items { display: flex; flex-wrap: wrap; gap: 8px; }
    .order-items span { background: var(--surface-hover); padding: 4px 10px; border-radius: var(--radius-pill); }
  `]
})
export class OrderHistoryComponent implements OnInit {
  orders: OrderResponse[] = []; loading = true; reordering: number | null = null;
  constructor(private orderApi: OrderApiService, private auth: AuthApiService, private router: Router) {}
  ngOnInit() { this.orderApi.getCustomerOrders(this.auth.getUserId()).subscribe({ next: (o) => { this.orders = o; this.loading = false; }, error: () => this.loading = false }); }
  getStatusColor(s: string): string { const map: Record<string, string> = { PLACED: 'info', CONFIRMED: 'info', PREPARING: 'warning', PICKED_UP: 'warning', DELIVERED: 'success', CANCELLED: 'error' }; return map[s] || 'info'; }
  reorder(orderId: number) {
    this.reordering = orderId;
    this.orderApi.reorder(orderId).subscribe({
      next: (data) => {
        this.reordering = null;
        this.router.navigate(['/checkout'], { state: { reorderData: data } });
      },
      error: () => this.reordering = null
    });
  }
}
