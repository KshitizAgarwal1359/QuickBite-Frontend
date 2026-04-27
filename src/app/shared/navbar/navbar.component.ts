import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { CartApiService } from '../../core/services/cart-api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a [routerLink]="brandLink" class="nav-brand">
          <span class="brand-icon">🍔</span>
          <span class="brand-text">Quick<span class="brand-accent">Bite</span></span>
        </a>

        <button class="mobile-toggle" (click)="mobileMenuOpen = !mobileMenuOpen">☰</button>

        <div class="nav-links" [class.show]="mobileMenuOpen">
          @if (!(auth.isLoggedIn$ | async)) {
            <a routerLink="/login" class="btn btn-outline btn-sm" (click)="mobileMenuOpen=false">Login</a>
            <a routerLink="/register" class="btn btn-primary btn-sm" (click)="mobileMenuOpen=false">Sign Up</a>
          } @else {
            @switch (auth.getUserRole()) {
              @case ('CUSTOMER') {
                <a routerLink="/" class="nav-link" (click)="mobileMenuOpen=false">Home</a>
                <a routerLink="/cart" class="nav-link" (click)="mobileMenuOpen=false">
                  🛒 Cart @if (cartApi.cartCount$ | async) { <span class="cart-badge">{{ cartApi.cartCount$ | async }}</span> }
                </a>
                <a routerLink="/orders" class="nav-link" (click)="mobileMenuOpen=false">Orders</a>
                <a routerLink="/wallet" class="nav-link" (click)="mobileMenuOpen=false">Wallet</a>
              }
              @case ('OWNER') {
                <a routerLink="/owner" class="nav-link" (click)="mobileMenuOpen=false">Dashboard</a>
                <a routerLink="/owner/restaurant" class="nav-link" (click)="mobileMenuOpen=false">Restaurants</a>
              }
              @case ('ADMIN') {
                <a routerLink="/admin" class="nav-link" (click)="mobileMenuOpen=false">Dashboard</a>
                <a routerLink="/admin/restaurants" class="nav-link" (click)="mobileMenuOpen=false">Approvals</a>
                <a routerLink="/admin/agents" class="nav-link" (click)="mobileMenuOpen=false">Agents</a>
                <a routerLink="/admin/orders" class="nav-link" (click)="mobileMenuOpen=false">Orders</a>
                <a routerLink="/admin/refunds" class="nav-link" (click)="mobileMenuOpen=false">Refunds</a>
              }
              @case ('AGENT') {
                <a routerLink="/agent" class="nav-link" (click)="mobileMenuOpen=false">Dashboard</a>
                <a routerLink="/agent/deliveries" class="nav-link" (click)="mobileMenuOpen=false">Deliveries</a>
              }
            }
            <a routerLink="/profile" class="nav-link" (click)="mobileMenuOpen=false">{{ (auth.getCurrentUser()?.fullName?.split(' ') || [''])[0] || 'Profile' }}</a>
            <button (click)="onLogout(); mobileMenuOpen=false" class="btn btn-sm btn-outline">Logout</button>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 1000; backdrop-filter: blur(10px); }
    .nav-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; height: 70px; display: flex; align-items: center; justify-content: space-between; position: relative; }
    .nav-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; }
    .brand-icon { font-size: 1.8rem; }
    .brand-text { font-size: 1.5rem; font-weight: 800; color: var(--secondary); }
    .brand-accent { color: var(--primary); }
    .nav-links { display: flex; align-items: center; gap: 16px; }
    .nav-link { color: var(--text-muted); font-weight: 500; font-size: 0.95rem; transition: var(--transition); padding: 6px 0; display: flex; align-items: center; gap: 4px; }
    .nav-link:hover { color: var(--primary); }
    .cart-badge { background: var(--primary); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 10px; }
    .mobile-toggle { display: none; background: none; border: none; font-size: 1.8rem; cursor: pointer; color: var(--text); padding: 4px; }
    @media (max-width: 768px) {
      .mobile-toggle { display: block; }
      .nav-links { display: none; position: absolute; top: 70px; left: 0; right: 0; background: #fff; flex-direction: column; padding: 16px 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); align-items: flex-start; z-index: 999; border-bottom: 1px solid var(--border); }
      .nav-links.show { display: flex; }
      .nav-link { width: 100%; padding: 12px 0; border-bottom: 1px solid var(--border); }
      .nav-links .btn { width: 100%; margin-top: 12px; text-align: center; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  mobileMenuOpen = false;
  constructor(public auth: AuthApiService, public cartApi: CartApiService) {}

  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      if (user && user.role === 'CUSTOMER') {
        this.cartApi.getCart(user.userId).subscribe();
      }
    });
  }

  get brandLink(): string {
    if (!this.auth.isLoggedIn()) return '/';
    const role = this.auth.getUserRole();
    if (role === 'OWNER') return '/owner';
    if (role === 'ADMIN') return '/admin';
    if (role === 'AGENT') return '/agent';
    return '/';
  }

  onLogout() {
    this.auth.logout().subscribe({
      next: () => {},
      error: () => {
        // If API fails, still force clear local state to secure client
        this.auth.clearAuth();
        window.location.href = '/login';
      }
    });
  }
}
