# Sprint 3 — Frontend-Backend Integration

## Status: Complete ✅

### Backend: Full GraphQL API

| Entity | Queries | Mutations |
|--------|---------|-----------|
| **Auth** | — | `login(email, password)`, `register(email, password, name)` |
| **Tickets** | `tickets`, `ticket(id)` | `createTicket(input)`, `updateTicketStatus(input)` |
| **Products** | `products`, `product(id)` | `createProduct(input)` |
| **Customers** | `customers`, `customer(id)` | — |
| **Users** | `users` | — |

### GraphQL Object Types (8 code-first models)
All models registered with `@ObjectType()` and `@InputType()` decorators:
- `User`, `UserRole` — ADMIN/AGENT/CUSTOMER enum
- `Ticket`, `TicketPriority` (CRITICAL/HIGH/MEDIUM/LOW), `TicketStatus` (OPEN/INVESTIGATING/AWAITING_CUSTOMER/RESOLVED/CLOSED)
- `Product`, `ProductStatus`, `ProductCustomerConnection`
- `Customer`, `CustomerTier`, `CustomerStatus`
- `TicketMessage`, `Activity`, `Notification`

### Seed Script (`backend/prisma/seed.ts`)
Populates the database with:
- 7 users (1 admin, 4 agents, 1 customer, plus agent@sahab.ir placeholder)
- 1 customer profile linked to the customer user
- 4 products (Cloud Security Platform, Identity Protection Server, Elastic Compute Node, Global Edge CDN)
- 5 tickets with varied priorities and statuses
- 4 activities, 3 notifications

### Frontend: API Layer

| File | Purpose |
|------|---------|
| `src/api/graphql.ts` | Generic GraphQL fetch wrapper with JWT header injection |
| `src/api/queries.ts` | All query/mutation strings (login, register, tickets, products, customers, users) |
| `src/hooks/useAuth.ts` | Login with fallback to localStorage mock |
| `src/hooks/useTickets.ts` | Fetch/create tickets from API |
| `src/hooks/useProducts.ts` | Fetch products from API |
| `src/hooks/useCustomers.ts` | Fetch customers from API |

### Auth Flow
1. `LoginForm` calls `useAuth().login(email, password)`
2. Hook tries real GraphQL API first
3. If API unavailable, falls back to localStorage mock (admin/agent/customer based on email prefix)
4. JWT token stored in `localStorage.sahab_access_token`
5. All subsequent API calls include `Authorization: Bearer <token>`

### How to run (full stack)

```bash
# Terminal 1: Infrastructure
cd D:\Dev\CRM
docker compose up -d

# Terminal 2: Database + Seed
cd backend
npx prisma migrate dev --name init
npm run seed

# Terminal 3: Backend
cd backend
npm run start:dev     # http://localhost:4000/graphql

# Terminal 4: Frontend
cd D:\Dev\CRM
npm run dev           # http://localhost:3000
```

### Test credentials (seeded)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sahab.ir | 123456 |
| Agent | rezaei@sahab.ir | 123456 |
| Customer | a.karimi@ariasecurity.ir | 123456 |

### GraphQL Playground
Open `http://localhost:4000/graphql` and try:
```graphql
query { tickets { id title priority status customer { commercialName } } }
mutation { login(email: "admin@sahab.ir", password: "123456") { accessToken user { name role } } }
```

### Build verification
- `npx tsc --noEmit` → 0 errors (frontend)
- `npx nest build` → 0 errors (backend)
- `npx vite build` → builds in ~10s
