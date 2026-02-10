sequenceDiagram
  participant User
  participant AuthAPI
  participant OrderService
  participant UserRepo

  User->>AuthAPI: authenticate
  AuthAPI->>UserRepo: verify user
  User->>OrderService: submit order
  OrderService->>AuthAPI: validate token
