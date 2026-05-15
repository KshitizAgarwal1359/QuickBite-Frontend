const GATEWAY = 'https://quickbite-api-gateway-q6bs.onrender.com';

export const environment = {
  production: true,
  apiUrls: {
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

    // SignalR — direct to deployed services (bypasses gateway for WebSocket)
    deliveryHub:     'https://quickbite-delivery-service.onrender.com/hub/location',
    notificationHub: 'https://quickbite-notification-service.onrender.com/hub/notification'
  },
  razorpayKey: 'rzp_test_SgpwVV3UHwWACV'
};

