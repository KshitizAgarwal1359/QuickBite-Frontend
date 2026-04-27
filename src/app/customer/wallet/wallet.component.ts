import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentApiService } from '../../core/services/payment-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { WalletResponse, WalletStatementResponse } from '../../core/models/api.models';
import { environment } from '../../../environments/environment';

declare var Razorpay: any;

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page container">
      <div class="page-header"><h1>👛 My Wallet</h1></div>
      <div class="wallet-layout">
        <div class="card wallet-balance-card">
          <div class="card-body">
            <p class="text-muted">Available Balance</p>
            <h2 class="balance">₹{{ wallet?.balance || 0 }}</h2>
            <div class="topup-section mt-24">
              <h4>Add Money</h4>
              <div class="flex gap-8 mt-8">
                <input type="number" class="form-control" [(ngModel)]="topupAmount" placeholder="Enter amount" min="1" />
                <button class="btn btn-primary" (click)="topUp()" [disabled]="topupLoading">{{ topupLoading ? 'Processing...' : 'Add' }}</button>
              </div>
              <div class="quick-amounts mt-8 flex gap-8">
                <button class="btn btn-outline btn-sm" (click)="topupAmount=100">₹100</button>
                <button class="btn btn-outline btn-sm" (click)="topupAmount=500">₹500</button>
                <button class="btn btn-outline btn-sm" (click)="topupAmount=1000">₹1000</button>
                <button class="btn btn-outline btn-sm" (click)="topupAmount=2000">₹2000</button>
              </div>
              <p class="text-sm text-muted mt-8">Payment processed via Razorpay. Click "Add" to open the payment window.</p>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h3>Transaction History</h3>
            @if (statements.length === 0) { <p class="text-muted mt-16">No transactions yet.</p> }
            @else {
              <div class="statements mt-16">
                @for (s of statements; track s.statementId) {
                  <div class="statement-row">
                    <div>
                      <span [class]="(s.type === 'DEPOSIT' || s.type === 'REFUND') ? 'badge badge-success' : 'badge badge-error'">{{ s.type }}</span>
                      <p class="text-sm mt-4">{{ s.description }}</p>
                    </div>
                    <div class="text-right">
                      <span [class]="(s.type === 'DEPOSIT' || s.type === 'REFUND') ? 'text-success font-bold' : 'text-error font-bold'">{{ (s.type === 'DEPOSIT' || s.type === 'REFUND') ? '+' : '-' }}₹{{ s.amount }}</span>
                      <p class="text-sm text-muted">{{ s.createdAt | date:'short' }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wallet-layout { display: grid; grid-template-columns: 380px 1fr; gap: 24px; }
    .wallet-balance-card { background: linear-gradient(135deg, #1A1A2E, #16213E); color: #fff; }
    .wallet-balance-card .text-muted { color: #9CA3AF; }
    .balance { font-size: 2.5rem; font-weight: 900; color: var(--accent); }
    .wallet-balance-card h4 { font-size: 0.95rem; }
    .statement-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .text-right { text-align: right; }
    .text-error { color: var(--error); }
    .text-success { color: var(--success); }
    @media (max-width: 768px) { .wallet-layout { grid-template-columns: 1fr; } }
  `]
})
export class WalletComponent implements OnInit {
  wallet: WalletResponse | null = null; statements: WalletStatementResponse[] = [];
  topupAmount: number = 100; topupLoading = false;
  private razorpayLoaded = false;

  constructor(private payApi: PaymentApiService, private auth: AuthApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadWallet();
    this.loadStatements();
    this.loadRazorpayScript();
  }

  loadWallet() { this.payApi.getWalletBalance(this.auth.getUserId()).subscribe({ next: (w) => this.wallet = w }); }
  loadStatements() { this.payApi.getWalletStatements(this.auth.getUserId()).subscribe({ next: (s) => this.statements = s }); }

  private loadRazorpayScript(): void {
    if (document.getElementById('razorpay-script')) { this.razorpayLoaded = true; return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => this.razorpayLoaded = true;
    document.body.appendChild(script);
  }

  topUp() {
    if (!this.topupAmount || this.topupAmount <= 0) {
      this.toast.error('Enter a valid amount');
      return;
    }

    if (this.razorpayLoaded && typeof Razorpay !== 'undefined') {
      this.openRazorpay();
    } else {
      // Fallback: simulate payment for testing
      this.processTopup('pay_simulated_' + Date.now());
    }
  }

  private openRazorpay() {
    const user = this.auth.getCurrentUser();
    const options = {
      key: environment.razorpayKey,
      amount: this.topupAmount * 100, // Razorpay expects paise
      currency: 'INR',
      name: 'QuickBite Wallet',
      description: 'Wallet Top-up ₹' + this.topupAmount,
      prefill: {
        name: user?.fullName || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: { color: '#FF4B2B' },
      handler: (response: any) => {
        this.processTopup(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => { this.topupLoading = false; }
      }
    };
    this.topupLoading = true;
    try {
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err) {
      this.topupLoading = false;
      this.toast.error('Failed to open payment gateway. Please try again.');
    }
  }

  private processTopup(paymentId: string) {
    this.topupLoading = true;
    this.payApi.addToWallet({ amount: this.topupAmount, razorpayPaymentId: paymentId }).subscribe({
      next: (w) => {
        this.wallet = w;
        this.topupLoading = false;
        this.loadStatements();
        this.toast.success('₹' + this.topupAmount + ' added to wallet!');
      },
      error: (e) => { this.topupLoading = false; this.toast.error(e.error?.message || 'Top-up failed'); }
    });
  }
}
