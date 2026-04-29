import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { RestaurantResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1>Delicious food,<br/><span class="hero-accent">delivered fast.</span></h1>
          <p>Discover the best restaurants near you and order your favourite meals in minutes.</p>
          <div class="search-bar">
            <input type="text" class="search-input" placeholder="Search restaurants or dishes..." [(ngModel)]="searchQuery" (keyup.enter)="onSearch()" />
            @if (searchQuery) {
              <button class="btn" style="background:#fff; color:var(--error); padding: 0 16px; border-radius: var(--radius-sm);" (click)="clearSearch()">Clear</button>
            }
            <button class="btn btn-primary" (click)="onSearch()">Search</button>
          </div>
        </div>
      </div>
    </section>

    <section class="container page">
      <!-- City Selector -->
      <div class="city-selector mb-24">
        <div class="flex gap-8" style="align-items:center;flex-wrap:wrap">
          <span class="text-muted" style="font-weight:600">📍 Your City:</span>
          <input type="text" class="form-control" style="max-width:200px" [(ngModel)]="selectedCity" placeholder="Enter your city" (keyup.enter)="loadByCity()" />
          <button class="btn btn-primary btn-sm" (click)="loadByCity()">Go</button>
          <button class="btn btn-outline btn-sm" (click)="detectLocation()">📍 Use My Location</button>
        </div>
        @if (selectedCity) { <p class="text-sm text-muted mt-8">Showing restaurants in <strong>{{ selectedCity }}</strong></p> }
      </div>

      <div class="cuisine-filters mb-24">
        <button class="chip" [class.active]="selectedCuisine === ''" (click)="filterCuisine('')">🍽️ All</button>
        <button class="chip" [class.active]="selectedCuisine === 'Indian'" (click)="filterCuisine('Indian')">🍛 Indian</button>
        <button class="chip" [class.active]="selectedCuisine === 'Chinese'" (click)="filterCuisine('Chinese')">🥡 Chinese</button>
        <button class="chip" [class.active]="selectedCuisine === 'Italian'" (click)="filterCuisine('Italian')">🍕 Italian</button>
        <button class="chip" [class.active]="selectedCuisine === 'Mexican'" (click)="filterCuisine('Mexican')">🌮 Mexican</button>
        <button class="chip" [class.active]="selectedCuisine === 'Continental'" (click)="filterCuisine('Continental')">🥩 Continental</button>
      </div>

      @if (loading) { <div class="loading-spinner"></div> }
      @else if (!selectedCity && !searchQuery && filteredRestaurants.length === 0) {
        <div class="empty-state">
          <h3>Welcome to QuickBite!</h3>
          <p>Enter your city above to find restaurants near you.</p>
        </div>
      }
      @else if (filteredRestaurants.length === 0) {
        <div class="empty-state">
          <h3>No restaurants found</h3>
          <p>Try a different city, search, or cuisine filter.</p>
        </div>
      } @else {
        <div class="grid grid-3">
          @for (r of filteredRestaurants; track r.restaurantId) {
            <a [routerLink]="['/restaurant', r.restaurantId]" class="card restaurant-card">
              <div class="restaurant-img" [style.background]="getGradient(r.cuisine)">
                @if (r.imageUrl) {
                  <img [src]="r.imageUrl" class="restaurant-img-bg" alt="" (error)="onCardImgError($event)" />
                }
                <span class="cuisine-badge">{{ r.cuisine }}</span>
                @if (!r.isOpen) { <span class="closed-badge">Closed</span> }
              </div>
              <div class="card-body">
                <h3>{{ r.name }}</h3>
                <p class="text-muted text-sm">{{ r.address }}, {{ r.city }}</p>
                <div class="flex-between mt-8">
                  <span class="badge badge-info text-sm">~{{ r.estimatedDeliveryMin }} mins delivery</span>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .hero { background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%); padding: 80px 0; }
    .hero-content { max-width: 600px; }
    .hero-content h1 { font-size: 3rem; font-weight: 900; color: #fff; line-height: 1.1; }
    .hero-accent { color: var(--primary); }
    .hero-content p { color: #9CA3AF; margin: 16px 0 28px; font-size: 1.1rem; }
    .search-bar { display: flex; gap: 8px; }
    .search-input { flex: 1; padding: 14px 20px; border: none; border-radius: var(--radius-sm); font-size: 1rem; font-family: var(--font); outline: none; }
    .city-selector { background: var(--surface); padding: 16px 20px; border-radius: var(--radius); box-shadow: var(--shadow); }
    .cuisine-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip { padding: 8px 20px; border: 2px solid var(--border); border-radius: var(--radius-pill); background: #fff; font-family: var(--font); font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: var(--transition); }
    .chip:hover, .chip.active { border-color: var(--primary); background: var(--primary); color: #fff; }
    .restaurant-card { text-decoration: none; color: inherit; }
    .restaurant-img { height: 160px; position: relative; overflow: hidden; display: flex; align-items: flex-start; justify-content: space-between; padding: 12px; }
    .restaurant-img-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
    .cuisine-badge { position: relative; z-index: 1; background: rgba(255,255,255,0.9); padding: 4px 12px; border-radius: var(--radius-pill); font-size: 0.75rem; font-weight: 600; }
    .closed-badge { position: relative; z-index: 1; background: var(--error); color: #fff; padding: 4px 12px; border-radius: var(--radius-pill); font-size: 0.75rem; font-weight: 600; }
    .restaurant-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
    @media (max-width: 768px) { .hero-content h1 { font-size: 2rem; } }
  `]
})
export class HomeComponent implements OnInit {
  allRestaurants: RestaurantResponse[] = [];
  filteredRestaurants: RestaurantResponse[] = [];
  searchQuery = ''; selectedCuisine = ''; selectedCity = ''; loading = false;

  constructor(private restaurantApi: RestaurantApiService, private auth: AuthApiService, private router: Router) {}

  ngOnInit() {
    // Redirect non-customer roles to their respective dashboards
    if (this.auth.isLoggedIn()) {
      const role = this.auth.getUserRole();
      if (role === 'OWNER') { this.router.navigate(['/owner']); return; }
      if (role === 'ADMIN') { this.router.navigate(['/admin']); return; }
      if (role === 'AGENT') { this.router.navigate(['/agent']); return; }
    }
    // Only customers and guests reach here
    this.detectLocation();
  }

  detectLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.loading = true;
          this.restaurantApi.getNearby(pos.coords.latitude, pos.coords.longitude, 50).subscribe({
            next: (data) => {
              this.allRestaurants = data;
              this.applyFilters();
              this.loading = false;
              if (data.length > 0) this.selectedCity = data[0].city;
            },
            error: () => { this.loading = false; }
          });
        },
        () => { 
          // user denied geolocation or error — they can type city manually
          this.loading = false;
        }
      );
    } else {
      this.loading = false;
    }
  }

  loadByCity() {
    if (!this.selectedCity.trim()) return;
    this.loading = true;
    this.selectedCuisine = '';
    this.searchQuery = '';
    this.restaurantApi.getByCity(this.selectedCity.trim()).subscribe({
      next: (data) => { this.allRestaurants = data; this.applyFilters(); this.loading = false; },
      error: () => { this.allRestaurants = []; this.filteredRestaurants = []; this.loading = false; }
    });
  }

  onSearch() {
    const q = this.searchQuery.trim();
    if (!q) { this.clearSearch(); return; }
    this.loading = true;
    this.restaurantApi.search(q).subscribe({
      next: (apiData) => {
        // Also filter the currently-loaded city list locally for broader matching
        const lq = q.toLowerCase();
        const localMatches = this.allRestaurants.filter(r =>
          r.name.toLowerCase().includes(lq) ||
          r.cuisine.toLowerCase().includes(lq) ||
          (r.description && r.description.toLowerCase().includes(lq))
        );
        // Merge API results + local matches, deduplicated by restaurantId
        const merged = [...apiData];
        localMatches.forEach(r => {
          if (!merged.find(m => m.restaurantId === r.restaurantId)) merged.push(r);
        });
        this.selectedCuisine = '';
        this.allRestaurants = merged;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        // API failed — fall back to local filtering only
        const lq = q.toLowerCase();
        const localMatches = this.allRestaurants.filter(r =>
          r.name.toLowerCase().includes(lq) ||
          r.cuisine.toLowerCase().includes(lq) ||
          (r.description && r.description.toLowerCase().includes(lq))
        );
        this.selectedCuisine = '';
        this.filteredRestaurants = localMatches;
        this.loading = false;
      }
    });
  }

  clearSearch() {
    this.searchQuery = '';
    if (this.selectedCity) {
      this.loadByCity();
    } else {
      this.detectLocation();
    }
  }

  filterCuisine(cuisine: string) {
    this.selectedCuisine = cuisine;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.allRestaurants];
    if (this.selectedCuisine) {
      result = result.filter(r => r.cuisine.toLowerCase() === this.selectedCuisine.toLowerCase());
    }
    // Sort open restaurants first
    result.sort((a,b) => (b.isOpen ? 1 : 0) - (a.isOpen ? 1 : 0));
    
    this.filteredRestaurants = result;
  }

  onCardImgError(event: Event) {
    // If card image fails to load, hide it — gradient fallback stays visible
    (event.target as HTMLElement).style.display = 'none';
  }

  getGradient(cuisine: string): string {
    const gradients: Record<string, string> = {
      'Indian': 'linear-gradient(135deg, #FF9933, #FF5722)', 'Chinese': 'linear-gradient(135deg, #E53935, #D32F2F)',
      'Italian': 'linear-gradient(135deg, #43A047, #2E7D32)', 'Mexican': 'linear-gradient(135deg, #F57F17, #FF6F00)',
      'Continental': 'linear-gradient(135deg, #1565C0, #0D47A1)',
    };
    return gradients[cuisine] || 'linear-gradient(135deg, #667eea, #764ba2)';
  }
}
