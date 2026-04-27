import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { UserProfile } from '../../core/models/api.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page container">
      <div class="page-header"><h1>👤 My Profile</h1></div>
      @if (user) {
        <div class="profile-grid">
          <div class="card"><div class="card-body">
            <h3>Profile Details</h3>
            <form (ngSubmit)="updateProfile()" class="mt-16">
              <div class="form-group text-center mb-16">
                @if (profilePicUrl) {
                  <img [src]="profilePicUrl" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);" onerror="this.src='https://ui-avatars.com/api/?name=User&background=random'" />
                }
              </div>
              <div class="form-group"><label>Profile Picture URL</label><input type="url" class="form-control" [(ngModel)]="profilePicUrl" name="pic" placeholder="https://..." /></div>
              <div class="form-group"><label>Full Name</label><input type="text" class="form-control" [(ngModel)]="fullName" name="fn" /></div>
              <div class="form-group"><label>Phone</label><input type="tel" class="form-control" [(ngModel)]="phone" name="ph" /></div>
              <div class="form-group"><label>Email</label><input type="email" class="form-control" [value]="user.email" disabled /></div>
              <div class="form-group"><label>Role</label><input type="text" class="form-control" [value]="user.role" disabled /></div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
          </div></div>
          
          <div style="display:flex; flex-direction:column; gap:24px;">
            <div class="card"><div class="card-body">
              <h3>Change Password</h3>
              <form (ngSubmit)="changePassword()" class="mt-16">
                <div class="form-group"><label>Current Password</label><input type="password" class="form-control" [(ngModel)]="currentPwd" name="cp" /></div>
                <div class="form-group"><label>New Password</label><input type="password" class="form-control" [(ngModel)]="newPwd" name="np" /></div>
                <button type="submit" class="btn btn-secondary">Update Password</button>
              </form>
            </div></div>
            
            <div class="card" style="border-color: var(--error);"><div class="card-body">
              <h3 style="color: var(--error);">Danger Zone</h3>
              <p class="text-muted mt-8 mb-16 text-sm">Once you deactivate your account, there is no going back. Please be certain.</p>
              <button class="btn btn-danger btn-block" (click)="deactivateAccount()">Deactivate Account</button>
            </div></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`.profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; } @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }`]
})
export class ProfileComponent implements OnInit {
  user: UserProfile | null = null; fullName = ''; phone = ''; profilePicUrl = ''; currentPwd = ''; newPwd = '';
  constructor(private auth: AuthApiService, private toast: ToastService, private router: Router) {}
  ngOnInit() { this.auth.getProfile().subscribe(u => { this.user = u; this.fullName = u.fullName; this.phone = u.phone; this.profilePicUrl = u.profilePicUrl || ''; }); }
  updateProfile() { this.auth.updateProfile({ fullName: this.fullName, phone: this.phone, profilePicUrl: this.profilePicUrl }).subscribe({ next: () => this.toast.success('Profile updated!'), error: (e) => this.toast.error(e.error?.message || 'Failed') }); }
  changePassword() { this.auth.changePassword({ currentPassword: this.currentPwd, newPassword: this.newPwd }).subscribe({ next: () => { this.toast.success('Password changed!'); this.currentPwd = ''; this.newPwd = ''; }, error: (e) => this.toast.error(e.error?.message || 'Failed') }); }

  deactivateAccount() {
    if (!confirm('Are you sure you want to deactivate your account? This action is permanent and you will be logged out immediately.')) return;
    this.auth.deactivateAccount().subscribe({
      next: () => {
        this.toast.info('Account deactivated successfully.');
        this.auth.clearAuth();
        this.router.navigate(['/login']);
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed to deactivate account')
    });
  }
}
