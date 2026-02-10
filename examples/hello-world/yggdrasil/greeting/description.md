# Greeting Service

A simple authenticated endpoint that greets the user by name.

## Endpoint

`GET /api/greeting` — returns `{ message: "Hello, <name>!" }`

## Behavior

1. Extract user ID from JWT (via auth middleware)
2. Look up user name via UserRepository
3. Return personalized greeting

## Edge Cases

- If user not found in database, return 404
- If name is empty, return "Hello, stranger!"
