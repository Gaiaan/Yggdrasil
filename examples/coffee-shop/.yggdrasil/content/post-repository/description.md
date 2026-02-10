# PostRepository

Data access for blog posts (articles about coffee, brewing, etc.).

## Interface

- `findAll(options?: { published?: boolean }): Promise<Post[]>`
- `findById(id: string): Promise<Post | null>`
- `findBySlug(slug: string): Promise<Post | null>`
- `create(data: CreatePostDto): Promise<Post>`
- `update(id: string, data: UpdatePostDto): Promise<Post>`
- `delete(id: string): Promise<void>`

## Data Model

```typescript
interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;         // markdown
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```
