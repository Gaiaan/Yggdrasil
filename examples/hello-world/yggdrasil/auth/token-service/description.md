# TokenService

Issues and verifies JWT access tokens.

## Responsibilities

- `issueToken(userId: string): string` — creates a signed JWT with 1-hour expiry
- `verifyToken(token: string): { userId: string }` — verifies signature and returns payload
- `refreshToken(token: string): string` — issues a new token if the old one is still valid

## Constraints

- JWT secret from environment variable `JWT_SECRET`
- Tokens expire after 1 hour
- Use `jsonwebtoken` library
