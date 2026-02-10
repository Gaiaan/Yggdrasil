# Coffee Shop — Blog & Store

A Yggdrasil example: a coffee e-commerce landing with blog, curiosities, and CMS for managing content.

## What It Demonstrates

- **Storefront** — Landing page, product catalog, blog, curiosities, cart, checkout
- **CMS** — Admin panel for products, posts, curiosities, shop settings (requires auth)
- **Content** — Blog posts and coffee curiosities/trivia
- **Checkout flow** — Cart → Checkout → Order creation → Confirmation

## Stack (from config)

- Next.js (App Router)
- TypeScript
- SQLite

## Graph Structure

```
Coffee Shop — Blog & Store
├── auth/
│   └── session-service/
├── catalog/
│   └── product-repository/
├── content/
│   ├── post-repository/
│   └── curiosity-repository/
├── shop-settings/
│   └── settings-repository/
├── orders/
│   └── order-repository/
├── storefront/
│   ├── landing-page/
│   ├── product-listing/
│   ├── product-detail/
│   ├── blog-listing/
│   ├── blog-detail/
│   ├── curiosities-page/
│   ├── curiosity-detail/
│   ├── cart-page/
│   ├── checkout-page/
│   └── order-confirmation/
├── cms/
│   ├── admin-layout/
│   ├── login-page/
│   ├── product-editor/
│   ├── post-editor/
│   ├── curiosities-editor/
│   └── shop-settings-editor/
└── flows/
    └── checkout-flow/
```

## Try It

```bash
ygg tree
ygg check
ygg resolve-deps
ygg build-context storefront/landing-page
ygg build-context cms/product-editor
```

Run `/ygg.materialize` in your agent to generate code.
