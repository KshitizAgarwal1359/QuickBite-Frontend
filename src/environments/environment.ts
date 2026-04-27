export const environment = {
  production: false,
  apiUrls: {
    auth: 'http://localhost:5093/api/v1/auth',
    restaurant: 'http://localhost:5228/api/v1/restaurants',
    menu: 'http://localhost:5044/api/v1/menu',
    cart: 'http://localhost:5166/api/v1/cart',
    order: 'http://localhost:5112/api/v1/orders',
    payment: 'http://localhost:5236/api/v1/payments',
    wallet: 'http://localhost:5236/api/v1/wallet',
    delivery: 'http://localhost:5272/api/v1/agents',
    deliveryHub: 'http://localhost:5272/hub/location'
  },
  razorpayKey: 'rzp_test_SgpwVV3UHwWACV'
};
