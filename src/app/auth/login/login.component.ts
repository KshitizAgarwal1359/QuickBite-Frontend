import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="card-body">
          <div class="auth-header">
            <span class="brand-icon">🍔</span>
            <h1>Welcome Back</h1>
            <p class="text-muted">Sign in to your QuickBite account</p>
          </div>
          <form (ngSubmit)="loginForm.form.valid && onLogin()" #loginForm="ngForm" class="auth-form">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input id="email" type="email" class="form-control" [(ngModel)]="email" name="email" placeholder="you@example.com" required email />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input id="password" type="password" class="form-control" [(ngModel)]="password" name="password" placeholder="Enter your password" required minlength="6" />
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading || loginForm.invalid">
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
          <p class="auth-footer text-center mt-24 text-muted">
            Don't have an account? <a routerLink="/register">Create one</a>
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
    .auth-header p { margin-top: 4px; }
    .auth-form { margin-top: 24px; }
    .auth-footer a { color: var(--primary); font-weight: 600; }
  `]
})
export class LoginComponent {
  email = ''; password = ''; loading = false;
  constructor(private auth: AuthApiService, private router: Router, private toast: ToastService) {}

  onLogin() {
    this.loading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.toast.success('Welcome back, ' + res.user.fullName + '!');
        this.loading = false;
        const role = res.user.role;
        if (role === 'OWNER') this.router.navigate(['/owner']);
        else if (role === 'ADMIN') this.router.navigate(['/admin']);
        else if (role === 'AGENT') this.router.navigate(['/agent']);
        else this.router.navigate(['/']);
      },
      error: (err) => { this.loading = false; this.toast.error(err.error?.message || 'Login failed'); }
    });
  }
}
