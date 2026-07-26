# Current Project State

> Single source of truth. Updated at end of every session. NEVER rely on conversation history — read this file.

---

## Snapshot Meta

| Field | Value |
|-------|-------|
| **Last Updated** | 2026-07-25 |
| **Current Sprint** | Sprint 4 (Backend CRUD Completion) — In Progress |
| **Next Sprint** | Sprint 5 (Wire Remaining Frontend Mutations) |
| **Build Status** | ✅ `npm run build` passes (0 errors) |
| **TypeScript** | ✅ `tsc --noEmit` passes (0 errors) |
| **Backend Build** | ✅ `nest build` passes |

---

## Sprint Status

| Sprint | Title | Status |
|--------|-------|--------|
| Sprint 1 | Frontend Stabilization & Refactoring | ✅ Complete |
| Sprint 2 | Backend Foundation | ✅ Complete |
| Sprint 3 | Frontend-Backend Integration | ✅ Complete |
| Sprint 4 | Complete Backend CRUD | 🔄 In Progress |
| Sprint 5 | Wire Remaining Frontend Mutations | ⏳ Planned |
| Sprint 6 | Component Decomposition & Shared Layout | ⏳ Planned |
| Sprint 7 | Polish & Production Readiness | ⏳ Planned |

---

## Current Task

**Task 1 (Sprint 4): Implement `createCustomer` mutation — ✅ Complete.**

Implemented backend mutation (`customers.resolver.ts` + `customers.service.ts`) with user validation and duplicate check. Extended DTO with `website`, `address`, `status` fields. Wired frontend `DashboardPortal.tsx` to call `gql(CREATE_CUSTOMER)` instead of mock data. Awaiting next task.

---

## Project Inventory — Mock Data Remaining

The following features still use local/mock data instead of API calls:

| Feature | Location | What It Does Instead |
|---------|----------|---------------------|
| Product creation | `DashboardPortal.tsx` `handleCreateProduct` (~line 460) | Generates mock ID, pushes to local `setProducts` |
| Customer creation | `DashboardPortal.tsx` `handleSaveCustomer` (~line 668) | ✅ Wired to API — calls `gql(CREATE_CUSTOMER)`, looks up user by email |
| Reply/send message | `TicketDetailsWorkspace.tsx` `handleSendReply` (~line 160) | Pushes to local `conversationThreads` state |
| Reply/send in AgentPortal | `AgentPortal.tsx` (~line 600) | Pushes to local `conversationThreads` |
| Activities | `DashboardPortal.tsx` passim | `setActivities` calls with mock `ActivityItem` objects |
| Notifications | `DashboardPortal.tsx` passim | `setNotifications` calls with mock `NotificationItem` objects |
| Ticket assignment (rotate agent) | `TicketInbox.tsx` (line ~1004) | Local `setTickets` only |
| Ticket assignment in Details | `TicketDetailsWorkspace.tsx` `handleUpdateTicketAgent` (line ~260) | Local `setTickets` only |

---

## Backend Progress Detail

### Complete Resolvers & Services

| Module | Query | Mutation | Service Complete |
|--------|-------|----------|-----------------|
| **Auth** | — | `login`, `register` | ✅ Full (bcrypt + JWT) |
| **Tickets** | `tickets`, `ticket(id)` | `createTicket`, `updateTicketStatus` | ✅ Full (Prisma CRUD) |
| **Products** | `products`, `product(id)` | `createProduct` | ✅ Full |
| **Customers** | `customers`, `customer(id)` | `createCustomer` | ✅ Full (Prisma CRUD) |
| **Users** | `users` | — | ✅ Queries only |

### Missing Resolvers/Services (DTO or Model Exists)

| Feature | DTO Exists? | Model Exists? | Resolver? | Service? |
|---------|-------------|---------------|-----------|----------|
| `createTicketMessage` | ❌ | ✅ `TicketMessage` | ❌ | ❌ |
| `updateTicket` (full) | ❌ | ✅ `Ticket` | ❌ | ❌ |
| Activity queries/mutations | ❌ | ✅ `Activity` | ❌ | ❌ |
| Notification queries/mutations | ❌ | ✅ `Notification` | ❌ | ❌ |

### Auth/Authorization Status

| Feature | Status | Notes |
|---------|--------|-------|
| JWT generation | ✅ | `auth.service.ts` — HS256, configurable secret |
| JWT validation | ✅ | `jwt.strategy.ts` — Bearer token extraction |
| RBAC guards | ❌ | No `@UseGuards()` anywhere in backend |
| Password hashing | ✅ | bcryptjs, 10 rounds |
| Rate limiting | ❌ | No protection |
| Token refresh | ❌ | 7-day fixed expiry |

---

## Frontend Detail

### Portal Components

| Component | Lines | API Integration | Mock Data Remaining |
|-----------|-------|-----------------|---------------------|
| `DashboardPortal.tsx` | 4,982 | Create ticket ✅, Status update ✅, Customer creation ✅ | Products, Activities, Notifications |
| `AgentPortal.tsx` | 2,248 | Create ticket ✅ | Reply/messages, ticket assignment |
| `CustomerPortal.tsx` | 509 | Create ticket ✅ | Reply/messages (via `conversationThreads`) |
| `TicketInbox.tsx` | 1,126 | Status update ✅ | Agent assignment, transfer to other product |
| `TicketDetailsWorkspace.tsx` | 1,237 | Status update ✅ | Reply/messages, assignment |
| `CustomerWorkspace.tsx` | 1,176 | — | Fully mock (product connections, license info) |
| `UserManagement.tsx` | 1,737 | — | Fully mock (users CRUD) |
| `NotificationCenter.tsx` | 1,090 | — | Fully mock (notifications) |

### API Layer Files

| File | Purpose | Status |
|------|---------|--------|
| `src/api/graphql.ts` | Generic GQL fetch with JWT Bearer injection | ✅ Complete |
| `src/api/queries.ts` | All query/mutation strings | ✅ Complete (5 queries, 5 mutations) |
| `src/api/types.ts` | API response interfaces (ApiTicket, etc.) | ✅ Complete |
| `src/api/transform.ts` | API→frontend mapping (Persian localization) | ✅ Complete |
| `src/api/transform-agent.ts` | Agent transforms + SLA | ✅ Complete |
| `src/api/transform-customer.ts` | Customer transforms | ✅ Complete |
| `src/api/client.ts` | REST fetch wrapper | ❌ Unused (dead code) |

### Hooks

| Hook | File | API Call | Status |
|------|------|----------|--------|
| `useAuth` | `src/hooks/useAuth.ts` | `LOGIN_MUTATION` | ✅ |
| `useTickets` | `src/hooks/useTickets.ts` | `GET_TICKETS`, `CREATE_TICKET`, `UPDATE_TICKET_STATUS` | ✅ |
| `useProducts` | `src/hooks/useProducts.ts` | `GET_PRODUCTS` | ✅ |
| `useCustomers` | `src/hooks/useCustomers.ts` | `GET_CUSTOMERS` | ✅ |
| `useUsers` | `src/hooks/useUsers.ts` | `GET_USERS` | ✅ |
| `useTheme` | `src/hooks/useTheme.ts` | None (localStorage only) | ✅ |
| `useLocalStorage` | `src/hooks/useLocalStorage.ts` | None (localStorage only) | ⚠️ Bug: uses `String()` for all values |

---

## Database State

| Table | Records (Seeded) | Has API? |
|-------|------------------|----------|
| `User` | 6 | ✅ Query + Mutation (register) |
| `Customer` | 1 | ✅ Query + Mutation (create) |
| `Product` | 4 | ✅ Query + Mutation (create) |
| `ProductCustomerConnection` | 0 | ❌ No CRUD at all |
| `Ticket` | 5 | ✅ Full CRUD |
| `TicketMessage` | 0 | ❌ No CRUD at all |
| `Activity` | 4 | ❌ No CRUD at all |
| `Notification` | 3 | ❌ No CRUD at all |

---

## Known Issues & Technical Debt

| # | Issue | Severity | Location | Notes |
|---|-------|----------|----------|-------|
| 1 | `mapConnection` sets `productId` to `c.customerId` | Medium | `src/api/transform.ts:79` | Should be `c.productId` |
| 2 | `useLocalStorage` uses `String()` for all values | Low | `src/hooks/useLocalStorage.ts:14` | Loses boolean/number fidelity |
| 3 | `DashboardPortal.tsx` is 4,611 lines | High | `src/components/portals/DashboardPortal.tsx` | Unmaintainable monolith |
| 4 | No RBAC on any backend endpoint | Critical | All backend resolvers | Anyone can call any GQL |
| 5 | No input validation on GQL mutations | Medium | `common/dto/*.ts` | class-validator decorators absent |
| 6 | Activity + Notification tables have no FKs | Low | Prisma schema | No referential integrity |
| 7 | Redis container is provisioned but unused | Low | `docker-compose.yml` | Waste of resources |
| 8 | JWT secret hardcoded fallback | Medium | `backend/src/auth/*.ts` | Falls back to `cmp-jwt-secret` |
| 9 | `AuthPayload` defined inline in resolver | Low | `backend/src/auth/auth.resolver.ts` | Inconsistent with model convention |
| 10 | `seed.ts` uses Prisma adapter pattern | Medium | `backend/prisma/seed.ts` | Service uses standard `PrismaClient` |
| 11 | `src/api/client.ts` is dead code | Low | `src/api/client.ts` | REST wrapper, no imports |
| 12 | Empty `src/components/shared/` directory | Low | `src/components/shared/` | Directory created but empty |
| 13 | Duplicate inline `statusToApi`/`priorityToApi` maps | Low | TicketInbox, TicketDetailsWorkspace, AgentPortal, DashboardPortal, CustomerPortal | Not centralized |

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should `createTicketMessage` accept a structured input DTO or inline args? | Unresolved — input DTO doesn't exist yet |
| 2 | Should `createCustomer` also create a `User` account during registration? | Unresolved — current `Customer` requires a `userId` FK |
| 3 | Should Activity/Notification be auto-generated by the backend (triggers/hooks) or client-submitted? | Unresolved — currently both are manual mock |
| 4 | Should the login fallback (when API is unavailable) be kept or removed? | Unresolved — currently falls back to localStorage mock based on email prefix |
| 5 | Should portal views use lazy loading (React.lazy) given their file sizes? | Unresolved — all 8 portals loaded eagerly |
| 6 | How should pagination work for tickets (cursor-based vs offset)? | Unresolved — no pagination implemented yet |
| 7 | Should `@google/genai` be removed if unused? | Unresolved — may be injected by AI Studio environment |

---

## Current Priorities

1. **🚨 Security**: Implement RBAC guards on all backend endpoints (Critical)
2. **🚨 Backend completeness**: Add missing mutations (`createTicketMessage`, `updateTicket`, etc.)
3. **⚠️ Quality**: Wire remaining frontend mock features to real API
4. **⚠️ Maintainability**: Break down `DashboardPortal.tsx` (4,611 lines)
5. **📋 Polish**: Add input validation, pagination, error handling
