import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuApiService } from '../../core/services/menu-api.service';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { CartApiService } from '../../core/services/cart-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { CategoryResponse, RestaurantResponse, MenuItemResponse } from '../../core/models/api.models';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page container">
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (restaurant) {
        <div class="restaurant-header" [style.background]="'linear-gradient(135deg, #1A1A2E, #16213E)'">
          <div class="rh-content">
            <h1>{{ restaurant.name }}</h1>
            <p>{{ restaurant.description }}</p>
            <div class="rh-meta">
              <span class="badge badge-info">{{ restaurant.cuisine }}</span>
              <span>~{{ restaurant.estimatedDeliveryMin }} mins delivery</span>
              <span [class]="restaurant.isOpen ? 'badge badge-success' : 'badge badge-error'">{{ restaurant.isOpen ? 'Open' : 'Closed' }}</span>
            </div>
          </div>
        </div>

        <div class="menu-controls flex-between mt-24 mb-16">
          <h2>Menu</h2>
          <button class="btn btn-sm" [class.btn-primary]="vegOnly" [class.btn-outline]="!vegOnly" (click)="toggleVeg()">🥬 Veg Only</button>
        </div>

        @if (!restaurant.isOpen) {
          <div class="banner mb-24" style="padding: 12px 16px; background: #fff3cd; color: #856404; border-radius: var(--radius-sm); border-left: 4px solid #ffc107;">
            <strong>Heads up!</strong> This restaurant is currently closed. You can browse the menu, but cannot place orders.
          </div>
        }

        @if (categories.length === 0) {
          <div class="empty-state"><h3>No menu items available</h3><p>This restaurant hasn't added any items yet.</p></div>
        }

        @for (cat of categories; track cat.categoryId) {
          <div class="menu-category mb-24">
            <h3 class="cat-title">{{ cat.name }}</h3>
            @if (cat.description) { <p class="text-muted text-sm mb-8">{{ cat.description }}</p> }
            <div class="grid grid-2">
              @for (item of getFilteredItems(cat); track item.itemId) {
                <div class="card menu-item-card">
                  <div class="card-body flex-between">
                    <div class="mi-info">
                      <span [class]="item.isVeg ? 'badge badge-veg' : 'badge badge-nonveg'">{{ item.isVeg ? '● Veg' : '● Non-veg' }}</span>
                      <h4>{{ item.name }}</h4>
                      <p class="text-muted text-sm">{{ item.description }}</p>
                      <div class="flex gap-8 mt-8">
                        @if (item.discountedPrice && item.discountedPrice < item.price) {
                          <span class="price">₹{{ item.discountedPrice }}</span>
                          <span class="price-old">₹{{ item.price }}</span>
                        } @else {
                          <span class="price">₹{{ item.price }}</span>
                        }
                      </div>
                      @if (item.calories) { <span class="text-sm text-muted">{{ item.calories }} cal</span> }
                    </div>
                    <div class="mi-action">
                      @if (item.isAvailable && restaurant.isOpen) {
                        <button class="btn btn-primary btn-sm" (click)="addToCart(item)">Add +</button>
                      } @else if (!item.isAvailable) {
                        <span class="badge badge-error">Unavailable</span>
                      } @else {
                        <span class="badge badge-warning">Closed</span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }

      @if (cartItemCount > 0) {
        <div class="sticky-cart-bar">
          <span>{{ cartItemCount }} item(s) in cart</span>
          <button class="btn btn-sm btn-light" (click)="goToCart()">View Cart →</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .restaurant-header { border-radius: var(--radius-lg); padding: 40px 32px; margin-bottom: 8px; color: #fff; }
    .rh-content h1 { font-size: 2rem; font-weight: 800; }
    .rh-content p { color: #d1d5db; margin: 8px 0 16px; }
    .rh-meta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; color: #e5e7eb; font-size: 0.9rem; }
    .cat-title { font-size: 1.3rem; font-weight: 700; padding-bottom: 8px; border-bottom: 2px solid var(--border); margin-bottom: 16px; }
    .menu-item-card:hover { transform: none; }
    .mi-info { flex: 1; }
    .mi-info h4 { font-size: 1rem; margin: 6px 0 2px; }
    .mi-action { display: flex; align-items: center; }
    .sticky-cart-bar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--primary); color: #fff; padding: 12px 24px; border-radius: 30px; box-shadow: 0 4px 15px rgba(255, 75, 43, 0.4); display: flex; align-items: center; gap: 16px; font-weight: 700; z-index: 1000; animation: slideUp 0.3s ease; }
    .btn-light { background: #fff; color: var(--primary); border: none; font-weight: bold; }
    @keyframes slideUp { from { bottom: -50px; opacity: 0; } to { bottom: 24px; opacity: 1; } }
  `]
})
export class RestaurantDetailComponent implements OnInit {
  restaurant: RestaurantResponse | null = null;
  categories: CategoryResponse[] = [];
  loading = true; vegOnly = false;
  cartItemCount = 0;

  constructor(private route: ActivatedRoute, private router: Router, private menuApi: MenuApiService, private restApi: RestaurantApiService, private cartApi: CartApiService, private auth: AuthApiService, private toast: ToastService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    forkJoin({
      rest: this.restApi.getById(id).pipe(catchError(() => of(null))),
      menu: this.menuApi.getFullMenu(id).pipe(catchError(() => of([])))
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        this.restaurant = res.rest;
        this.categories = res.menu;
      }
    });

    if (this.auth.isLoggedIn()) {
      this.cartApi.getCart(this.auth.getUserId()).subscribe({
        next: (c) => {
          if (c && c.restaurantId === id) {
            this.cartItemCount = c.items.reduce((acc, i) => acc + i.quantity, 0);
          }
        },
        error: () => {}
      });
    }
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  toggleVeg() { this.vegOnly = !this.vegOnly; }

  getFilteredItems(cat: CategoryResponse): MenuItemResponse[] {
    return this.vegOnly ? (cat.items || []).filter(i => i.isVeg) : (cat.items || []);
  }

  addToCart(item: MenuItemResponse) {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    
    const request = {
      restaurantId: this.restaurant!.restaurantId,
      menuItemId: item.itemId,
      name: item.name,
      price: item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price,
      quantity: 1
    };

    this.cartApi.addItem(request).subscribe({
      next: () => { 
        this.toast.success(item.name + ' added to cart!');
        this.cartItemCount += 1;
      },
      error: (err) => {
        const msg = err.error?.message || '';
        if (msg.includes('Cart is tied to RestaurantId')) {
          if (confirm(`Your cart has items from another restaurant. Clear and add new item?`)) {
            this.cartApi.getCart(this.auth.getUserId()).subscribe({
              next: (cart) => {
                this.cartApi.clearCart(cart.cartId).subscribe({
                  next: () => {
                    this.cartApi.addItem(request).subscribe({
                      next: () => {
                        this.toast.success(item.name + ' added to cart!');
                        this.cartItemCount = 1;
                      },
                      error: (e) => this.toast.error(e.error?.message || 'Could not add to cart')
                    });
                  }
                });
              }
            });
          }
        } else {
          this.toast.error(msg || 'Could not add to cart');
        }
      }
    });
  }
}
