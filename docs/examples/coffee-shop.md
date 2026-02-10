# Coffee Shop Example

A blog-shop example: e-commerce landing with coffee products, blog posts, curiosities, cart, checkout, and a CMS for managing all content.

**Location:** `examples/coffee-shop/`

## What It Demonstrates

| Concept | How It Appears |
|---------|----------------|
| **Multiple modules** | catalog, content, storefront, cms, orders, auth, shop-settings |
| **Flows** | checkout-flow spans cart, checkout, order-repository, confirmation |
| **Multi-file mapping** | Pages produce page.tsx + actions.ts, layout.tsx |
| **Aspects** | public-page (Next.js), requires-auth (admin), requires-audit (CMS edits) |
| **Relations** | Landing reads from 4 repositories; CMS editors use repositories |

## Graph Structure

```
Coffee Shop — Blog & Store
├── auth/session-service/
├── catalog/product-repository/
├── content/post-repository, curiosity-repository/
├── shop-settings/settings-repository/
├── orders/order-repository/
├── storefront/ (landing, products, blog, curiosities, cart, checkout)
├── cms/ (admin layout, login, product/post/curiosities/settings editors)
└── flows/checkout-flow/
```

## CLI Commands to Try

From `examples/coffee-shop/`:

| Command | Purpose |
|---------|---------|
| `ygg tree` | See full graph with tags and mappings |
| `ygg check` | Validate consistency |
| `ygg build-context storefront/landing-page` | Context with 4 relations |
| `ygg build-context cms/product-editor` | Context with audit aspect |
| `ygg resolve-deps` | See materialization stages |
| `ygg affected catalog/product-repository` | See storefront + CMS dependents |

## URLs (after materialization)

- `/` — landing
- `/products`, `/products/[slug]` — catalog
- `/blog`, `/blog/[slug]` — blog
- `/curiosities`, `/curiosities/[slug]` — curiosities
- `/cart`, `/checkout`, `/checkout/confirmation` — cart & checkout
- `/admin/login` — login
- `/admin/products`, `/admin/posts`, `/admin/curiosities`, `/admin/settings` — CMS
