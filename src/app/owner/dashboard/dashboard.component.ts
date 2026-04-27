import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { RestaurantResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page container">
      <div class="page-header"><h1>🏪 Owner Dashboard</h1><p>Manage your restaurants</p></div>
      <a routerLink="/owner/restaurant" class="btn btn-primary mb-24">+ Register New Restaurant</a>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (restaurants.length === 0) { <div class="empty-state"><h3>No restaurants registered</h3></div> }
      @else {
        <div class="grid grid-2">
          @for (r of restaurants; track r.restaurantId) {
            <div class="card"><div class="card-body">
              <div class="flex-between">
                <h3>{{ r.name }}</h3>
                <span [class]="r.isApproved ? 'badge badge-success' : 'badge badge-warning'">{{ r.isApproved ? 'Approved' : 'Pending' }}</span>
              </div>
              <p class="text-muted text-sm">{{ r.cuisine }} • {{ r.city }}</p>
              <p class="text-sm mt-4">{{ r.isOpen ? '🟢 Open' : '🔴 Closed' }}</p>
              <div class="flex gap-8 mt-16">
                <a [routerLink]="['/owner/restaurant', r.restaurantId]" class="btn btn-outline btn-sm">Edit</a>
                <a [routerLink]="['/owner/menu', r.restaurantId]" class="btn btn-outline btn-sm">Menu</a>
                <a [routerLink]="['/owner/orders', r.restaurantId]" class="btn btn-outline btn-sm">Orders</a>
                <button class="btn btn-sm" [class.btn-success]="!r.isOpen" [class.btn-danger]="r.isOpen" (click)="toggleOpen(r)" [disabled]="!r.isApproved">{{ r.isOpen ? 'Close' : 'Open' }}</button>
              </div>
            </div></div>
          }
        </div>
      }
    </div>
  `
})
export class OwnerDashboardComponent implements OnInit {
  restaurants: RestaurantResponse[] = []; loading = true;
  constructor(private restApi: RestaurantApiService, private auth: AuthApiService, private toast: ToastService) {}
  ngOnInit() { this.restApi.getByOwner(this.auth.getUserId()).subscribe({ next: (r) => { this.restaurants = r; this.loading = false; }, error: () => this.loading = false }); }
  
  toggleOpen(r: RestaurantResponse) {
    if (!r.isApproved) {
      this.toast.error("Cannot open a restaurant that is pending admin approval.");
      return;
    }
    this.restApi.toggleOpen(r.restaurantId).subscribe({
      next: (updated) => { r.isOpen = updated.isOpen; },
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    }); 
  }
}
