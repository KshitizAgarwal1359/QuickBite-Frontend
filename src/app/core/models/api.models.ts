// ─── Auth ────────────────────────────────────────────────────────────────
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { fullName: string; email: string; password: string; phone?: string; role: string; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }
export interface UpdateProfileRequest { fullName?: string; phone?: string; profilePicUrl?: string; }
export interface AuthResponse { token: string; expiresAt: string; user: UserProfile; }
export interface UserProfile { userId: number; fullName: string; email: string; phone: string; role: string; isActive: boolean; createdAt: string; profilePicUrl?: string; }

// ─── Restaurant ──────────────────────────────────────────────────────────
export interface RegisterRestaurantRequest { name: string; description: string; cuisine: string; address: string; city: string; latitude: number; longitude: number; phone?: string; deliveryRadius: number; minOrderAmount: number; estimatedDeliveryMin: number; }
export interface UpdateRestaurantRequest { name?: string; description?: string; cuisine?: string; address?: string; city?: string; latitude?: number; longitude?: number; phone?: string; deliveryRadius?: number; minOrderAmount?: number; estimatedDeliveryMin?: number; }
export interface RestaurantResponse { restaurantId: number; ownerId: number; name: string; description: string; cuisine: string; address: string; city: string; latitude: number; longitude: number; phone?: string; avgRating: number; isApproved: boolean; isOpen: boolean; deliveryRadius: number; minOrderAmount: number; estimatedDeliveryMin: number; }

// ─── Menu ────────────────────────────────────────────────────────────────
export interface AddCategoryRequest { restaurantId: number; name: string; description?: string; imageUrl?: string; displayOrder?: number; }
export interface UpdateCategoryRequest { name?: string; description?: string; imageUrl?: string; displayOrder?: number; }
export interface CategoryResponse { categoryId: number; restaurantId: number; name: string; description: string; imageUrl?: string; displayOrder: number; items: MenuItemResponse[]; }
export interface AddMenuItemRequest { restaurantId: number; categoryId: number; name: string; description?: string; price: number; discountedPrice?: number; imageUrl?: string; isVeg: boolean; calories?: number; tags?: string; }
export interface UpdateMenuItemRequest { name?: string; description?: string; price?: number; discountedPrice?: number; imageUrl?: string; isVeg?: boolean; calories?: number; tags?: string; }
export interface MenuItemResponse { itemId: number; restaurantId: number; categoryId: number; name: string; description: string; price: number; discountedPrice: number; imageUrl: string; isVeg: boolean; isAvailable: boolean; rating: number; calories: number; tags: string; }

// ─── Cart (matches CartResponseDto / CartItemResponseDto) ────────────────
export interface AddItemRequest { restaurantId: number; menuItemId: number; name: string; price: number; quantity: number; customization?: string; }
export interface UpdateQuantityRequest { cartId: number; itemId: number; quantity: number; }
export interface ApplyPromoRequest { cartId: number; promoCode: string; }
export interface CartResponse { cartId: number; customerId: number; restaurantId: number; items: CartItemResponse[]; totalPrice: number; discountAmount: number; finalPrice: number; promoCode: string; createdAt: string; }
export interface CartItemResponse { itemId: number; menuItemId: number; name: string; price: number; quantity: number; subTotal: number; customization: string; }

// ─── Order (matches OrderResponseDto / OrderItemResponseDto) ─────────────
export interface PlaceOrderRequest { restaurantId: number; deliveryAddress: string; modeOfPayment: string; specialInstructions?: string; discount?: number; items: OrderItemRequest[]; }
export interface OrderItemRequest { menuItemId: number; name: string; price: number; quantity: number; customization?: string; }
export interface UpdateStatusRequest { orderStatus: string; }
export interface AssignAgentRequest { deliveryAgentId: number; }
export interface OrderResponse { orderId: number; customerId: number; restaurantId: number; orderStatus: string; totalAmount: number; discount: number; finalAmount: number; deliveryAddress: string; modeOfPayment: string; specialInstructions: string; deliveryAgentId: number; orderDate: string; estimatedDelivery: string; items: OrderItemResponse[]; }
export interface OrderItemResponse { orderItemId: number; menuItemId: number; name: string; price: number; quantity: number; subTotal: number; customization: string; }

// ─── Payment ─────────────────────────────────────────────────────────────
export interface ProcessPaymentRequest { orderId: number; amount: number; mode: string; razorpayPaymentId?: string; razorpayOrderId?: string; razorpaySignature?: string; }
export interface PaymentResponse { paymentId: number; orderId: number; customerId: number; amount: number; status: string; mode: string; transactionId: string; currency: string; paidAt: string; refundedAt: string; }
export interface WalletTopupRequest { amount: number; razorpayPaymentId: string; }
export interface WalletPayRequest { orderId: number; amount: number; }
export interface WalletResponse { walletId: number; customerId: number; balance: number; }
export interface WalletStatementResponse { statementId: number; amount: number; type: string; description: string; createdAt: string; }

// ─── Delivery ────────────────────────────────────────────────────────────
export interface AgentRegistrationRequest { fullName: string; phone: string; vehicleType: string; vehicleNumber: string; }
export interface LocationUpdateRequest { latitude: number; longitude: number; }
export interface AssignOrderRequest { orderId: number; }
export interface AgentRatingRequest { rating: number; }
export interface AgentResponse { agentId: number; userId: number; fullName: string; phone: string; vehicleType: string; vehicleNumber: string; currentLatitude: number; currentLongitude: number; isAvailable: boolean; isVerified: boolean; avgRating: number; totalDeliveries: number; }
export interface AgentDistanceResponse extends AgentResponse { distanceInKm: number; }

// ─── Generic ─────────────────────────────────────────────────────────────
export interface ApiError { statusCode: number; message: string; timestamp: string; }
