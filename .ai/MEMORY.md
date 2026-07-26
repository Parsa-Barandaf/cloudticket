# Cross-Session Memory

> Persistent context preserved across sessions. NEVER rely on conversation history — read this file first when starting a new session. Single source of truth for reusable patterns, quirks, and locations.

---

## Project Topology

```
D:\Dev\CRM\
├── src/                        # React 19 frontend
│   ├── App.tsx                 # Root: conditional portal rendering
│   ├── types/index.ts          # Frontend types (Persian)
│   ├── api/                    # API layer
│   │   ├── graphql.ts          # GQL fetch + JWT
│   │   ├── queries.ts          # All GQL strings
│   │   ├── types.ts            # API type interfaces (English)
│   │   ├── transform.ts        # API→frontend mappers
│   │   ├── transform-agent.ts  # Agent transforms + SLA
│   │   ├── transform-customer.ts
│   │   └── client.ts           # DEAD CODE — REST wrapper, not used
│   ├── hooks/                  # 7 hooks (useAuth, useTickets, etc.)
│   └── components/
│       ├── portals/            # 8 portal components (40–4611 lines each)
│       ├── ui/                 # 5 shared primitives
│       ├── LoginForm.tsx       # 539 lines, 3 screens
│       ├── ErrorBoundary.tsx   # Class component
│       └── AbstractIllustration.tsx
├── backend/                    # NestJS 11 backend
│   ├── src/
│   │   ├── main.ts             # CORS: ports 3000, 5173; port 4000
│   │   ├── schema.gql          # AUTO-GENERATED — do not edit
│   │   ├── auth/               # AuthPayload inline (not in models/)
│   │   ├── users/              # findAll, findById, findByEmail
│   │   ├── tickets/            # Full CRUD + status update
│   │   ├── products/           # Full CRUD + create
│   │   ├── customers/          # Full CRUD (queries + createCustomer mutation)
│   │   └── common/
│   │       ├── models/         # 8 @ObjectType() classes
│   │       └── dto/            # 4 @InputType() classes
│   └── prisma/
│       ├── schema.prisma       # 8 models, 6 enums
│       ├── seed.ts             # 6 users, 4 products, 5 tickets
│       └── migrations/
└── docker-compose.yml          # PostgreSQL:5432, Redis:6379
```

---

## File Size Map (Read Strategy)

| File | Lines | Read Strategy |
|------|-------|---------------|
| `DashboardPortal.tsx` | 4,982 | Grep + offset read (never read full) |
| `AgentPortal.tsx` | 2,248 | Grep + offset read |
| `UserManagement.tsx` | 1,737 | Grep + offset read |
| `TicketDetailsWorkspace.tsx` | 1,237 | Grep + offset read |
| `CustomerWorkspace.tsx` | 1,176 | Grep + offset read |
| `TicketInbox.tsx` | 1,126 | Grep + offset read |
| `NotificationCenter.tsx` | 1,090 | Grep + offset read |
| `LoginForm.tsx` | 539 | Read full OK |
| `CustomerPortal.tsx` | 509 | Read full OK |
| Everything else | <200 | Read full OK |

---

## Persian ↔ English Enum Mapping Pattern

### Forward (API → Frontend) — `src/api/transform.ts`

```typescript
const priorityMap = {
  CRITICAL: 'بحرانی', HIGH: 'بالا', MEDIUM: 'متوسط', LOW: 'پایین',
};
const statusMap = {
  OPEN: 'باز', INVESTIGATING: 'در حال بررسی',
  AWAITING_CUSTOMER: 'منتظر پاسخ مشتری',
  RESOLVED: 'بسته شده', CLOSED: 'بسته شده',  // Note: both map to same Persian
};
const productStatusMap = { ACTIVE: 'فعال', INACTIVE: 'غیرفعال', EXPIRED: 'منقضی شده' };
const tierMap = { GOLD: 'طلایی', SILVER: 'نقره‌ای', BRONZE: 'برنزی' };
const customerStatusMap = { ACTIVE: 'فعال', INACTIVE: 'غیرفعال', PENDING: 'در انتظار' };
```

### Reverse (Frontend → API) — Inline in 5 components

```typescript
const priorityToApi = { 'بحرانی': 'CRITICAL', 'بالا': 'HIGH', 'متوسط': 'MEDIUM', 'پایین': 'LOW' };
const statusToApi = {
  'باز': 'OPEN', 'در حال بررسی': 'INVESTIGATING',
  'منتظر پاسخ مشتری': 'AWAITING_CUSTOMER', 'بسته شده': 'CLOSED',
};
```

**⚠ KNOWN ISSUE**: Reverse maps are duplicated in `DashboardPortal.tsx`, `CustomerPortal.tsx`, `AgentPortal.tsx`, `TicketInbox.tsx`, `TicketDetailsWorkspace.tsx`. Plan to centralize.

---

## API Call Patterns

### Pattern 1: Direct `gql()` call (in component)

```typescript
import { gql } from '../../api/graphql';
import { CREATE_TICKET } from '../../api/queries';

await gql(CREATE_TICKET, { input: { title, priority, customerId } });
```

Used in: `CustomerPortal.tsx`, `AgentPortal.tsx`, `TicketInbox.tsx`, `TicketDetailsWorkspace.tsx`, `DashboardPortal.tsx` (customer creation)

### Pattern 2: Via hook method

```typescript
const { createTicket } = useTickets();
await createTicket({ title, priority, customerId });
```

Used in: `DashboardPortal.tsx` (has access to `useTickets()` hook)

### Pattern 3: REST wrapper (DEAD CODE)

```typescript
import { api } from '../../api/client';   // NEVER imported anywhere
```

---

## Mock Data Locations (Not Yet Wired)

| Feature | Component | Function/Handler | Line (approx) |
|---------|-----------|-----------------|---------------|
| Product creation | `DashboardPortal.tsx` | `handleCreateProduct` → `handleSaveDrawerProduct` | ~492 |
| ~~Customer creation~~ | ~~`DashboardPortal.tsx`~~ | ~~`handleSaveCustomer`~~ | ✅ Wired to API |
| Send reply | `TicketDetailsWorkspace.tsx` | `handleSendReply` | ~160 |
| Send reply | `AgentPortal.tsx` | inline `onSubmit` | ~600 |
| Activity feeds | `DashboardPortal.tsx` | `setActivities(...)` | various |
| Notification feeds | `DashboardPortal.tsx` | `setNotifications(...)` | various |
| Ticket assignment | `TicketInbox.tsx` | inline `onClick` | ~1004 |
| Ticket assignment | `TicketDetailsWorkspace.tsx` | `handleUpdateTicketAgent` | ~260 |

---

## localStorage Keys

| Key | Type | Set By | Used By |
|-----|------|--------|---------|
| `cmp_access_token` | `string` (JWT) | `useAuth.ts` | `graphql.ts` (Bearer header) |
| `cmp_user_email` | `string` | `useAuth.ts` / `App.tsx` | `App.tsx` |
| `cmp_portal_role` | `string` (`admin`/`agent`/`customer`) | `useAuth.ts` / `App.tsx` | `App.tsx` |
| `cmp_logged_in` | `string` (`"true"`/`"false"`) | `App.tsx` | `App.tsx` |
| `cmp_theme` | `string` (`"dark"`/`"light"`) | `useTheme.ts` | `useTheme.ts` |
| `cmp_*` (any) | — | — | Future hooks may read |

---

## createCustomer Pattern (Sprint 4, Task 1)

### Backend
- **DTO**: `backend/src/common/dto/customer.input.ts` — `@InputType() CreateCustomerInput` with fields: `industry`, `commercialName?`, `phone?`, `website?`, `address?`, `tier?`, `status?`, `userId`
- **Service**: `backend/src/customers/customers.service.ts` — `create(input)` validates user exists (findUnique), checks duplicate (findUnique by userId), then `prisma.customer.create` with defaults `?? 'BRONZE'` / `?? 'ACTIVE'`
- **Resolver**: `backend/src/customers/customers.resolver.ts` — `@Mutation(() => Customer) createCustomer(@Args('input') input: CreateCustomerInput)`

### Frontend
- **Query**: `CREATE_CUSTOMER` in `src/api/queries.ts` — returns full Customer + user + tickets + connections
- **Call site**: `DashboardPortal.tsx` `handleSaveCustomer` — finds user by `contactEmail` via `useUsers`, maps response to local `Customer` type

### Data Flow
1. Admin fills customer form (name, industry, contact email, etc.)
2. `handleSaveCustomer` finds user via `apiUsers.find(u => u.email === contactEmail)`
3. Maps Persian→English enums inline (`businessTypeToApiTier`, `persianStatusToApi`)
4. Calls `gql(CREATE_CUSTOMER, { input })` 
5. Maps response `ApiCustomer` → local `Customer` type (inline, not via `mapCustomer` from transform.ts)
6. Prepends to local `customers` state

---

## Build & Verify Commands

```bash
# Frontend type check (tsc --noEmit)
npm run lint

# Frontend production build
npm run build

# Backend build
cd backend && npm run build

# Backend dev (must have PostgreSQL running)
cd backend && npm run start:dev

# Frontend dev
npm run dev
```

---

## Quick Reference: File Locations

| What | Path |
|------|------|
| Frontend entry | `src/main.tsx` |
| Root component | `src/App.tsx` |
| Types (frontend) | `src/types/index.ts` |
| Types (API) | `src/api/types.ts` |
| GQL queries | `src/api/queries.ts` (5 queries, 5 mutations) |
| Transform layer | `src/api/transform.ts` |
| GraphQL schema | `backend/src/schema.gql` |
| Prisma schema | `backend/prisma/schema.prisma` |
| Seed data | `backend/prisma/seed.ts` |
| DB migration | `backend/prisma/migrations/20260723103135_init/migration.sql` |
| Docker config | `docker-compose.yml` |
| Env example | `.env.example` |
| Backend env | `backend/.env` |
