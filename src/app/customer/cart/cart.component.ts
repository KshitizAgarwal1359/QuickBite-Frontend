import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartApiService } from '../../core/services/cart-api.service';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { CartResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page container">
      <div class="page-header"><h1>🛒 Your Cart</h1></div>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (!cart || !cart.items || cart.items.length === 0) {
        <div class="empty-state"><h3>Your cart is empty</h3><p>Browse restaurants and add items to get started.</p><a routerLink="/" class="btn btn-primary mt-16">Browse Restaurants</a></div>
      } @else {
        <div class="cart-layout">
          <div class="cart-items">
            @for (item of cart.items; track item.itemId) {
              <div class="card cart-item-card">
                <div class="card-body flex-between">
                  <div>
                    <h4>{{ item.name }}</h4>
                    @if (item.customization) { <p class="text-muted text-sm">{{ item.customization }}</p> }
                    <p class="price mt-4">₹{{ item.price }} × {{ item.quantity }} = ₹{{ item.subTotal }}</p>
                  </div>
                  <div class="qty-controls">
                    <button class="qty-btn" (click)="updateQty(item.itemId, item.quantity - 1)">−</button>
                    <span class="qty-val">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="updateQty(item.itemId, item.quantity + 1)">+</button>
                    <button class="btn btn-danger btn-sm" (click)="removeItem(item.itemId)" style="margin-left:8px">✕</button>
                  </div>
                </div>
              </div>
            }
          </div>
          <div class="cart-summary card">
            <div class="card-body">
              <h3>Order Summary</h3>
              <div class="summary-row"><span>Subtotal</span><span>₹{{ cart.totalPrice }}</span></div>
              @if (cart.discountAmount > 0) { <div class="summary-row text-success"><span>Discount</span><span>-₹{{ cart.discountAmount }}</span></div> }
              <div class="summary-row total"><span>Total</span><span class="price">₹{{ cart.finalPrice }}</span></div>
              <div class="promo-section mt-16">
                <input type="text" class="form-control" [(ngModel)]="promoCode" placeholder="Promo code" />
                <button class="btn btn-accent btn-sm mt-8 btn-block" (click)="applyPromo()">Apply Code</button>
              </div>
              @if (isRestaurantOpen) {
                <a routerLink="/checkout" class="btn btn-primary btn-lg btn-block mt-16 text-center" style="display:block">Proceed to Checkout</a>
              } @else {
                <button class="btn btn-primary btn-lg btn-block mt-16" disabled>Restaurant Closed</button>
              }
              <button class="btn btn-outline btn-sm btn-block mt-8" (click)="clearCart()">Clear Cart</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-layout { display: grid; grid-template-columns: 1fr 360px; gap: 24px; }
    .cart-item-card:hover { transform: none; }
    .cart-item-card h4 { font-weight: 600; }
    .qty-controls { display: flex; align-items: center; gap: 8px; }
    .qty-btn { width: 32px; height: 32px; border: 2px solid var(--border); border-radius: 50%; background: #fff; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
    .qty-btn:hover { border-color: var(--primary); color: var(--primary); }
    .qty-val { font-weight: 700; min-width: 20px; text-align: center; }
    .cart-summary h3 { font-weight: 700; margin-bottom: 16px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .summary-row.total { font-weight: 700; font-size: 1.1rem; border-bottom: none; }
    .text-success { color: var(--success); }
    @media (max-width: 768px) { .cart-layout { grid-template-columns: 1fr; } }
  `]
})
export class CartComponent implements OnInit {
  cart: CartResponse | null = null; loading = true; promoCode = '';
  isRestaurantOpen = true;
  constructor(private cartApi: CartApiService, private restApi: RestaurantApiService, private auth: AuthApiService, private toast: ToastService, private router: Router) {}

  ngOnInit() { this.loadCart(); }

  loadCart() { 
    this.cartApi.getCart(this.auth.getUserId()).subscribe({ 
      next: (c) => { 
        this.cart = c; 
        if (c && c.restaurantId > 0) {
          this.restApi.getById(c.restaurantId).subscribe({ next: (r) => this.isRestaurantOpen = r.isOpen });
        }
        this.loading = false; 
      }, 
      error: () => { this.cart = null; this.loading = false; } 
    }); 
  }

  private handleCartUpdate(newCart: CartResponse) {
    const hadPromo = !!this.cart?.promoCode;
    this.cart = newCart;
    if (hadPromo && !newCart.promoCode) {
      this.toast.info('Promo code removed due to cart modification');
      this.promoCode = '';
    }
  }

  updateQty(itemId: number, qty: number) {
    if (qty < 1) {
      if (!confirm('Remove this item from your cart?')) return;
      return this.removeItem(itemId);
    }
    this.cartApi.updateQuantity({ cartId: this.cart!.cartId, itemId, quantity: qty }).subscribe({ next: (c) => this.handleCartUpdate(c), error: (e) => this.toast.error(e.error?.message || 'Failed') });
  }

  removeItem(itemId: number) { this.cartApi.removeItem(this.cart!.cartId, itemId).subscribe({ next: (c) => { this.handleCartUpdate(c); this.toast.info('Item removed'); }, error: (e) => this.toast.error(e.error?.message || 'Failed') }); }

  clearCart() { 
    if (!confirm('Are you sure you want to completely empty your cart?')) return;
    this.cartApi.clearCart(this.cart!.cartId).subscribe({ next: () => { this.cart = null; this.toast.info('Cart cleared'); }, error: (e) => this.toast.error(e.error?.message || 'Failed') }); 
  }

  applyPromo() { if (!this.promoCode.trim()) return; this.cartApi.applyPromo({ cartId: this.cart!.cartId, promoCode: this.promoCode }).subscribe({ next: (c) => { this.cart = c; this.toast.success('Promo applied!'); }, error: (e) => this.toast.error(e.error?.message || 'Invalid promo') }); }
}
