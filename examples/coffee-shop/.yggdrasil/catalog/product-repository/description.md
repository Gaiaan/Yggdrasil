# ProductRepository

Data access layer for products.

## Interface

- `findAll(): Promise<Product[]>`
- `findById(id: string): Promise<Product | null>`
- `findBySlug(slug: string): Promise<Product | null>`
- `create(data: CreateProductDto): Promise<Product>`
- `update(id: string, data: UpdateProductDto): Promise<Product>`
- `delete(id: string): Promise<void>`

## Data Model

```typescript
interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;        // in cents
  imageUrl?: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
