# Sprint 2 — Backend Foundation

## Status: Complete ✅

### Accomplished

| Area | Detail |
|------|--------|
| **Stack** | NestJS 11 + Apollo GraphQL (code-first) + Prisma 7 + PostgreSQL + Redis |
| **Docker** | `docker-compose.yml` at project root — PostgreSQL 16 + Redis 7 |
| **Prisma** | Full schema with 8 models: User, Customer, Product, ProductCustomerConnection, Ticket, TicketMessage, Activity, Notification |
| **Auth** | JWT authentication with `passport-jwt` — register + login mutations |
| **GraphQL** | Code-first schema auto-generated to `src/schema.gql` |
| **Modules** | `auth`, `users`, `tickets`, `products`, `customers` — each with service + resolver |
| **CORS** | Configured for frontend dev servers (port 3000, 5173) |

### Data Models (Prisma)
- **User** — email/password, role (ADMIN/AGENT/CUSTOMER), relation to assigned tickets + customer profile
- **Customer** — tier (GOLD/SILVER/BRONZE), status, linked to User, relations to tickets + product connections
- **Product** — name, category, status, version, relations to tickets + customer connections
- **ProductCustomerConnection** — license management (dates, activation keys, subscription type)
- **Ticket** — priority (4 levels), status (5 states), relations to customer, product, assigned agent, messages
- **TicketMessage** — text, sender, internal notes support
- **Activity** — generic activity timeline
- **Notification** — in-app notification system

### How to run

```bash
# 1. Start infrastructure
docker compose up -d

# 2. (First time only) Push schema to DB
cd backend
npx prisma migrate dev --name init

# 3. Start backend
npm run start:dev   # http://localhost:4000/graphql
```

### GraphQL Playground
Open `http://localhost:4000/graphql` in a browser.

### Auth Flow
```graphql
# Register
mutation {
  register(email: "admin@sahab.ir", password: "123456", name: "Admin") {
    accessToken
    user { id email name role }
  }
}

# Login
mutation {
  login(email: "admin@sahab.ir", password: "123456") {
    accessToken
    user { id email name role }
  }
}
```

### Next Sprint Ideas
- Implement full GraphQL types for all entities (currently placeholder resolvers)
- Connect frontend API client to backend
- Seed script with demo data matching existing frontend mocks
- Role-based access control (RBAC) guards
- File upload support for ticket attachments
