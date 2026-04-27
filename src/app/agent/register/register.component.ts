import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryApiService } from '../../core/services/delivery-api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-agent-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page container">
      <div class="page-header"><h1>🚴 Register as Delivery Agent</h1></div>
      <div class="card" style="max-width:500px"><div class="card-body">
        <form (ngSubmit)="onRegister()">
          <div class="form-group"><label>Full Name</label><input type="text" class="form-control" [(ngModel)]="form.fullName" name="fn" required /></div>
          <div class="form-group"><label>Phone</label><input type="tel" class="form-control" [(ngModel)]="form.phone" name="ph" required /></div>
          <div class="form-group"><label>Vehicle Type</label>
            <select class="form-control" [(ngModel)]="form.vehicleType" name="vt"><option value="BIKE">Bike</option><option value="SCOOTER">Scooter</option><option value="CYCLE">Cycle</option></select>
          </div>
          <div class="form-group"><label>Vehicle Number</label><input type="text" class="form-control" [(ngModel)]="form.vehicleNumber" name="vn" placeholder="MH-01-AB-1234" required /></div>
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">{{ loading ? 'Registering...' : 'Submit Registration' }}</button>
        </form>
      </div></div>
    </div>
  `
})
export class AgentRegisterComponent {
  form = { fullName: '', phone: '', vehicleType: 'BIKE', vehicleNumber: '' }; loading = false;
  constructor(private deliveryApi: DeliveryApiService, private toast: ToastService, private router: Router) {}
  onRegister() {
    this.loading = true;
    this.deliveryApi.registerAgent(this.form).subscribe({
      next: (res) => { 
        sessionStorage.setItem('qb_agent_id', res.agentId.toString());
        this.toast.success('Registration submitted! Await admin verification.'); 
        this.router.navigate(['/agent']); 
      },
      error: (e) => { 
        this.loading = false; 
        const msg = e.error?.message || '';
        if (msg.toLowerCase().includes('already registered')) {
          this.toast.info('You are already registered as an agent.');
          this.router.navigate(['/agent']);
        } else {
          this.toast.error(msg || 'Failed'); 
        }
      }
    });
  }
}
