import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { ToastService } from '../../core/services/toast.service';
import { RestaurantResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-restaurant-approval',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page container">
      <div class="page-header flex-between align-center">
        <h1>🏪 Restaurant Approvals</h1>
        <button class="btn btn-outline btn-sm" (click)="loadPending()">🔄 Refresh</button>
      </div>
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (restaurants.length === 0) { <div class="empty-state"><h3>No pending restaurants</h3></div> }
      @else {
        @for (r of restaurants; track r.restaurantId) {
          <div class="card mb-16"><div class="card-body flex-between">
            <div>
              <h3>{{ r.name }}</h3>
              <p class="text-muted text-sm">{{ r.cuisine }} • {{ r.city }} • Owner #{{ r.ownerId }}</p>
              <p class="text-sm">📞 {{ r.phone }}</p>
            </div>
            <div class="flex gap-8">
              @if (!r.isApproved) { <button class="btn btn-success btn-sm" (click)="approve(r)">✓ Approve</button> }
              <button class="btn btn-danger btn-sm" (click)="remove(r)">✕ Delete</button>
            </div>
          </div></div>
        }
      }
    </div>
  `
})
export class RestaurantApprovalComponent implements OnInit {
  restaurants: RestaurantResponse[] = []; loading = true;
  constructor(private restApi: RestaurantApiService, private toast: ToastService) {}
  ngOnInit() { this.loadPending(); }

  loadPending() {
    this.loading = true;
    this.restApi.getAll().subscribe({
      next: (r) => { 
        this.restaurants = r.filter(x => !x.isApproved); 
        this.loading = false; 
      },
      error: () => { this.loading = false; }
    });
  }

  approve(r: RestaurantResponse) { 
    this.restApi.approve(r.restaurantId).subscribe({ 
      next: (u) => { 
        this.restaurants = this.restaurants.filter(x => x.restaurantId !== r.restaurantId);
        this.toast.success(r.name + ' approved!'); 
      }, 
      error: (e) => this.toast.error(e.error?.message || 'Failed') 
    }); 
  }
  remove(r: RestaurantResponse) { this.restApi.delete(r.restaurantId).subscribe({ next: () => { this.restaurants = this.restaurants.filter(x => x.restaurantId !== r.restaurantId); this.toast.info('Restaurant removed'); } }); }
}
