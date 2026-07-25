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
│   │   ├── customers/          # Queries only (no mutations)
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
| `DashboardPortal.tsx` | 4,611 | Grep + offset read (never read full) |
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

Used in: `CustomerPortal.tsx`, `AgentPortal.tsx`, `TicketInbox.tsx`, `TicketDetailsWorkspace.tsx`

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
| Product creation | `DashboardPortal.tsx` | `handleCreateProduct` | ~460 |
| Customer creation | `DashboardPortal.tsx` | `handleCreateCustomer` | ~530 |
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
| `sahab_access_token` | `string` (JWT) | `useAuth.ts` | `graphql.ts` (Bearer header) |
| `sahab_user_email` | `string` | `useAuth.ts` / `App.tsx` | `App.tsx` |
| `sahab_portal_role` | `string` (`admin`/`agent`/`customer`) | `useAuth.ts` / `App.tsx` | `App.tsx` |
| `sahab_logged_in` | `string` (`"true"`/`"false"`) | `App.tsx` | `App.tsx` |
| `sahab_theme` | `string` (`"dark"`/`"light"`) | `useTheme.ts` | `useTheme.ts` |
| `sahab_*` (any) | — | — | Future hooks may read |

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
| GQL queries | `src/api/queries.ts` |
| Transform layer | `src/api/transform.ts` |
| GraphQL schema | `backend/src/schema.gql` |
| Prisma schema | `backend/prisma/schema.prisma` |
| Seed data | `backend/prisma/seed.ts` |
| DB migration | `backend/prisma/migrations/20260723103135_init/migration.sql` |
| Docker config | `docker-compose.yml` |
| Env example | `.env.example` |
| Backend env | `backend/.env` |
