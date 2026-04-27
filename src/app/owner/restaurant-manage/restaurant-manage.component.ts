import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-restaurant-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page container">
      <div class="page-header"><h1>{{ isEdit ? '🏪 Edit Restaurant' : '🏪 Register Restaurant' }}</h1></div>
      <div class="card" style="max-width:700px"><div class="card-body">
        <form (ngSubmit)="onSubmit()">
          <div class="form-group"><label>Restaurant Name</label><input type="text" class="form-control" [(ngModel)]="form.name" name="name" required /></div>
          <div class="form-group"><label>Description</label><input type="text" class="form-control" [(ngModel)]="form.description" name="desc" /></div>
          <div class="form-group"><label>Cuisine Type</label>
            <select class="form-control" [(ngModel)]="form.cuisine" name="cuisine"><option value="Indian">Indian</option><option value="Chinese">Chinese</option><option value="Italian">Italian</option><option value="Mexican">Mexican</option><option value="Continental">Continental</option></select>
          </div>
          <div class="form-group"><label>Phone</label><input type="tel" class="form-control" [(ngModel)]="form.phone" name="phone" required /></div>
          <div class="form-group"><label>Address</label><input type="text" class="form-control" [(ngModel)]="form.address" name="addr" required /></div>
          <div style="display:grid;grid-template-columns:1fr;gap:12px">
            <div class="form-group"><label>City</label><input type="text" class="form-control" [(ngModel)]="form.city" name="city" required /></div>
          </div>
          <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 8px; margin-top: 12px;">
            <label style="margin:0;">Location Coordinates</label>
            <button type="button" class="btn btn-outline btn-sm" (click)="detectLocation()">📍 Auto Detect</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px; margin-bottom: 16px;">
            <div class="form-group" style="margin:0"><input type="number" step="any" class="form-control" [(ngModel)]="form.latitude" name="lat" placeholder="Latitude" /></div>
            <div class="form-group" style="margin:0"><input type="number" step="any" class="form-control" [(ngModel)]="form.longitude" name="lng" placeholder="Longitude" /></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="form-group"><label>Delivery Radius (km)</label><input type="number" step="0.5" class="form-control" [(ngModel)]="form.deliveryRadius" name="radius" /></div>
            <div class="form-group"><label>Min Order (₹)</label><input type="number" class="form-control" [(ngModel)]="form.minOrderAmount" name="minOrder" /></div>
            <div class="form-group"><label>Est. Delivery (mins)</label><input type="number" class="form-control" [(ngModel)]="form.estimatedDeliveryMin" name="estDel" /></div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading || fetching">{{ loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Register Restaurant') }}</button>
        </form>
      </div></div>
    </div>
  `
})
export class RestaurantManageComponent {
  form: any = { name: '', description: '', cuisine: 'Indian', phone: '', address: '', city: '', latitude: 19.076, longitude: 72.877, deliveryRadius: 5.0, minOrderAmount: 0, estimatedDeliveryMin: 30 };
  loading = false;
  fetching = false;
  isEdit = false;
  editId: number | null = null;
  
  constructor(private restApi: RestaurantApiService, private toast: ToastService, private router: Router, private route: ActivatedRoute) {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.editId = Number(idParam);
      this.fetching = true;
      this.restApi.getById(this.editId).subscribe({
        next: (r) => { this.form = r; this.fetching = false; },
        error: () => { this.toast.error('Failed to load restaurant details'); this.fetching = false; }
      });
    }
  }

  detectLocation() {
    if ('geolocation' in navigator) {
      this.toast.info('Detecting location...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.form.latitude = Number(pos.coords.latitude.toFixed(6));
          this.form.longitude = Number(pos.coords.longitude.toFixed(6));
          this.toast.success('Location detected successfully!');
        },
        () => this.toast.error('Failed to get location. Please enter manually.')
      );
    } else {
      this.toast.error('Geolocation is not supported by your browser.');
    }
  }

  onSubmit() { 
    this.loading = true; 
    if (this.isEdit && this.editId) {
      const updatePayload = {
        name: this.form.name,
        description: this.form.description,
        cuisine: this.form.cuisine,
        phone: this.form.phone,
        address: this.form.address,
        city: this.form.city,
        latitude: this.form.latitude,
        longitude: this.form.longitude,
        deliveryRadius: this.form.deliveryRadius,
        minOrderAmount: this.form.minOrderAmount,
        estimatedDeliveryMin: this.form.estimatedDeliveryMin
      };
      
      this.restApi.update(this.editId, updatePayload).subscribe({ 
        next: () => { this.toast.success('Restaurant updated successfully!'); this.router.navigate(['/owner']); }, 
        error: (e) => { this.loading = false; this.toast.error(e.error?.message || 'Failed to update'); } 
      });
    } else {
      this.restApi.register(this.form).subscribe({ 
        next: () => { this.toast.success('Restaurant registered! Pending admin approval.'); this.router.navigate(['/owner']); }, 
        error: (e) => { this.loading = false; this.toast.error(e.error?.message || 'Failed'); } 
      }); 
    }
  }
}
