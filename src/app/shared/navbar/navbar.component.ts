import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { CartApiService } from '../../core/services/cart-api.service';
import { NotificationApiService } from '../../core/services/notification-api.service';
import { NotificationItem } from '../../core/models/api.models';
import { interval, Subscription } from 'rxjs';

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

            <!-- Notification Bell -->
            <div class="notif-wrap" (click)="toggleNotifPanel(); $event.stopPropagation()">
              <button class="notif-bell" [class.has-unread]="unreadCount > 0" title="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                @if (unreadCount > 0) {
                  <span class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
                }
              </button>

              @if (notifPanelOpen) {
                <div class="notif-panel" (click)="$event.stopPropagation()">
                  <div class="notif-header">
                    <strong>Notifications</strong>
                    @if (unreadCount > 0) {
                      <button class="notif-mark-all" (click)="markAllRead()">Mark all read</button>
                    }
                  </div>
                  <div class="notif-list">
                    @if (loadingNotifs) {
                      <div class="notif-empty">Loading...</div>
                    } @else if (notifications.length === 0) {
                      <div class="notif-empty">No notifications yet</div>
                    } @else {
                      @for (n of notifications; track n.notificationId) {
                        <div class="notif-item" [class.unread]="!n.isRead" (click)="markRead(n)">
                          <div class="notif-type-dot" [class]="getTypeDotClass(n.type)"></div>
                          <div class="notif-content">
                            <p class="notif-title">{{ n.title }}</p>
                            <p class="notif-msg">{{ n.message }}</p>
                            <p class="notif-time">{{ n.sentAt | date:'shortTime' }}</p>
                          </div>
                        </div>
                      }
                    }
                  </div>
                </div>
              }
            </div>

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

    /* Notification Bell */
    .notif-wrap { position: relative; }
    .notif-bell { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; transition: var(--transition); }
    .notif-bell:hover, .notif-bell.has-unread { color: var(--primary); }
    .notif-badge { position: absolute; top: -2px; right: -2px; background: var(--primary); color: #fff; font-size: 0.6rem; font-weight: 700; min-width: 16px; height: 16px; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 0 3px; }
    .notif-panel { position: absolute; top: calc(100% + 12px); right: -100px; width: 340px; background: #fff; border-radius: var(--radius-md); box-shadow: 0 8px 32px rgba(0,0,0,0.15); border: 1px solid var(--border); z-index: 2000; overflow: hidden; }
    .notif-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 0.95rem; }
    .notif-mark-all { background: none; border: none; color: var(--primary); font-size: 0.8rem; cursor: pointer; font-weight: 600; }
    .notif-list { max-height: 380px; overflow-y: auto; }
    .notif-empty { padding: 32px 16px; text-align: center; color: var(--text-muted); font-size: 0.9rem; }
    .notif-item { display: flex; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: var(--transition); }
    .notif-item:hover { background: var(--surface-hover); }
    .notif-item.unread { background: #fff8f6; }
    .notif-type-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .notif-type-dot.order { background: var(--primary); }
    .notif-type-dot.payment { background: #22c55e; }
    .notif-type-dot.promo { background: #f59e0b; }
    .notif-type-dot.delivery { background: #3b82f6; }
    .notif-type-dot.default { background: var(--text-muted); }
    .notif-content { flex: 1; min-width: 0; }
    .notif-title { font-weight: 700; font-size: 0.85rem; margin: 0 0 2px; color: var(--text); }
    .notif-msg { font-size: 0.8rem; color: var(--text-muted); margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-time { font-size: 0.72rem; color: var(--text-muted); margin: 0; }

    @media (max-width: 768px) {
      .mobile-toggle { display: block; }
      .nav-links { display: none; position: absolute; top: 70px; left: 0; right: 0; background: #fff; flex-direction: column; padding: 16px 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); align-items: flex-start; z-index: 999; border-bottom: 1px solid var(--border); }
      .nav-links.show { display: flex; }
      .nav-link { width: 100%; padding: 12px 0; border-bottom: 1px solid var(--border); }
      .nav-links .btn { width: 100%; margin-top: 12px; text-align: center; }
      .notif-panel { right: 0; width: 300px; }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  notifPanelOpen = false;
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  loadingNotifs = false;
  private pollSub: Subscription | null = null;

  constructor(
    public auth: AuthApiService,
    public cartApi: CartApiService,
    private notifApi: NotificationApiService
  ) {}

  ngOnInit() {
    this.auth.currentUser$.subscribe(user => {
      if (user && user.role === 'CUSTOMER') {
        this.cartApi.getCart(user.userId).subscribe();
      }
      if (user) {
        this.loadUnreadCount(user.userId);
        // Poll unread count every 30s
        this.pollSub = interval(30000).subscribe(() => this.loadUnreadCount(user.userId));
      } else {
        this.unreadCount = 0;
        this.pollSub?.unsubscribe();
      }
    });
  }

  ngOnDestroy() { this.pollSub?.unsubscribe(); }

  @HostListener('document:click')
  closePanel() { this.notifPanelOpen = false; }

  toggleNotifPanel() {
    this.notifPanelOpen = !this.notifPanelOpen;
    if (this.notifPanelOpen) this.loadNotifications();
  }

  loadUnreadCount(userId: number) {
    this.notifApi.getUnreadCount(userId).subscribe({
      next: (c) => this.unreadCount = c,
      error: () => {}
    });
  }

  loadNotifications() {
    const user = this.auth.getCurrentUser();
    if (!user) return;
    this.loadingNotifs = true;
    this.notifApi.getByRecipient(user.userId).subscribe({
      next: (ns) => { this.notifications = ns; this.loadingNotifs = false; },
      error: () => { this.loadingNotifs = false; }
    });
  }

  markRead(n: NotificationItem) {
    if (n.isRead) return;
    this.notifApi.markAsRead(n.notificationId).subscribe({
      next: () => {
        n.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      },
      error: () => {}
    });
  }

  markAllRead() {
    const user = this.auth.getCurrentUser();
    if (!user) return;
    this.notifApi.markAllRead(user.userId).subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
      },
      error: () => {}
    });
  }

  getTypeDotClass(type: string): string {
    const map: Record<string, string> = { ORDER: 'order', PAYMENT: 'payment', PROMO: 'promo', DELIVERY: 'delivery' };
    return map[type] || 'default';
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
      error: () => { this.auth.clearAuth(); window.location.href = '/login'; }
    });
  }
}
