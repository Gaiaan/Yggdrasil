# Checkout Flow

User completes purchase: Cart → Checkout form → Order created → Confirmation page.

1. User adds items to cart (client-side)
2. User goes to `/cart`, reviews, clicks Checkout
3. User fills email on `/checkout`, submits
4. Server validates cart, creates Order via OrderRepository
5. Redirect to `/checkout/confirmation` with order ID
