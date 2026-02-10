# CuriosityRepository

Data access for curiosities (short trivia, tips, fun facts about coffee).

## Interface

- `findAll(): Promise<Curiosity[]>`
- `findById(id: string): Promise<Curiosity | null>`
- `findBySlug(slug: string): Promise<Curiosity | null>`
- `create(data: CreateCuriosityDto): Promise<Curiosity>`
- `update(id: string, data: UpdateCuriosityDto): Promise<Curiosity>`
- `delete(id: string): Promise<void>`

## Data Model

```typescript
interface Curiosity {
  id: string;
  slug: string;
  title: string;
  content: string;      // short text
  createdAt: Date;
  updatedAt: Date;
}
```
