# Checkout Page

Page at `/checkout`. Form: customer email, cart summary. On submit: validate cart (products exist, in stock), create Order via OrderRepository, redirect to confirmation. Clear cart on success.

Server action in actions.ts calls OrderRepository.create() with cart items.
