import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderApiService } from '../../core/services/order-api.service';
import { ToastService } from '../../core/services/toast.service';
import { OrderResponse } from '../../core/models/api.models';
import { Subject, timer } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-owner-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page container">
      <div class="page-header"><h1>📦 Restaurant Orders</h1></div>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (orders.length === 0) { <div class="empty-state"><h3>No orders yet</h3></div> }
      @else {
        @for (order of orders; track order.orderId) {
          <div class="card mb-16"><div class="card-body">
            <div class="flex-between">
              <div><h3>Order #{{ order.orderId }}</h3><p class="text-sm text-muted">{{ order.orderDate | date:'medium' }} • Customer #{{ order.customerId }}</p></div>
              <span [class]="'badge badge-' + getColor(order.orderStatus)">{{ order.orderStatus }}</span>
            </div>
            <div class="mt-8">@for (item of order.items; track item.orderItemId) { <span class="text-sm" style="margin-right:12px">{{ item.name }} × {{ item.quantity }}</span> }</div>
            <div class="flex-between mt-16">
              <span class="price">₹{{ order.finalAmount }}</span>
              <div class="flex gap-8">
                @if (order.orderStatus === 'PLACED' || order.orderStatus === 'CONFIRMED') {
                  <button class="btn btn-outline btn-sm" style="color:var(--error);border-color:var(--error)" (click)="cancelOrder(order)">Cancel</button>
                }
                @if (order.orderStatus === 'PLACED') { <button class="btn btn-success btn-sm" (click)="updateStatus(order, 'CONFIRMED')">Confirm</button> }
                @if (order.orderStatus === 'CONFIRMED') { <button class="btn btn-accent btn-sm" (click)="updateStatus(order, 'PREPARING')">Start Preparing</button> }
                @if (order.orderStatus === 'PREPARING') { <button class="btn btn-primary btn-sm" (click)="updateStatus(order, 'PICKED_UP')">Ready for Pickup</button> }
              </div>
            </div>
          </div></div>
        }
      }
    </div>
  `
})
export class OwnerOrdersComponent implements OnInit, OnDestroy {
  orders: OrderResponse[] = []; loading = true;
  private destroy$ = new Subject<void>();
  restId!: number;

  constructor(private route: ActivatedRoute, private orderApi: OrderApiService, private toast: ToastService) {}

  ngOnInit() {
    this.restId = Number(this.route.snapshot.paramMap.get('restId'));
    timer(0, 20000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.orderApi.getRestaurantOrders(this.restId))
    ).subscribe({
      next: (data) => {
        this.orders = this.sortOrders(data);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sortOrders(orders: OrderResponse[]): OrderResponse[] {
    const activeStates = ['PLACED', 'CONFIRMED', 'PREPARING'];
    return orders.sort((a, b) => {
      const aActive = activeStates.includes(a.orderStatus) ? 1 : 0;
      const bActive = activeStates.includes(b.orderStatus) ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive; // Active first
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(); // Newest first
    });
  }

  getColor(s: string): string { const m: Record<string, string> = { PLACED: 'info', CONFIRMED: 'info', PREPARING: 'warning', PICKED_UP: 'warning', CUSTOMER_RECEIVED: 'success', DELIVERED: 'success', CANCELLED: 'error' }; return m[s] || 'info'; }
  
  updateStatus(order: OrderResponse, status: string) { 
    this.orderApi.updateStatus(order.orderId, { orderStatus: status }).subscribe({ 
      next: (o) => { 
        order.orderStatus = o.orderStatus; 
        this.orders = this.sortOrders([...this.orders]);
        this.toast.success('Status updated to ' + status); 
      }, 
      error: (e) => this.toast.error(e.error?.message || 'Failed') 
    }); 
  }

  cancelOrder(order: OrderResponse) {
    if (!confirm(`Are you sure you want to cancel Order #${order.orderId}? If payment was made, a refund will be initiated.`)) return;
    this.orderApi.cancelOrderByOwner(order.orderId, this.restId).subscribe({
      next: (o) => {
        order.orderStatus = o.orderStatus;
        this.orders = this.sortOrders([...this.orders]);
        this.toast.info(`Order #${order.orderId} cancelled${order.modeOfPayment !== 'COD' ? ' — refund initiated' : ''}`);
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed to cancel order')
    });
  }
}
