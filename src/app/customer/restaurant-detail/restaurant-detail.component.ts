import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuApiService } from '../../core/services/menu-api.service';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { CartApiService } from '../../core/services/cart-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { ReviewApiService } from '../../core/services/review-api.service';
import { CategoryResponse, RestaurantResponse, MenuItemResponse, ReviewResponse } from '../../core/models/api.models';
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
        <div class="restaurant-header">
          @if (restaurant.imageUrl) {
            <img [src]="restaurant.imageUrl" class="rh-bg-img" alt="" (error)="onBannerError($event)" />
            <div class="rh-overlay"></div>
          }
          <div class="rh-content">
            <h1>{{ restaurant.name }}</h1>
            <p>{{ restaurant.description }}</p>
            <div class="rh-meta">
              <span class="badge badge-info">{{ restaurant.cuisine }}</span>
              <span>~{{ restaurant.estimatedDeliveryMin }} mins delivery</span>
              <span [class]="restaurant.isOpen ? 'badge badge-success' : 'badge badge-error'">{{ restaurant.isOpen ? 'Open' : 'Closed' }}</span>
              <!-- Rating display -->
              @if (restaurant.avgRating && restaurant.avgRating > 0) {
                <span class="rh-rating">⭐ {{ restaurant.avgRating | number:'1.1-1' }} / 5.0</span>
              } @else {
                <span class="rh-rating not-rated">⭐ Not rated yet</span>
              }
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
                  <div class="card-body mi-row">
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
                      <div class="mi-action-row mt-8">
                        @if (item.isAvailable && restaurant.isOpen) {
                          <button class="btn btn-primary btn-sm" (click)="addToCart(item)">Add +</button>
                        } @else if (!item.isAvailable) {
                          <span class="badge badge-error">Unavailable</span>
                        } @else {
                          <span class="badge badge-warning">Closed</span>
                        }
                      </div>
                    </div>
                    @if (item.imageUrl) {
                      <div class="mi-image-wrap">
                        <img
                          [src]="item.imageUrl"
                          [alt]="item.name"
                          class="mi-image"
                          (error)="onImgError($event)"
                        />
                      </div>
                    }
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

      <!-- Reviews Section -->
      @if (restaurant && reviews.length > 0) {
        <div class="reviews-section mt-32">
          <h2 class="mb-16">⭐ Customer Reviews ({{ reviews.length }})</h2>
          <div class="reviews-list">
            @for (review of reviews; track review.reviewId) {
              <div class="review-tile card">
                <div class="card-body">
                  <div class="review-tile-header">
                    <div class="review-stars">{{ renderStars(review.foodRating) }}</div>
                    <span class="text-muted text-sm">{{ review.reviewDate | date:'mediumDate' }}</span>
                  </div>
                  @if (review.comment) { <p class="review-text mt-8">"{{ review.comment }}"</p> }
                  @if (review.agentId) {
                    <p class="text-sm text-muted mt-4">🚴 Delivery: {{ renderStars(review.deliveryRating) }}</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .restaurant-header { border-radius: var(--radius-lg); padding: 40px 32px; margin-bottom: 8px; color: #fff; background: linear-gradient(135deg, #1A1A2E, #16213E); position: relative; overflow: hidden; }
    .rh-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
    .rh-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.55); z-index: 1; }
    .rh-content { position: relative; z-index: 2; }
    .rh-content h1 { font-size: 2rem; font-weight: 800; }
    .rh-content p { color: #d1d5db; margin: 8px 0 16px; }
    .rh-meta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; color: #e5e7eb; font-size: 0.9rem; }
    .rh-rating { font-size: 0.9rem; font-weight: 600; background: rgba(255,255,255,0.15); padding: 3px 10px; border-radius: 20px; }
    .rh-rating.not-rated { opacity: 0.75; font-style: italic; font-weight: 400; }
    .cat-title { font-size: 1.3rem; font-weight: 700; padding-bottom: 8px; border-bottom: 2px solid var(--border); margin-bottom: 16px; }
    .menu-item-card:hover { transform: none; }
    .mi-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .mi-info { flex: 1; min-width: 0; }
    .mi-info h4 { font-size: 1rem; margin: 6px 0 2px; }
    .mi-action-row { display: flex; align-items: center; }
    .mi-image-wrap { flex-shrink: 0; width: 96px; height: 96px; border-radius: var(--radius-sm); overflow: hidden; background: var(--surface); }
    .mi-image { width: 100%; height: 100%; object-fit: cover; display: block; }
    .sticky-cart-bar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--primary); color: #fff; padding: 12px 24px; border-radius: 30px; box-shadow: 0 4px 15px rgba(255, 75, 43, 0.4); display: flex; align-items: center; gap: 16px; font-weight: 700; z-index: 1000; animation: slideUp 0.3s ease; }
    .btn-light { background: #fff; color: var(--primary); border: none; font-weight: bold; }
    @keyframes slideUp { from { bottom: -50px; opacity: 0; } to { bottom: 24px; opacity: 1; } }
    .reviews-section { max-width: 900px; }
    .reviews-list { display: flex; flex-direction: column; gap: 12px; }
    .review-tile:hover { transform: none; }
    .review-tile-header { display: flex; justify-content: space-between; align-items: center; }
    .review-stars { color: #f59e0b; font-size: 1.1rem; letter-spacing: 2px; }
    .review-text { color: var(--text-muted); font-style: italic; font-size: 0.9rem; }
  `]
})
export class RestaurantDetailComponent implements OnInit {
  restaurant: RestaurantResponse | null = null;
  categories: CategoryResponse[] = [];
  reviews: ReviewResponse[] = [];
  loading = true; vegOnly = false;
  cartItemCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menuApi: MenuApiService,
    private restApi: RestaurantApiService,
    private cartApi: CartApiService,
    private auth: AuthApiService,
    private toast: ToastService,
    private reviewApi: ReviewApiService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    forkJoin({
      rest: this.restApi.getById(id).pipe(catchError(() => of(null))),
      menu: this.menuApi.getFullMenu(id).pipe(catchError(() => of([]))),
      reviews: this.reviewApi.getByRestaurant(id).pipe(catchError(() => of([])))
    }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        this.restaurant = res.rest;
        this.categories = res.menu;
        this.reviews = res.reviews;
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

  onBannerError(event: Event) {
    // If the banner image fails (hotlink block, 404 etc.), hide it — gradient fallback shows
    (event.target as HTMLElement).style.display = 'none';
    const overlay = (event.target as HTMLElement).nextElementSibling as HTMLElement;
    if (overlay) overlay.style.display = 'none';
  }

  /** Hide the image container entirely if the URL fails to load (e.g. Google hotlink block, 403, 404) */
  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    const wrapper = img.closest('.mi-image-wrap') as HTMLElement;
    if (wrapper) wrapper.style.display = 'none';
  }

  renderStars(rating: number): string { return '★'.repeat(rating) + '☆'.repeat(5 - rating); }

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
