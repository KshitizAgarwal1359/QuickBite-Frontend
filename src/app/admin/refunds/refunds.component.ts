import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentApiService } from '../../core/services/payment-api.service';
import { OrderApiService } from '../../core/services/order-api.service';
import { ToastService } from '../../core/services/toast.service';
import { PaymentResponse, OrderResponse } from '../../core/models/api.models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface RefundableItem {
  payment: PaymentResponse;
  order: OrderResponse | null;
}

@Component({
  selector: 'app-admin-refunds',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page container">
      <div class="page-header flex-between align-center">
        <div>
          <h1>💸 Refund Management</h1>
          <p>Process refunds for cancelled orders paid via Wallet, Card, or UPI.</p>
        </div>
        <button class="btn btn-outline btn-sm" (click)="loadRefundables()">🔄 Refresh</button>
      </div>

      @if (loading) {
        <div class="loading-spinner"></div>
      } @else if (items.length === 0) {
        <div class="empty-state">
          <h3>No refunds pending</h3>
          <p>There are no cancelled orders with completed payments.</p>
        </div>
      } @else {
        <div class="grid grid-2">
          @for (item of items; track item.payment.paymentId) {
            <div class="card mb-16">
              <div class="card-body">
                <div class="flex-between">
                  <h3>Order #{{ item.payment.orderId }}</h3>
                  <span [class]="'badge badge-' + getBadge(item.payment.status)">{{ item.payment.status }}</span>
                </div>
                <p class="text-sm mt-4"><strong>Payment ID:</strong> #{{ item.payment.paymentId }}</p>
                <p class="text-sm mt-4"><strong>Amount:</strong> ₹{{ item.payment.amount }}</p>
                <p class="text-sm mt-4"><strong>Mode:</strong> {{ item.payment.mode }}</p>
                <p class="text-sm mt-4 text-muted">Paid on {{ item.payment.paidAt | date:'short' }}</p>

                <div class="mt-16 flex gap-8">
                  @if (item.payment.status === 'PAID' && item.order?.orderStatus === 'CANCELLED') {
                    <button class="btn btn-danger btn-sm btn-block" (click)="processRefund(item.payment)">Process Refund</button>
                  } @else if (item.payment.status === 'REFUNDED') {
                    <p class="text-success font-bold mt-8">✓ Refund processed on {{ item.payment.refundedAt | date:'short' }}</p>
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
export class RefundsComponent implements OnInit {
  items: RefundableItem[] = [];
  loading = true;

  constructor(
    private paymentApi: PaymentApiService,
    private orderApi: OrderApiService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadRefundables();
  }

  loadRefundables() {
    this.loading = true;
    this.paymentApi.getAllPayments().subscribe({
      next: (payments) => {
        // Filter out COD, as they don't get refunded. Keep PAID and REFUNDED for visibility.
        const nonCod = payments.filter(p => p.mode !== 'COD' && (p.status === 'PAID' || p.status === 'REFUNDED'));
        
        if (nonCod.length === 0) {
          this.items = [];
          this.loading = false;
          return;
        }

        const orderRequests = nonCod.map(p => this.orderApi.getOrder(p.orderId).pipe(catchError(() => of(null))));
        
        forkJoin(orderRequests).subscribe({
          next: (orders) => {
            const mapped = nonCod.map((p, index) => ({
              payment: p,
              order: orders[index]
            }));

            // Only show items where the order was actually cancelled
            this.items = mapped.filter(item => item.order?.orderStatus === 'CANCELLED');
            this.loading = false;
          },
          error: () => this.loading = false
        });
      },
      error: () => this.loading = false
    });
  }

  processRefund(payment: PaymentResponse) {
    if (!confirm('Are you sure you want to process a full refund of ₹' + payment.amount + ' for Payment #' + payment.paymentId + '?')) return;
    
    this.paymentApi.refundPayment(payment.paymentId).subscribe({
      next: (p) => {
        this.toast.success('Refund processed successfully!');
        const item = this.items.find(i => i.payment.paymentId === payment.paymentId);
        if (item) {
          item.payment = p; // update status to REFUNDED
        }
      },
      error: (e) => this.toast.error(e.error?.message || 'Refund failed')
    });
  }

  getBadge(status: string) {
    if (status === 'PAID') return 'success';
    if (status === 'REFUNDED') return 'info';
    return 'warning';
  }
}
