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
  auth/
    session-service/
  catalog/
    product-repository/
  content/
    post-repository/
    curiosity-repository/
  shop-settings/
    settings-repository/
  orders/
    order-repository/
  storefront/
    landing-page/
    product-listing/
    product-detail/
    blog-listing/
    blog-detail/
    curiosities-page/
    curiosity-detail/
    cart-page/
    checkout-page/
    order-confirmation/
  cms/
    admin-layout/
    login-page/
    product-editor/
    post-editor/
    curiosities-editor/
    shop-settings-editor/
  flows/
    checkout-flow/
```

## Try It

**Setup (from this directory):**

1. Install the CLI: `npm install -g @gaiaan/yggdrasil-cli`
2. Open this folder in Cursor (or another supported agent).
3. Tell the agent: *"Work here. Run /ygg.materialize to generate the implementation."*
4. When done: `npm install && npm run dev` — open the app in your browser.
5. Browse the store, go to `/admin` (login: `admin@coffee.shop` / `admin123`), add products, try checkout.

**CLI commands to explore:**

```bash
ygg tree
ygg check
ygg resolve-deps
ygg build-context storefront/landing-page
ygg build-context cms/product-editor
```
