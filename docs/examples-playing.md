# Playing with Examples

A practical guide to exploring Yggdrasil using the example projects. No prior setup — just point your agent at an example and go.

## How to Start

1. **Open an example in your IDE** (e.g. `examples/hello-world` or `examples/coffee-shop`).

2. **Tell your agent to work on it.** For example:
   > "Work in this directory. Run /ygg.materialize to generate the implementation."

3. **Run `/ygg.materialize`.** The agent will:
   - Run `ygg resolve-deps` to get the materialization order
   - For each node: `ygg build-context` → generate code → write files
   - Run tests

4. **Run the app.** For hello-world: `npm install && npm test`. For coffee-shop: `npm run dev` and open the app in your browser.

5. **Use other commands.** Once the graph is materialized, you can:
   - `/ygg.drift` — check if code matches the graph
   - `/ygg.check` — validate graph consistency
   - Add features by editing the graph and running `/ygg.materialize` again

## Adding a Feature: Example

The owner of the coffee shop wants:
- **Product categories** — products belong to categories (e.g. Beans, Accessories)
- **Order notification bell** — in the admin panel, a bell icon with a counter of new orders since last visit

### Workflow

1. **Brief (optional).** Run `/ygg.brief` or write a short note:
   > "Add product categories. Add a notification bell in admin showing count of new orders."

2. **Plan.** Run `/ygg.plan` — the agent explores the graph with `ygg tree`, `ygg affected`, and proposes:
   - New node: `catalog/category-repository` (or extend product-repository)
   - New node: `catalog/category` model
   - Modify: `catalog/product-repository` — add categoryId
   - New node: `cms/order-notification-bell` — reads from order-repository, shows count
   - Modify: `cms/admin-layout` — include the bell component

3. **Apply.** Edit `.yggdrasil/` files (or use `/ygg.apply`):
   - Add `catalog/category-repository/` with `node.yaml` and `description.md`
   - Update `catalog/product-repository/description.md` with category relation
   - Add `cms/order-notification-bell/` with relation to `orders/order-repository`
   - Update `cms/admin-layout` to include the bell

4. **Check.** Run `ygg check` to validate.

5. **Materialize.** Run `/ygg.materialize` — the agent generates the new code and updates affected nodes.

6. **Verify.** Run the app, test categories and the bell counter.

### What the Agent Sees

For `cms/order-notification-bell`, the agent receives:
- **Global context** — Next.js, TypeScript, SQLite
- **CMS module context** — admin panel, auth
- **Node description** — "Bell icon in admin header, shows count of orders with status 'pending' or created since last admin visit"
- **Relation** — `orders/order-repository` interface (findById, create, etc.)
- **Aspect** — requires-auth (admin page)

The agent generates a component that fetches the count and renders the bell. No need to search the codebase — the context package has everything.

## Summary

| Step | Action |
|------|--------|
| Start | Open example → tell agent → `/ygg.materialize` |
| Run | `npm run dev` (or `npm test`) |
| Add feature | `/ygg.brief` or `/ygg.plan` → edit graph → `ygg check` → `/ygg.materialize` |
| Verify | `/ygg.drift` to detect manual edits |

Examples are templates. The `.gitignore` excludes generated code — you can experiment freely without polluting the repo.
