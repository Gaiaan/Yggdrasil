# OrderRepository

Data access for orders.

## Interface

- `create(data: CreateOrderDto): Promise<Order>`
- `findById(id: string): Promise<Order | null>`

## Data Model

```typescript
interface Order {
  id: string;
  items: OrderItem[];
  totalCents: number;
  customerEmail: string;
  status: 'pending' | 'confirmed';
  createdAt: Date;
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitPriceCents: number;
}
```
