import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="card-body">
          <div class="auth-header">
            <span class="brand-icon">🍔</span>
            <h1>Join QuickBite</h1>
            <p class="text-muted">Create your account in seconds</p>
          </div>
          <form #regForm="ngForm" (ngSubmit)="regForm.valid && onRegister()" class="auth-form">
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input id="fullName" type="text" class="form-control" [(ngModel)]="fullName" name="fullName" placeholder="John Doe" required />
            </div>
            <div class="form-group">
              <label for="email">Email Address</label>
              <input id="email" type="email" class="form-control" [(ngModel)]="email" name="email" placeholder="you@example.com" required email />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input id="password" type="password" class="form-control" [(ngModel)]="password" name="password" placeholder="Min 6 characters" required minlength="6" />
            </div>
            <div class="form-group">
              <label for="phone">Phone (optional)</label>
              <input id="phone" type="tel" class="form-control" [(ngModel)]="phone" name="phone" placeholder="+91 9876543210" />
            </div>
            <div class="form-group">
              <label for="role">I am a</label>
              <select id="role" class="form-control" [(ngModel)]="role" name="role">
                <option value="CUSTOMER">Customer — Order food</option>
                <option value="OWNER">Restaurant Owner</option>
                <option value="AGENT">Delivery Agent</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading || regForm.invalid">
              {{ loading ? 'Creating account...' : 'Create Account' }}
            </button>
          </form>
          <p class="auth-footer text-center mt-24 text-muted">
            Already have an account? <a routerLink="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #FFF5F3 0%, #F8F9FA 100%); padding: 40px 20px; }
    .auth-card { width: 100%; max-width: 440px; }
    .auth-card .card-body { padding: 40px; }
    .auth-header { text-align: center; margin-bottom: 32px; }
    .auth-header .brand-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
    .auth-header h1 { font-size: 1.8rem; font-weight: 800; color: var(--secondary); }
    .auth-form { margin-top: 24px; }
    .auth-footer a { color: var(--primary); font-weight: 600; }
  `]
})
export class RegisterComponent {
  fullName = ''; email = ''; password = ''; phone = ''; role = 'CUSTOMER'; loading = false;
  constructor(private auth: AuthApiService, private router: Router, private toast: ToastService) {}

  onRegister() {
    this.loading = true;
    this.auth.register({ fullName: this.fullName, email: this.email, password: this.password, phone: this.phone || undefined, role: this.role }).subscribe({
      next: (res) => {
        this.toast.success('Welcome to QuickBite, ' + res.user.fullName + '!');
        const role = res.user.role;
        if (role === 'OWNER') this.router.navigate(['/owner']);
        else if (role === 'ADMIN') this.router.navigate(['/admin']);
        else if (role === 'AGENT') this.router.navigate(['/agent/register']);
        else this.router.navigate(['/']);
      },
      error: (err) => { this.loading = false; this.toast.error(err.error?.message || 'Registration failed'); }
    });
  }
}
