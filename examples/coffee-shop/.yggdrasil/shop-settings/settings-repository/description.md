# SettingsRepository

Singleton-style access to shop settings.

## Interface

- `get(): Promise<ShopSettings>`
- `update(data: Partial<ShopSettings>): Promise<ShopSettings>`

## Data Model

```typescript
interface ShopSettings {
  id: string;
  shopName: string;
  logoUrl?: string;
  tagline?: string;
  contactEmail?: string;
  metaDescription?: string;
  updatedAt: Date;
}
```
