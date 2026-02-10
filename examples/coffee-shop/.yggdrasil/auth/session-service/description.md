# SessionService

Session management for admin auth.

## Interface

- `getSession(): Promise<Session | null>`
- `signIn(email: string, password: string): Promise<boolean>`
- `signOut(): Promise<void>`

## Data Model

```typescript
interface Session {
  userId: string;
  email: string;
  expiresAt: Date;
}
```

For demo: single admin user (env vars ADMIN_EMAIL, ADMIN_PASSWORD). No user table.
