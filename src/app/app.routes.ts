import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';
import { inject } from '@angular/core';
import { AuthApiService } from './core/services/auth-api.service';

export const routes: Routes = [
  // ─── Auth ─────────────────────────────────────────────
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },

  // ─── Customer ─────────────────────────────────────────
  { path: '', loadComponent: () => import('./customer/home/home.component').then(m => m.HomeComponent) },
  { path: 'restaurant/:id', loadComponent: () => import('./customer/restaurant-detail/restaurant-detail.component').then(m => m.RestaurantDetailComponent) },
  { path: 'cart', canActivate: [authGuard, roleGuard('CUSTOMER')], loadComponent: () => import('./customer/cart/cart.component').then(m => m.CartComponent) },
  { path: 'checkout', canActivate: [authGuard, roleGuard('CUSTOMER')], loadComponent: () => import('./customer/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'orders', canActivate: [authGuard, roleGuard('CUSTOMER')], loadComponent: () => import('./customer/order-history/order-history.component').then(m => m.OrderHistoryComponent) },
  { path: 'order/:id', canActivate: [authGuard], loadComponent: () => import('./customer/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent) },
  { path: 'wallet', canActivate: [authGuard, roleGuard('CUSTOMER')], loadComponent: () => import('./customer/wallet/wallet.component').then(m => m.WalletComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./customer/profile/profile.component').then(m => m.ProfileComponent) },

  // ─── Owner ────────────────────────────────────────────
  { path: 'owner', canActivate: [authGuard, roleGuard('OWNER')], loadComponent: () => import('./owner/dashboard/dashboard.component').then(m => m.OwnerDashboardComponent) },
  { path: 'owner/restaurant', canActivate: [authGuard, roleGuard('OWNER')], loadComponent: () => import('./owner/restaurant-manage/restaurant-manage.component').then(m => m.RestaurantManageComponent) },
  { path: 'owner/restaurant/:id', canActivate: [authGuard, roleGuard('OWNER')], loadComponent: () => import('./owner/restaurant-manage/restaurant-manage.component').then(m => m.RestaurantManageComponent) },
  { path: 'owner/menu/:restId', canActivate: [authGuard, roleGuard('OWNER')], loadComponent: () => import('./owner/menu-manage/menu-manage.component').then(m => m.MenuManageComponent) },
  { path: 'owner/orders/:restId', canActivate: [authGuard, roleGuard('OWNER')], loadComponent: () => import('./owner/orders/orders.component').then(m => m.OwnerOrdersComponent) },

  // ─── Admin ────────────────────────────────────────────
  { path: 'admin', canActivate: [authGuard, roleGuard('ADMIN')], loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
  { path: 'admin/restaurants', canActivate: [authGuard, roleGuard('ADMIN')], loadComponent: () => import('./admin/restaurant-approval/restaurant-approval.component').then(m => m.RestaurantApprovalComponent) },
  { path: 'admin/agents', canActivate: [authGuard, roleGuard('ADMIN')], loadComponent: () => import('./admin/agent-verification/agent-verification.component').then(m => m.AgentVerificationComponent) },
  { path: 'admin/orders', canActivate: [authGuard, roleGuard('ADMIN')], loadComponent: () => import('./admin/active-orders/active-orders.component').then(m => m.ActiveOrdersComponent) },
  { path: 'admin/refunds', canActivate: [authGuard, roleGuard('ADMIN')], loadComponent: () => import('./admin/refunds/refunds.component').then(m => m.RefundsComponent) },

  // ─── Agent ────────────────────────────────────────────
  { path: 'agent', canActivate: [authGuard, roleGuard('AGENT')], loadComponent: () => import('./agent/dashboard/dashboard.component').then(m => m.AgentDashboardComponent) },
  { path: 'agent/register', canActivate: [authGuard, roleGuard('AGENT')], loadComponent: () => import('./agent/register/register.component').then(m => m.AgentRegisterComponent) },
  { path: 'agent/deliveries', canActivate: [authGuard, roleGuard('AGENT')], loadComponent: () => import('./agent/active-deliveries/active-deliveries.component').then(m => m.AgentActiveDeliveriesComponent) },

  // ─── Wildcard ─────────────────────────────────────────
  { 
    path: '**', 
    redirectTo: () => {
      const auth = inject(AuthApiService);
      if (auth.isLoggedIn()) {
        const role = auth.getUserRole();
        if (role === 'OWNER') return 'owner';
        if (role === 'ADMIN') return 'admin';
        if (role === 'AGENT') return 'agent';
      }
      return '';
    }
  }
];
