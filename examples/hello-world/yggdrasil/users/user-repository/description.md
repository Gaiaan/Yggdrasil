# UserRepository

Data access layer for users.

## Interface

- `findById(id: string): Promise<User | null>`
- `findByEmail(email: string): Promise<User | null>`
- `create(data: CreateUserDto): Promise<User>`

## Data Model

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}
```
