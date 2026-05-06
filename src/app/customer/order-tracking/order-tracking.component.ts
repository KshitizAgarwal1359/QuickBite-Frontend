import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderApiService } from '../../core/services/order-api.service';
import { DeliveryApiService } from '../../core/services/delivery-api.service';
import { ReviewApiService } from '../../core/services/review-api.service';
import { AuthApiService } from '../../core/services/auth-api.service';
import { ToastService } from '../../core/services/toast.service';
import { OrderResponse, AgentResponse, ReviewResponse } from '../../core/models/api.models';
import { environment } from '../../../environments/environment';
import { Subject, timer } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';

declare var L: any;

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page container">
      @if (loading) { <div class="loading-spinner"></div> }
      @else if (order) {
        <div class="page-header">
          <h1>Order #{{ order.orderId }}</h1>
          <p class="text-muted">Placed on {{ order.orderDate | date:'medium' }}</p>
          @if (estimatedMin !== null) {
            <h3 class="text-primary mt-8">⏱️ Estimated arrival in {{ estimatedMin }} min</h3>
          }
        </div>
        <div class="tracking-layout">
          <div class="card"><div class="card-body">
            <h3>Order Status</h3>
            <div class="status-stepper mt-24">
              @for (step of statusSteps; track step) {
                <div class="step" [class.active]="isStepActive(step)" [class.current]="order.orderStatus === step">
                  <div class="step-dot"></div>
                  <span class="step-label">{{ step.replace('_', ' ') }}</span>
                </div>
              }
            </div>
          </div></div>
          <div class="card mt-24"><div class="card-body">
            <h3>Items</h3>
            @for (item of order.items; track item.orderItemId) {
              <div class="summary-row"><span>{{ item.name }} × {{ item.quantity }}</span><span>₹{{ item.subTotal }}</span></div>
            }
            <div class="summary-row total mt-8"><span>Total</span><span class="price">₹{{ order.finalAmount }}</span></div>
            <div class="mt-16 text-sm text-muted">
              <p>📍 {{ order.deliveryAddress }}</p>
              <p>💰 {{ order.modeOfPayment }}</p>
              @if (agent) { 
                <div class="agent-card mt-8">
                  <p><strong>🚴 Delivery Agent:</strong> {{ agent.fullName }}</p>
                  <p>📞 {{ agent.phone }} | 🚗 {{ agent.vehicleType }} ({{ agent.vehicleNumber }})</p>
                  <p>⭐
                    @if (agent.avgRating && agent.avgRating > 0) {
                      {{ agent.avgRating | number:'1.1-1' }} / 5.0
                    } @else {
                      <span class="text-muted" style="font-style:italic;font-size:0.85rem;">Not rated yet</span>
                    }
                  </p>
                </div>
              } @else if (order.deliveryAgentId) { 
                <p>🚴 Agent ID: {{ order.deliveryAgentId }}</p> 
              }
            </div>
            @if (order.orderStatus === 'PLACED' || order.orderStatus === 'CONFIRMED') {
              <button class="btn btn-danger btn-block mt-16" (click)="cancelOrder()">Cancel Order</button>
            }
            @if (order.orderStatus === 'CANCELLED') {
              <div class="mt-16 p-12 text-sm" style="background: var(--surface-hover); border-left: 3px solid var(--danger); border-radius: var(--radius-sm);">
                <strong>Order Cancelled.</strong>
                @if (order.modeOfPayment !== 'COD') {
                  <p class="mt-4">Your refund has been initiated and will be processed to your original payment method shortly.</p>
                }
              </div>
            }

            @if (order.orderStatus === 'PICKED_UP') {
              <button class="btn btn-success btn-block mt-16 mb-8" (click)="confirmReceipt()" style="font-size: 1.1rem; padding: 12px;">✅ I Have Received My Order</button>
            }

            @if ((order.orderStatus === 'PICKED_UP' || order.orderStatus === 'CUSTOMER_RECEIVED' || order.orderStatus === 'DELIVERED') && agent) {
              <div class="live-map mt-24">
                <h4>Live Tracking</h4>
                <div id="tracking-map" class="map-container mt-8">
                  @if (!agentLocation) {
                    <div class="map-placeholder">Waiting for GPS signal...</div>
                  }
                </div>
              </div>
            }
          </div></div>

          <!-- ─── Review Section ─────────────────────────────────────────────── -->
          @if (order.orderStatus === 'CUSTOMER_RECEIVED' || order.orderStatus === 'DELIVERED') {
            <div class="card mt-24 review-card">
              <div class="card-body">
                @if (existingReview) {
                  <div class="review-done">
                    <h3>✅ Your Review</h3>
                    <div class="review-stars-row mt-12">
                      <div>
                        <p class="review-label">🍔 Food Quality</p>
                        <div class="stars-display">{{ renderStars(existingReview.foodRating) }}</div>
                      </div>
                      @if (existingReview.agentId) {
                        <div>
                          <p class="review-label">🚴 Delivery Experience</p>
                          <div class="stars-display">{{ renderStars(existingReview.deliveryRating) }}</div>
                        </div>
                      }
                    </div>
                    @if (existingReview.comment) {
                      <p class="review-comment mt-12">"{{ existingReview.comment }}"</p>
                    }
                    <p class="text-muted text-sm mt-8">Submitted on {{ existingReview.reviewDate | date:'mediumDate' }}</p>
                  </div>
                } @else if (!reviewSubmitted) {
                  <h3>⭐ Rate Your Experience</h3>
                  <p class="text-muted text-sm mt-4">How was your order? Your feedback helps us improve!</p>

                  <div class="review-form mt-16">
                    <div class="review-section">
                      <p class="review-label">🍔 Food Quality</p>
                      <div class="star-picker">
                        @for (star of [1,2,3,4,5]; track star) {
                          <button class="star-btn" [class.active]="foodRating >= star" (click)="foodRating = star" [title]="star + ' star'">★</button>
                        }
                        <span class="star-label">{{ getRatingLabel(foodRating) }}</span>
                      </div>
                    </div>

                    @if (order.deliveryAgentId) {
                      <div class="review-section mt-16">
                        <p class="review-label">🚴 Delivery Experience</p>
                        <div class="star-picker">
                          @for (star of [1,2,3,4,5]; track star) {
                            <button class="star-btn" [class.active]="deliveryRating >= star" (click)="deliveryRating = star" [title]="star + ' star'">★</button>
                          }
                          <span class="star-label">{{ getRatingLabel(deliveryRating) }}</span>
                        </div>
                      </div>
                    }

                    <div class="mt-16">
                      <p class="review-label">💬 Comment (optional)</p>
                      <textarea class="review-textarea" [(ngModel)]="reviewComment" placeholder="Tell us about your experience..." rows="3" maxlength="500"></textarea>
                      <p class="text-muted text-sm" style="text-align:right;">{{ reviewComment.length }}/500</p>
                    </div>

                    <button class="btn btn-primary btn-block mt-16" (click)="submitReview()" [disabled]="foodRating === 0 || submittingReview">
                      {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
                    </button>
                  </div>
                } @else {
                  <div class="review-done">
                    <p style="font-size:2rem; text-align:center;">🎉</p>
                    <h3 style="text-align:center;">Thank you for your feedback!</h3>
                    <p class="text-muted text-sm" style="text-align:center;">Your review helps the QuickBite community.</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .tracking-layout { max-width: 700px; }
    .status-stepper { display: flex; justify-content: space-between; position: relative; }
    .status-stepper::before { content: ''; position: absolute; top: 12px; left: 0; right: 0; height: 3px; background: var(--border); z-index: 0; }
    .step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 1; flex: 1; }
    .step-dot { width: 24px; height: 24px; border-radius: 50%; background: var(--border); border: 3px solid #fff; box-shadow: 0 0 0 2px var(--border); transition: var(--transition); }
    .step.active .step-dot { background: var(--success); box-shadow: 0 0 0 2px var(--success); }
    .step.current .step-dot { background: var(--primary); box-shadow: 0 0 0 2px var(--primary), 0 0 12px rgba(255,75,43,0.4); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 2px var(--primary); } 50% { box-shadow: 0 0 0 6px rgba(255,75,43,0.3); } }
    .step-label { margin-top: 10px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); text-align: center; }
    .step.active .step-label { color: var(--success); }
    .step.current .step-label { color: var(--primary); }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
    .summary-row.total { font-weight: 700; border: none; }
    .agent-card { background: var(--surface-hover); padding: 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--primary); }
    .live-map { border-top: 1px solid var(--border); padding-top: 16px; }
    .map-container { position: relative; height: 300px; background: #e5e7eb; border-radius: var(--radius-md); overflow: hidden; }
    .map-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 400; font-size: 0.9rem; color: var(--text-muted); background: rgba(229, 231, 235, 0.8); backdrop-filter: blur(2px); }
    .text-primary { color: var(--primary); }
    ::ng-deep .custom-div-icon { font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); display: flex; justify-content: center; align-items: center; }

    /* Review Card */
    .review-card { border: 2px solid transparent; background: linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, var(--primary), #f59e0b) border-box; }
    .review-card h3 { font-size: 1.1rem; }
    .review-label { font-size: 0.9rem; font-weight: 600; color: var(--text); margin-bottom: 8px; }
    .star-picker { display: flex; align-items: center; gap: 4px; }
    .star-btn { background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #d1d5db; line-height: 1; transition: color 0.1s, transform 0.1s; padding: 0; }
    .star-btn.active { color: #f59e0b; }
    .star-btn:hover { transform: scale(1.2); color: #f59e0b; }
    .star-label { font-size: 0.82rem; color: var(--text-muted); margin-left: 8px; font-style: italic; }
    .review-textarea { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; font-family: inherit; font-size: 0.9rem; resize: vertical; background: var(--surface); color: var(--text); box-sizing: border-box; }
    .review-textarea:focus { outline: none; border-color: var(--primary); }
    .review-section { }
    .review-stars-row { display: flex; gap: 32px; flex-wrap: wrap; }
    .stars-display { font-size: 1.4rem; color: #f59e0b; }
    .review-comment { font-style: italic; color: var(--text-muted); background: var(--surface-hover); padding: 10px 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--primary); }
    .review-done { text-align: left; }
  `]
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  order: OrderResponse | null = null; loading = true;
  agent: AgentResponse | null = null;
  agentLocation: { lat: number, lng: number } | null = null;
  statusSteps = ['PLACED', 'CONFIRMED', 'PREPARING', 'PICKED_UP', 'CUSTOMER_RECEIVED', 'DELIVERED'];
  estimatedMin: number | null = null;

  // Review
  existingReview: ReviewResponse | null = null;
  reviewSubmitted = false;
  foodRating = 0;
  deliveryRating = 0;
  reviewComment = '';
  submittingReview = false;

  private destroy$ = new Subject<void>();
  private hubConnection: signalR.HubConnection | null = null;
  private map: any = null;
  private marker: any = null;
  private timerInt: any;

  constructor(
    private route: ActivatedRoute,
    private orderApi: OrderApiService,
    private deliveryApi: DeliveryApiService,
    private reviewApi: ReviewApiService,
    private auth: AuthApiService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadLeaflet();

    timer(0, 15000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.orderApi.getOrder(id))
    ).subscribe({
      next: (o) => {
        this.order = o;
        this.loading = false;
        this.updateTimer();

        if (o.deliveryAgentId && !this.agent) {
          this.deliveryApi.getAgent(o.deliveryAgentId).subscribe({
            next: (a) => this.agent = a,
            error: () => {}
          });
        }

        if (o.orderStatus === 'DELIVERED' && !this.existingReview) {
          this.loadExistingReview(o.orderId);
          this.destroy$.next(); // stop polling
          this.disconnectSignalR();
        } else if (o.orderStatus === 'CANCELLED') {
          this.destroy$.next();
          this.disconnectSignalR();
        } else if (o.orderStatus === 'PICKED_UP' && !this.hubConnection) {
          this.connectSignalR();
        }
      },
      error: () => this.loading = false
    });

    this.timerInt = setInterval(() => this.updateTimer(), 10000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectSignalR();
    if (this.timerInt) clearInterval(this.timerInt);
  }

  loadExistingReview(orderId: number) {
    this.reviewApi.getByOrder(orderId).subscribe({
      next: (r) => this.existingReview = r,
      error: () => {} // 404 means not reviewed yet — that's fine
    });
  }

  submitReview() {
    if (!this.order || this.foodRating === 0) return;
    this.submittingReview = true;
    const req = {
      orderId: this.order.orderId,
      restaurantId: this.order.restaurantId,
      agentId: this.order.deliveryAgentId || undefined,
      foodRating: this.foodRating,
      deliveryRating: this.deliveryRating || this.foodRating,
      comment: this.reviewComment.trim() || undefined
    };
    this.reviewApi.submitReview(req).subscribe({
      next: (r) => {
        this.existingReview = r;
        this.reviewSubmitted = true;
        this.submittingReview = false;
        this.toast.success('Review submitted! Thank you 🎉');
      },
      error: (e) => {
        this.submittingReview = false;
        this.toast.error(e.error?.message || 'Failed to submit review');
      }
    });
  }

  getRatingLabel(rating: number): string {
    const labels: Record<number, string> = { 0: 'Select rating', 1: 'Poor 😞', 2: 'Fair 😐', 3: 'Good 🙂', 4: 'Very Good 😊', 5: 'Excellent 🤩' };
    return labels[rating] || '';
  }

  renderStars(rating: number): string { return '★'.repeat(rating) + '☆'.repeat(5 - rating); }

  updateTimer() {
    if (!this.order?.estimatedDelivery || this.order.orderStatus === 'DELIVERED' || this.order.orderStatus === 'CANCELLED') {
      this.estimatedMin = null;
      return;
    }
    const diff = new Date(this.order.estimatedDelivery).getTime() - new Date().getTime();
    this.estimatedMin = diff <= 0 ? 0 : Math.floor(diff / 60000);
  }

  private loadLeaflet(): Promise<void> {
    return new Promise((resolve) => {
      if (document.getElementById('leaflet-script')) { resolve(); return; }
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      const script = document.createElement('script');
      script.id = 'leaflet-script';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  private initMap(lat: number, lng: number) {
    if (!this.map && typeof L !== 'undefined') {
      const mapEl = document.getElementById('tracking-map');
      if (mapEl) {
        this.map = L.map('tracking-map').setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(this.map);
        const icon = L.divIcon({ html: '🚴', className: 'custom-div-icon', iconSize: [30, 30], iconAnchor: [15, 15] });
        this.marker = L.marker([lat, lng], { icon }).addTo(this.map);
      }
    } else if (this.map && this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.map.panTo([lat, lng]);
    }
  }

  private connectSignalR() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.apiUrls.deliveryHub)
      .withAutomaticReconnect()
      .build();
    this.hubConnection.on('ReceiveLocationUpdate', (agentId: number, lat: number, lng: number) => {
      if (this.order && this.order.deliveryAgentId === agentId) {
        this.agentLocation = { lat, lng };
        this.initMap(lat, lng);
      }
    });
    this.hubConnection.start().then(() => {
      if (this.order?.deliveryAgentId) {
        this.hubConnection!.invoke('SubscribeToAgent', this.order.deliveryAgentId).catch(err => console.error('SignalR Subscribe Error:', err));
      }
    }).catch(err => console.error('SignalR error:', err));
  }

  private disconnectSignalR() {
    if (this.hubConnection) { this.hubConnection.stop(); this.hubConnection = null; }
  }

  isStepActive(step: string): boolean { return this.statusSteps.indexOf(step) <= this.statusSteps.indexOf(this.order!.orderStatus); }

  cancelOrder() {
    this.orderApi.cancelOrder(this.order!.orderId).subscribe({
      next: (o) => { this.order = o; this.toast.info('Order cancelled'); this.destroy$.next(); },
      error: (e) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  confirmReceipt() {
    if (!confirm('Are you sure you want to confirm you have received the order?')) return;
    this.orderApi.confirmReceipt(this.order!.orderId).subscribe({
      next: (o) => {
        this.order = o;
        this.toast.success('Order confirmed as received! Thank you.');
        this.disconnectSignalR();
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed to confirm receipt')
    });
  }
}
