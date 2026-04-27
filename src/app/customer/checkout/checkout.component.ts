import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartApiService } from '../../core/services/cart-api.service';
import { OrderApiService } from '../../core/services/order-api.service';
import { PaymentApiService } from '../../core/services/payment-api.service';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { CartResponse } from '../../core/models/api.models';
import { environment } from '../../../environments/environment';

declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page container">
      <div class="page-header"><h1>💳 Checkout</h1></div>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (!cart) { <div class="empty-state"><h3>No items in cart</h3></div> }
      @else {
        <div class="checkout-layout">
          <div class="checkout-form card">
            <div class="card-body">
              <h3>Delivery Details</h3>
              <div class="form-group mt-16">
                <label for="address">Delivery Address</label>
                <input id="address" type="text" class="form-control" [(ngModel)]="deliveryAddress" placeholder="Enter full delivery address (min 10 chars)" required />
              </div>
              <div class="form-group mt-16">
                <label for="special">Special Instructions</label>
                <input id="special" type="text" class="form-control" [(ngModel)]="specialInstructions" placeholder="Any specific instructions for delivery..." />
              </div>
              <h3 class="mt-24">Payment Method</h3>
              <div class="payment-options mt-16">
                <label class="payment-option" [class.selected]="paymentMode === 'COD'"><input type="radio" name="pay" value="COD" [(ngModel)]="paymentMode" /><span>💵 Cash on Delivery</span></label>
                <label class="payment-option" [class.selected]="paymentMode === 'UPI'"><input type="radio" name="pay" value="UPI" [(ngModel)]="paymentMode" /><span>📱 UPI</span></label>
                <label class="payment-option" [class.selected]="paymentMode === 'CARD'"><input type="radio" name="pay" value="CARD" [(ngModel)]="paymentMode" /><span>💳 Card</span></label>
                <label class="payment-option" [class.selected]="paymentMode === 'WALLET'"><input type="radio" name="pay" value="WALLET" [(ngModel)]="paymentMode" /><span>👛 Wallet (₹{{ walletBalance }})</span></label>
              </div>
            </div>
          </div>
          <div class="checkout-summary card">
            <div class="card-body">
              <h3>Order Summary</h3>
              @for (item of cart.items; track item.itemId) {
                <div class="summary-row"><span>{{ item.name }} × {{ item.quantity }}</span><span>₹{{ item.subTotal }}</span></div>
              }
              @if (cart.discountAmount > 0) { <div class="summary-row text-success"><span>Discount</span><span>-₹{{ cart.discountAmount }}</span></div> }
              <div class="summary-row total"><span>Total</span><span class="price">₹{{ cart.finalPrice }}</span></div>
              <button class="btn btn-primary btn-lg btn-block mt-24" (click)="placeOrder()" [disabled]="placing">
                {{ placing ? 'Placing Order...' : 'Place Order — ₹' + cart.finalPrice }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .checkout-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
    .payment-options { display: flex; flex-direction: column; gap: 8px; }
    .payment-option { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 2px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition); }
    .payment-option.selected { border-color: var(--primary); background: #FFF5F3; }
    .payment-option input { accent-color: var(--primary); }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
    .summary-row.total { font-weight: 700; font-size: 1.1rem; border: none; }
    .text-success { color: var(--success); }
    @media (max-width: 768px) { .checkout-layout { grid-template-columns: 1fr; } }
  `]
})
export class CheckoutComponent implements OnInit {
  cart: CartResponse | null = null; loading = true; placing = false;
  deliveryAddress = ''; specialInstructions = ''; paymentMode = 'COD'; walletBalance = 0;
  private razorpayLoaded = false;

  constructor(private cartApi: CartApiService, private orderApi: OrderApiService, private paymentApi: PaymentApiService, private restaurantApi: RestaurantApiService, private auth: AuthApiService, private toast: ToastService, private router: Router) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state && state['reorderData']) {
      const data = state['reorderData'];
      this.cart = {
        cartId: 0,
        restaurantId: data.restaurantId,
        items: data.items.map((i: any) => ({ ...i, subTotal: i.price * i.quantity })),
        totalPrice: data.items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0),
        finalPrice: data.items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0) - (data.discount || 0),
        discountAmount: data.discount || 0,
        customerId: this.auth.getUserId()
      } as any;
      this.deliveryAddress = data.deliveryAddress || '';
      this.paymentMode = data.modeOfPayment || 'COD';
      this.loading = false;
    }
  }

  ngOnInit() {
    this.loadRazorpayScript();
    if (!this.cart) {
      if (history.state && history.state['reorderData']) {
        this.toast.info('Reorder data lost on refresh. Loading your current active cart.');
      }
      this.cartApi.getCart(this.auth.getUserId()).subscribe({ next: (c) => { this.cart = c; this.loading = false; }, error: () => this.loading = false });
    }
    this.paymentApi.getWalletBalance(this.auth.getUserId()).subscribe({ next: (w) => this.walletBalance = w.balance, error: () => {} });
  }

  private loadRazorpayScript(): void {
    if (document.getElementById('razorpay-script')) { this.razorpayLoaded = true; return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => this.razorpayLoaded = true;
    document.body.appendChild(script);
  }

  placeOrder() {
    if (!this.deliveryAddress.trim() || this.deliveryAddress.trim().length < 10) {
      this.toast.error('Please enter a full delivery address (min 10 chars)');
      return;
    }

    if (this.paymentMode === 'WALLET' && this.cart!.finalPrice > this.walletBalance) {
      this.toast.error('Insufficient wallet balance!');
      return;
    }

    this.placing = true;
    
    // Check if restaurant is still open before placing order
    this.restaurantApi.getById(this.cart!.restaurantId).subscribe({
      next: (r) => {
        if (!r.isOpen) {
          this.placing = false;
          this.toast.error('This restaurant is currently closed. Cannot place order.');
          return;
        }

        const req = {
          restaurantId: this.cart!.restaurantId,
          deliveryAddress: this.deliveryAddress,
          modeOfPayment: this.paymentMode,
          specialInstructions: this.specialInstructions,
          discount: this.cart!.discountAmount || 0,
          items: this.cart!.items.map(i => ({
            menuItemId: i.menuItemId,
            name: i.name,
            price: i.price,
            quantity: i.quantity
          }))
        };

        this.orderApi.placeOrder(req).subscribe({
          next: (order) => { 
            this.processPaymentForOrder(order.orderId, order.finalAmount);
          },
          error: (err) => { this.placing = false; this.toast.error(err.error?.message || 'Failed to place order'); }
        });
      },
      error: () => {
        this.placing = false;
        this.toast.error('Failed to verify restaurant status.');
      }
    });
  }

  private processPaymentForOrder(orderId: number, amount: number) {
    if (this.paymentMode === 'COD' || this.paymentMode === 'WALLET') {
      this.paymentApi.processPayment({ orderId, amount, mode: this.paymentMode }).subscribe({
        next: () => this.finalizeOrderSuccess(orderId),
        error: (err) => { this.placing = false; this.toast.error(err.error?.message || 'Payment processing failed'); this.router.navigate(['/order', orderId]); }
      });
    } else if (this.paymentMode === 'CARD' || this.paymentMode === 'UPI') {
      if (this.razorpayLoaded && typeof Razorpay !== 'undefined') {
        this.openRazorpayForOrder(orderId, amount);
      } else {
        this.placing = false;
        this.toast.error('Payment gateway failed to load. Please try again.');
        this.router.navigate(['/order', orderId]); // Order is placed, but payment is pending
      }
    }
  }

  private openRazorpayForOrder(orderId: number, amount: number) {
    this.paymentApi.createRazorpayOrder(amount).subscribe({
      next: (res) => {
        const user = this.auth.getCurrentUser();
        const options = {
          key: environment.razorpayKey,
          amount: amount * 100, // paise
          currency: 'INR',
          name: 'QuickBite',
          description: 'Order Payment',
          order_id: res.razorpayOrderId, // Use real server-generated Razorpay order ID
          prefill: { name: user?.fullName || '', email: user?.email || '', contact: user?.phone || '' },
          theme: { color: '#FF4B2B' },
          handler: (response: any) => {
            this.paymentApi.processPayment({
              orderId, amount, mode: this.paymentMode,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            }).subscribe({
              next: () => this.finalizeOrderSuccess(orderId),
              error: (err) => { this.placing = false; this.toast.error('Payment verification failed'); this.router.navigate(['/order', orderId]); }
            });
          },
          modal: {
            ondismiss: () => { 
              this.placing = false; 
              this.toast.error('Payment cancelled'); 
              this.router.navigate(['/order', orderId]); 
            }
          }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: () => {
        this.placing = false;
        this.toast.error('Failed to initialize payment gateway.');
        this.router.navigate(['/order', orderId]);
      }
    });
  }

  private finalizeOrderSuccess(orderId: number) {
    const clearRealCart = () => {
      this.cartApi.getCart(this.auth.getUserId()).subscribe({
        next: (c) => {
          if (c && c.cartId > 0) this.cartApi.clearCart(c.cartId).subscribe();
        }
      });
    };

    if (this.cart && this.cart.cartId > 0) {
      this.cartApi.clearCart(this.cart.cartId).subscribe({
        next: () => { this.toast.success('Order placed successfully!'); this.router.navigate(['/order', orderId]); },
        error: () => { this.toast.success('Order placed successfully!'); this.router.navigate(['/order', orderId]); }
      });
    } else {
      clearRealCart();
      this.toast.success('Order placed successfully!');
      this.router.navigate(['/order', orderId]);
    }
  }
}
