import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderApiService } from '../../core/services/order-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page container">
      <div class="page-header"><h1>🛡️ Admin Dashboard</h1><p>Platform administration panel</p></div>
      <div class="grid grid-4">
        <a routerLink="/admin/restaurants" class="card dash-card"><div class="card-body text-center"><span class="dash-icon">🏪</span><h3>Restaurants</h3><p class="text-muted text-sm">Approve pending</p></div></a>
        <a routerLink="/admin/agents" class="card dash-card"><div class="card-body text-center"><span class="dash-icon">🚴</span><h3>Agents</h3><p class="text-muted text-sm">Verify new agents</p></div></a>
        <a routerLink="/admin/orders" class="card dash-card"><div class="card-body text-center"><span class="dash-icon">📦</span><h3>Active Orders</h3><p class="text-muted text-sm">{{ activeCount }} active</p></div></a>
        <div class="card dash-card"><div class="card-body text-center"><span class="dash-icon">📊</span><h3>Analytics</h3><p class="text-muted text-sm">Coming soon</p></div></div>
      </div>
    </div>
  `,
  styles: [`.dash-card { text-decoration: none; color: inherit; cursor: pointer; } .dash-icon { font-size: 2.5rem; display: block; margin-bottom: 8px; } .dash-card h3 { font-size: 1.1rem; }`]
})
export class AdminDashboardComponent implements OnInit {
  activeCount = 0;
  constructor(private orderApi: OrderApiService) {}
  ngOnInit() { this.orderApi.getActiveOrders().subscribe(o => this.activeCount = o.length); }
}
