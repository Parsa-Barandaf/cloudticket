# Tasks

> Active and pending tasks. Single source of truth — always read this before starting work.

---

## Legend

| Icon | Meaning |
|------|---------|
| 🔴 High | Critical path, blocking other work |
| 🟡 Medium | Important but not blocking |
| 🟢 Low | Nice to have |
| ❌ | Not started |
| 🔄 | In progress |
| ✅ | Complete |

---

## Active (In Progress)

No tasks currently active.

---

## Blockers

No blockers currently. The following backend tasks must complete before Sprint 5 can begin:

- Task 2 (`createTicketMessage` mutation) blocks Task 10 (wire reply composer)

---

## Sprint 4 — Complete Backend CRUD

| # | Task | Priority | Status | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 2 | Implement `createTicketMessage` mutation | 🔴 High | ❌ | None | Model exists at `common/models/ticket-message.model.ts`. Needs input DTO, resolver, service. Must accept `ticketId`, `text`, `senderName`, `isInternal?`. |
| 3 | Add `updateTicket` mutation (assignedTo, product, priority) | 🔴 High | ❌ | None | Currently only `updateTicketStatus` exists. Add a general `updateTicket(input)` that can modify any field. |
| 4 | Add Activity CRUD resolvers | 🟡 Medium | ❌ | None | Model exists, no GraphQL resolvers. At minimum need `activities` query and `createActivity` mutation. |
| 5 | Add Notification CRUD resolvers | 🟡 Medium | ❌ | None | Model exists. Need `notifications` query, `createNotification`, `markNotificationRead` mutations. |
| 6 | Add RBAC guards (`@UseGuards(RolesGuard)`) | 🔴 High | ❌ | None | Currently no auth guards on any endpoint. Need `RolesGuard` + `@Roles()` decorator checking `User.role`. |
| 7 | Add class-validator decorators to DTOs | 🟡 Medium | ❌ | None | `class-validator` + `class-transformer` already in `package.json`. Add `@IsString()`, `@MinLength()`, `@IsOptional()`, etc. to all input DTOs. |
| 8 | Add pagination arguments to list queries | 🟡 Medium | ❌ | Task 2-3 | `tickets`, `products`, `customers` return all rows. Add `take`/`skip` or `first`/`after` cursor args. |
| 9 | Add search/filter arguments to list queries | 🟡 Medium | ❌ | Task 8 | No `where` or `search` args. Add `status`, `priority`, `customerId` filters to `tickets` query. |

---

## Sprint 5 — Wire Remaining Frontend Mutations

| # | Task | Priority | Status | Depends On | Notes |
|---|------|----------|--------|------------|-------|
| 10 | Wire reply composer → `createTicketMessage` API | 🔴 High | ❌ | Task 2 | Currently UI-only simulation in `TicketDetailsWorkspace.tsx` (`handleSendReply`, ~line 160) and `AgentPortal.tsx` (~line 600). Also `CustomerPortal.tsx`. |
| 11 | Wire activities → API | 🟡 Medium | ❌ | Task 4 | Replace all `setActivities` mock calls in `DashboardPortal.tsx` with API calls. |
| 12 | Wire notifications → API | 🟡 Medium | ❌ | Task 5 | Replace all `setNotifications` mock calls in `DashboardPortal.tsx` with API calls. |
| 13 | Wire product creation → `createProduct` API | 🔴 High | ❌ | None | `DashboardPortal.tsx` `handleCreateProduct` (~line 460) uses mock. Replace with `gql(CREATE_PRODUCT)`. Note: `CREATE_PRODUCT` string needs to be added to `src/api/queries.ts` — not yet present. |
| 14 | Wire customer creation → `createCustomer` API | 🔴 High | ✅ | Task 1 | `DashboardPortal.tsx` `handleSaveCustomer` create branch now calls `gql(CREATE_CUSTOMER)`. Looks up user by email, maps API response. |
| 15 | Wire ticket assignment → API | 🟡 Medium | ❌ | Task 3 | `TicketInbox.tsx` (line ~1004) and `TicketDetailsWorkspace.tsx` (`handleUpdateTicketAgent`, line ~260) use local `setTickets` only. Requires `updateTicket` mutation with `assignedToId` field. |

---

## Known Bugs

| # | Issue | Priority | File | Line | Fix |
|---|-------|----------|------|------|-----|
| 16 | `mapConnection` sets `productId` to `c.customerId` | 🟡 Medium | `src/api/transform.ts` | 79 | Change `productId: c.customerId` → `productId: c.productId` |
| 17 | `useLocalStorage` uses `String()` for all values | 🟢 Low | `src/hooks/useLocalStorage.ts` | 14 | Change `String(next)` → `JSON.stringify(next)` and add `JSON.parse()` on read |
| 18 | Empty `src/components/shared/` directory | 🟢 Low | `src/components/shared/` | — | Remove empty directory or populate with shared components |

---

## Completed Tasks

| # | Task | Sprint | Completed |
|---|------|--------|-----------|
| 19 | Enable TypeScript strict mode | S1 | ✅ |
| 20 | Fix vite config alias | S1 | ✅ |
| 21 | Remove unused dependencies (90 packages) | S1 | ✅ |
| 22 | Add RTL support | S1 | ✅ |
| 23 | Create shared types (`src/types/index.ts`) | S1 | ✅ |
| 24 | Create utility functions (`lib/utils.ts`) | S1 | ✅ |
| 25 | Create UI primitives (Badge, Button, Card, Skeleton, Toast) | S1 | ✅ |
| 26 | Create ErrorBoundary component | S1 | ✅ |
| 27 | Create `useTheme` and `useLocalStorage` hooks | S1 | ✅ |
| 28 | Move portal views to `components/portals/` | S1 | ✅ |
| 29 | Docker Compose (PostgreSQL + Redis) | S2 | ✅ |
| 30 | Prisma schema (8 models, 6 enums) | S2 | ✅ |
| 31 | Database migration | S2 | ✅ |
| 32 | NestJS + GraphQL setup | S2 | ✅ |
| 33 | Auth module (register + login) | S2 | ✅ |
| 34 | Tickets module (CRUD + status update) | S2 | ✅ |
| 35 | Products module (CRUD) | S2 | ✅ |
| 36 | Customers module (queries) | S2 | ✅ |
| 37 | Users module | S2 | ✅ |
| 38 | Seed script | S2 | ✅ |
| 39 | GraphQL fetch wrapper (`src/api/graphql.ts`) | S3 | ✅ |
| 40 | Query/mutation strings (`src/api/queries.ts`) | S3 | ✅ |
| 41 | API type definitions (`src/api/types.ts`) | S3 | ✅ |
| 42 | Type transform layer (`src/api/transform.ts`) | S3 | ✅ |
| 43 | Agent + Customer transforms | S3 | ✅ |
| 44 | `useAuth` hook with real GQL | S3 | ✅ |
| 45 | `useTickets` hook | S3 | ✅ |
| 46 | `useProducts` / `useCustomers` / `useUsers` hooks | S3 | ✅ |
| 47 | Wire create ticket → API (all 3 portals) | S3 | ✅ |
| 48 | Wire update ticket status → API (TicketInbox + Details) | S3 | ✅ |
| 49 | Documentation system (14 docs + 7 .ai files) | S3 | ✅ |
| 50 | Implement `createCustomer` mutation | S4 | ✅ |
| 51 | Wire customer creation → `createCustomer` API | S4 | ✅ |
