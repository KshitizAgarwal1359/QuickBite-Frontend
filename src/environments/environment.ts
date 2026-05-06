const GATEWAY = 'http://localhost:5000';

export const environment = {
  production: false,
  apiUrls: {
    // ─── All REST calls go through the Ocelot API Gateway ───────────────────
    auth:         `${GATEWAY}/api/v1/auth`,
    restaurant:   `${GATEWAY}/api/v1/restaurants`,
    menu:         `${GATEWAY}/api/v1/menu`,
    cart:         `${GATEWAY}/api/v1/cart`,
    order:        `${GATEWAY}/api/v1/orders`,
    payment:      `${GATEWAY}/api/v1/payments`,
    wallet:       `${GATEWAY}/api/v1/wallet`,
    delivery:     `${GATEWAY}/api/v1/deliveries`,
    review:       `${GATEWAY}/api/v1/reviews`,
    notification: `${GATEWAY}/api/v1/notifications`,

    // ─── SignalR WebSocket hubs connect directly (WebSocket upgrade bypass) ──
    deliveryHub:      'http://localhost:5272/hub/location',
    notificationHub:  'http://localhost:5500/hub/notification'
  },
  razorpayKey: 'rzp_test_SgpwVV3UHwWACV'
};
