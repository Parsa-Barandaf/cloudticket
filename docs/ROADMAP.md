# Roadmap

> Current status as of Sprint 4 Task 1 completion. This is the single source of truth for planned work.

---

## Legend

| Icon | Meaning |
|------|---------|
| ✅ | Complete |
| 🔄 | In Progress |
| ⏳ | Planned |
| ❌ | Not Started |

---

## Sprint 1 — Frontend Stabilization & Refactoring (✅ Complete)

**Effort**: ~5 days
**Scope**: TypeScript strict mode, RTL support, shared types, UI primitives, portal relocation

| Task | Status |
|------|--------|
| Enable TypeScript strict mode (`tsconfig.json`) | ✅ |
| Fix vite config alias (`'.'` → `'src'`) | ✅ |
| Remove unused dependencies (90 packages cleaned) | ✅ |
| Add RTL support (`lang="fa" dir="rtl"`) | ✅ |
| Create shared types (`src/types/index.ts`) | ✅ |
| Create utility functions (`lib/utils.ts`: `cn()`, `formatDate()`, `formatTimeAgo()`) | ✅ |
| Create UI primitives (Badge, Button, Card, Skeleton, Toast) | ✅ |
| Create ErrorBoundary component | ✅ |
| Create `useTheme` and `useLocalStorage` hooks | ✅ |
| Move portal views to `components/portals/` | ✅ |
| Maintain backward-compatible re-exports from old paths | ✅ |
| Verify `tsc --noEmit` (0 errors) | ✅ |
| Verify `vite build` | ✅ |

---

## Sprint 2 — Backend Foundation (✅ Complete)

**Effort**: ~7 days
**Scope**: NestJS, GraphQL, Prisma, PostgreSQL, JWT, seed data

| Task | Status |
|------|--------|
| Docker Compose (PostgreSQL 16 + Redis 7) | ✅ |
| Prisma schema (8 models: User, Customer, Product, PCC, Ticket, TicketMessage, Activity, Notification) | ✅ |
| 6 Prisma enums (UserRole, TicketPriority, TicketStatus, ProductStatus, CustomerTier, CustomerStatus) | ✅ |
| Database migration (`20260723103135_init`) | ✅ |
| NestJS 11 + Apollo GraphQL (code-first) scaffolding | ✅ |
| Auth module: register + login mutations with JWT | ✅ |
| Users module: `users` query | ✅ |
| Tickets module: `tickets`/`ticket` queries + `createTicket`/`updateTicketStatus` mutations | ✅ |
| Products module: `products`/`product` queries + `createProduct` mutation | ✅ |
| Customers module: `customers`/`customer` queries | ✅ |
| Seed script with demo data (6 users, 1 customer, 4 products, 5 tickets, 4 activities, 3 notifications) | ✅ |
| CORS configuration (ports 3000, 5173) | ✅ |

---

## Sprint 3 — Frontend-Backend Integration (✅ Complete)

**Effort**: ~5 days
**Scope**: API layer, hooks, wire create/update mutations

| Task | Status |
|------|--------|
| GraphQL fetch wrapper (`src/api/graphql.ts` — JWT Bearer injection) | ✅ |
| Query/mutation strings (`src/api/queries.ts` — 5 queries, 4 mutations) | ✅ |
| API type definitions (`src/api/types.ts` — ApiUser, ApiCustomer, ApiProduct, ApiTicket, etc.) | ✅ |
| Type transform/mapping layer (`src/api/transform.ts` — Persian localization) | ✅ |
| Agent transform (`src/api/transform-agent.ts` — AgentTicketItem, SLA) | ✅ |
| Customer transform (`src/api/transform-customer.ts` — CustomerTicketItem, ActiveProductItem) | ✅ |
| `useAuth` hook — real GQL login + localStorage fallback | ✅ |
| `useTickets` hook — fetch, createTicket, updateTicketStatus | ✅ |
| `useProducts` hook — fetch products | ✅ |
| `useCustomers` hook — fetch customers | ✅ |
| `useUsers` hook — fetch users | ✅ |
| Wire create ticket → API (DashboardPortal, CustomerPortal, AgentPortal) | ✅ |
| Wire update ticket status → API (TicketInbox, TicketDetailsWorkspace) | ✅ |
| Documentation system (21 files across `docs/` and `.ai/`) | ✅ |

---

## Sprint 4 — Complete Backend CRUD (🔄 In Progress)

**Effort estimate**: ~6 days (Tasks 1, 10–15 completed)
**Scope**: Missing mutations, RBAC guards, input validation, pagination, user management

| Task | Priority | Status |
|------|----------|--------|
| Implement `createCustomer` mutation (DTO exists, resolver + service missing) | High | ✅ |
| Implement `createTicketMessage` mutation (model exists, DTO + resolver + service missing) | High | ❌ |
| Add `updateTicket` mutation (allow changing assignedTo, product, priority, title) | High | ❌ |
| Add Activity CRUD resolvers (queries + mutations) | Medium | ❌ |
| Add Notification CRUD resolvers (`notifications` query, `createNotification`, `markNotificationRead`) | Medium | ❌ |
| Add RBAC guards (`@UseGuards(RolesGuard)` + `@Roles()` decorator) | High | ❌ |
| Add class-validator decorators to all input DTOs | Medium | ❌ |
| Add pagination arguments (`take`/`skip`) to list queries | Medium | ❌ |
| Add search/filter arguments (status, priority, customerId filters on `tickets`) | Medium | ❌ |
| **Department CRUD** (model + DTOs + service + resolver) | High | ✅ |
| **CustomRole CRUD** (model + DTOs + service + resolver + reassign on delete) | High | ✅ |
| **User CRUD** (create/update/delete with org/customer toggle) | High | ✅ |
| **Customer badge** — "مشتری" tag in RBAC column | Low | ✅ |
| **Access request approve** — save phone + company on user create | Medium | ✅ |
| **Delete guard** — block delete of customer-linked users with Persian error | Medium | ✅ |

---

## Sprint 5 — Wire Remaining Frontend Mutations (⏳ Planned)

**Effort estimate**: ~3 days
**Scope**: Wire reply, activities, notifications, product/customer creation, assignment

| Task | Priority | Status |
|------|----------|--------|
| Wire reply composer → `createTicketMessage` API | High | ❌ |
| Wire activities → Activity API | Medium | ❌ |
| Wire notifications → Notification API | Medium | ❌ |
| Wire product creation → `createProduct` API | High | ❌ |
| Wire customer creation → `createCustomer` API | High | ✅ |
| Wire ticket assignment → `updateTicket` API | Medium | ❌ |

---

## Sprint 6 — Component Decomposition & Shared Layout (⏳ Planned)

**Effort estimate**: ~4 days
**Scope**: Extract shared components, decompose monoliths, React Router

| Task | Priority | Status |
|------|----------|--------|
| Extract Sidebar into `<shared/Sidebar>` component | Medium | ❌ |
| Extract Header into `<shared/Header>` component | Medium | ❌ |
| Create `<PortalLayout>` wrapper | Medium | ❌ |
| Decompose `DashboardPortal.tsx` (4,611 lines → ~6 focused components) | High | ❌ |
| Decompose `UserManagement.tsx` (1,737 lines) | Medium | ❌ |
| Decompose `AgentPortal.tsx` (2,248 lines) | Medium | ❌ |
| Install React Router / implement route-based navigation | Medium | ❌ |
| Add loading/error/empty state patterns across all portals | Medium | ❌ |
| Clean up unused `src/components/shared/` directory | Low | ❌ |

---

## Sprint 7 — Polish & Production Readiness (⏳ Planned)

**Effort estimate**: ~5 days
**Scope**: Security, caching, testing, accessibility

| Task | Priority | Status |
|------|----------|--------|
| Add refresh token mechanism (JWT rotation) | High | ❌ |
| Add rate limiting (express-rate-limit or NestJS @nestjs/throttler) | Medium | ❌ |
| Implement Redis caching in backend | Low | ❌ |
| Add file upload support (ticket attachments) | Medium | ❌ |
| Implement E2E tests (Cypress or Playwright) | Low | ❌ |
| Accessibility audit (WCAG 2.1) | Low | ❌ |
| Performance audit (Lighthouse) | Low | ❌ |
| Fix `mapConnection` bug (`productId` set to `customerId`) | Medium | ❌ |
| Fix `useLocalStorage` type fidelity issue | Low | ❌ |

---

## Known Issues / Technical Debt

| Issue | Impact | Sprint to Address |
|-------|--------|-------------------|
| `DashboardPortal.tsx` is 4,611 lines | Maintainability | S6 |
| `UserManagement.tsx` is ~1,737 lines | Maintainability | S6 |
| `mapConnection` sets `productId: c.customerId` | Data integrity | S7 |
| Customer creation wired → API (Task 1 frontend work) | Integration | S4 |
| No RBAC on any backend endpoint | Security | S4 |
| No input validation on GraphQL mutations | Data quality | S4 |
| Redis provisioned but unused | Waste | S7 |
| Customer model lacks direct `email` field | Usability | S4 |
| JWT secret has hardcoded fallback | Security | S4 |
| No pagination on list queries | Performance | S4 |
| Activity + Notification detached (no FKs) | Integrity | S4 |
| Duplicate inline Persian→English maps | Maintainability | S5 |

---

## Open Questions

| # | Question | Relevant Sprint |
|---|----------|-----------------|
| 1 | Should `createTicketMessage` use a structured DTO or inline args? | S4 |
| 2 | Should `createCustomer` auto-create a `User` account? | S4 — Currently requires existing `userId` FK. Frontend looks up user by email. |
| 3 | Should Activity/Notification be server-auto-generated or client-submitted? | S4 |
| 4 | Should login localStorage fallback be removed? | S5 |
| 5 | Should portals use lazy loading (`React.lazy`)? | S6 |
| 6 | Ticket pagination: cursor-based vs offset-based? | S4 |
| 7 | Should `@google/genai` unused dep be removed? | S7 |
