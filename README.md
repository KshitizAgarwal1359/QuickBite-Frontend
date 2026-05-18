# QuickBite Frontend

QuickBite is a food delivery platform built with Angular 18. It connects customers, restaurant owners, delivery agents, and platform admins through a responsive, role-based single-page application.

## Live Demo

**Frontend:** https://quick-bite-frontend-six.vercel.app  
**API Gateway:** https://quickbite-api-gateway-q6bs.onrender.com

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Angular 18 | SPA framework (standalone components) |
| TypeScript | Language |
| @microsoft/signalr | Real-time delivery tracking and notifications |
| RxJS | Reactive state and HTTP streams |
| Angular Router | Client-side routing with lazy loading |
| Angular HTTP Client | REST API communication via interceptors |

---

## Features by Role

### Customer
- Browse restaurants by city and cuisine
- View restaurant menus with category filters
- Add items to cart, apply promo codes (WELCOME50, FLAT20)
- Checkout with CARD, UPI, Wallet, or COD
- Real-time order tracking via SignalR
- View order history and wallet balance
- Write food and delivery reviews after order completion
- Manage profile and change password

### Restaurant Owner
- Register and manage restaurant listings
- Create and manage menu categories and items
- View incoming orders and update their status
- Dashboard with order summary

### Delivery Agent
- Register as delivery agent with vehicle details
- Toggle online/offline availability
- Accept delivery assignments
- Send live GPS location updates via SignalR WebSocket

### Admin
- Approve or reject restaurant registrations
- Manage refund requests
- View all active orders and deliveries
- Verify delivery agent accounts

---

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── active-orders/
│   │   ├── agent-verification/
│   │   ├── dashboard/
│   │   ├── refund-manage/
│   │   └── refunds/
│   ├── agent/
│   │   ├── active-deliveries/
│   │   ├── dashboard/
│   │   └── register/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── core/
│   │   ├── guards/          (AuthGuard, RoleGuard)
│   │   ├── interceptors/    (AuthInterceptor - attaches JWT to every request)
│   │   ├── models/          (TypeScript interfaces for API responses)
│   │   └── services/        (AuthService, RestaurantService, CartService, etc.)
│   ├── customer/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── home/
│   │   ├── order-history/
│   │   ├── order-tracking/
│   │   ├── profile/
│   │   ├── restaurant-detail/
│   │   └── wallet/
│   ├── owner/
│   │   ├── dashboard/
│   │   ├── menu-manage/
│   │   ├── orders/
│   │   └── restaurant-manage/
│   └── shared/
│       ├── footer/
│       ├── navbar/
│       └── toast/
├── environments/
│   ├── environment.ts           (local dev — localhost API URLs)
│   └── environment.production.ts (Render API Gateway URL)
└── main.ts
```

---

## Architecture

### Standalone Components
The project uses Angular 18 **standalone components** — no `NgModule` is used. Each component declares its own `imports` array. The app is bootstrapped via `bootstrapApplication(AppComponent, appConfig)`.

### HTTP Interceptor
An `AuthInterceptor` runs on every outgoing HTTP request. It reads the JWT token from `localStorage` and attaches it as a `Authorization: Bearer <token>` header automatically. This means no service needs to manually add headers.

### Route Guards
- `AuthGuard` — Redirects unauthenticated users to `/login`
- `RoleGuard` — Redirects authenticated users who do not have the required role (e.g., a CUSTOMER trying to access `/admin`)

### Environment-based API URLs
Local development points to `localhost` service ports. Production automatically uses the Render API Gateway URL via Angular's file replacement build configuration:

```
environment.ts         → used during ng serve
environment.production.ts → used during ng build --configuration production
```

### SignalR (Real-time)
Two SignalR hubs are connected directly to the deployed services (bypassing the gateway, as WebSocket proxying requires additional gateway configuration):
- `/hub/location` on delivery-service — live agent GPS position
- `/hub/notification` on notification-service — order status push notifications

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- Angular CLI 18

### Install and run

```bash
cd QuickBite-Frontend
npm install
ng serve
```

App runs at `http://localhost:4200`

Ensure the backend services are running locally. Each service URL is configured in `src/environments/environment.ts`.

### Build for production

```bash
ng build --configuration production
```

Output goes to `dist/quick-bite/browser/`. This is what Vercel serves.

---

## Deployment (Vercel)

The project is deployed on Vercel with automatic deployments on every push to `main`.

**Vercel configuration (`vercel.json`):**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This ensures Angular's client-side router handles all routes. Without it, refreshing any page other than `/` returns a 404 from Vercel's static file server.

**Build settings on Vercel:**
- Framework: Angular
- Build command: `ng build`
- Output directory: `dist/quick-bite/browser`

---

## API Communication

All REST API calls go through the **Ocelot API Gateway** at `https://quickbite-api-gateway-q6bs.onrender.com`. The gateway routes them to the correct microservice.

| Frontend route | API Gateway path | Microservice |
|---|---|---|
| Login / Register | `/api/v1/auth/...` | Auth Service |
| Browse restaurants | `/api/v1/restaurants/...` | Restaurant Service |
| View menu | `/api/v1/menu/...` | Menu Service |
| Cart operations | `/api/v1/cart/...` | Cart Service |
| Place order | `/api/v1/orders/...` | Order Service |
| Payments | `/api/v1/payments/...` | Payment Service |
| Wallet | `/api/v1/wallet/...` | Payment Service |
| Delivery agents | `/api/v1/deliveries/...` | Delivery Service |
| Reviews | `/api/v1/reviews/...` | Review Service |
| Notifications | `/api/v1/notifications/...` | Notification Service |
