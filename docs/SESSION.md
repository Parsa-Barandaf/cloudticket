# Session Log

> Single source of truth for all development sessions. Never depend on conversation history — always read this file first.

---

## Session 2026-07-26 — User Management: Departments, Custom Roles, User CRUD

**Duration**: Complete
**Objective**: Complete the users section in the management portal — support teams (departments), roles & access matrix (custom roles with permissions), add new user (create/edit/delete with organization/customer toggle).

---

### Completed Tasks

**Departments (Teams tab)**: CRUD with name, lead, assigned products — ✅ Complete
**Custom Roles (Roles tab)**: CRUD with permission matrix (JSON), delete with user reassignment — ✅ Complete
**User CRUD**: create (with org/customer toggle), update, delete (with customer-linked guard) — ✅ Complete
**Customer badge**: Show "مشتری" amber badge in RBAC column for customer-type users — ✅ Complete

---

### Files Modified

| # | File | Change |
|---|------|--------|
| 1 | `backend/prisma/schema.prisma` | Added `Department`, `CustomRole` models; `phone`, `company`, `departmentId`, `customRoleId` on `User` |
| 2 | `backend/prisma/migrations/20260726100856_add_department_customrole_user_fields/` | New migration |
| 3 | `backend/src/common/models/department.model.ts` | New GraphQL type |
| 4 | `backend/src/common/models/custom-role.model.ts` | New GraphQL type |
| 5 | `backend/src/common/models/user.model.ts` | Added `phone`, `company`, `departmentId`, `customRoleId` fields |
| 6 | `backend/src/common/dto/department.input.ts` | New — `CreateDepartmentInput`, `UpdateDepartmentInput` |
| 7 | `backend/src/common/dto/custom-role.input.ts` | New — `CreateCustomRoleInput`, `UpdateCustomRoleInput`, `DeleteCustomRoleInput` (with `reassignRoleId`) |
| 8 | `backend/src/common/dto/user.input.ts` | New — `CreateUserInput`, `UpdateUserInput` |
| 9 | `backend/src/users/departments.service.ts` | New — CRUD; delete clears `departmentId` on users |
| 10 | `backend/src/users/custom-roles.service.ts` | New — CRUD; delete reassigns users or clears `customRoleId` |
| 11 | `backend/src/users/users.service.ts` | Added `create()`, `update()`, `delete()` with customer-profile guard (Persian error) |
| 12 | `backend/src/users/users.resolver.ts` | Added 8 mutations + 6 queries for departments, customRoles, user CRUD |
| 13 | `backend/src/users/users.module.ts` | Registers `DepartmentsService`, `CustomRolesService` |
| 14 | `backend/src/access-requests/access-requests.service.ts` | Approve now saves `phone` + `company` on user create |
| 15 | `backend/src/schema.gql` | Auto-generated — new types, inputs, queries, mutations |
| 16 | `src/api/types.ts` | Added `ApiDepartment`, `ApiCustomRole`; updated `ApiUser` with new fields |
| 17 | `src/api/queries.ts` | Added 12 new query/mutation strings for departments, customRoles, user CRUD |
| 18 | `src/hooks/useDepartments.ts` | New — fetch, create, update, delete |
| 19 | `src/hooks/useCustomRoles.ts` | New — fetch, create, update, delete |
| 20 | `src/hooks/useUsers.ts` | Added `createUser`, `updateUser`, `deleteUser` |
| 21 | `src/components/portals/UserManagement.tsx` | Full wiring: Users/RBAC/Teams tabs; org/customer toggle form; confirm dialogs; dark mode; customer badge |

### Documentation Updated

| # | File | Change |
|---|------|--------|
| 1 | `docs/SESSION.md` | This entry |
| 2 | `docs/TASKS.md` | Added user management tasks to Completed |
| 3 | `docs/CHANGELOG.md` | Added `[1.2.0]` entry |
| 4 | `docs/API.md` | Added User CRUD, Department, CustomRole endpoints |
| 5 | `docs/DATABASE.md` | Added Department, CustomRole tables; updated User fields |
| 6 | `docs/ROADMAP.md` | Updated sprint status |

---

### Known Issues

| # | Issue | Severity |
|---|-------|----------|
| 1 | `UserManagement.tsx` is ~1,737 lines — needs decomposition | Low |
| 2 | `DashboardPortal.tsx` still 4,611 lines | Low |

---

### Next Recommended Task

Continue with Sprint 4 remaining backend CRUD tasks (createTicketMessage, updateTicket, Activity/Notification CRUD, RBAC guards, input validation, pagination).

---

### Current Sprint Progress

**Sprint 4: Complete Backend CRUD** — 🔄 In Progress (2/9 tasks complete, plus 3 new user management tasks)

| Task | Status |
|------|--------|
| 1 — `createCustomer` mutation | ✅ |
| 2 — `createTicketMessage` mutation | ❌ |
| 3 — `updateTicket` mutation | ❌ |
| 4 — Activity CRUD | ❌ |
| 5 — Notification CRUD | ❌ |
| 6 — RBAC guards | ❌ |
| 7 — Input validation | ❌ |
| 8 — Pagination | ❌ |
| 9 — Search/filter | ❌ |
| User Management — Departments CRUD | ✅ |
| User Management — Custom Roles CRUD | ✅ |
| User Management — User CRUD + badge | ✅ |

---

## Session 2026-07-25 — Implement `createCustomer` Mutation (Sprint 4, Task 1)

**Duration**: Complete
**Objective**: Implement the `createCustomer` GraphQL mutation — backend resolver/service + frontend API wiring.

---

### Completed Task

**Task 1 (Sprint 4): Implement `createCustomer` mutation** — ✅ Complete

Also completed **Task 14 (Sprint 5): Wire customer creation → `createCustomer` API** — ✅ Complete (frontend wiring done in same session)

---

### Files Modified

| # | File | Change |
|---|------|--------|
| 1 | `backend/src/common/dto/customer.input.ts` | Added `website?`, `address?`, `status?` fields; `tier`/`status` now use enum types |
| 2 | `backend/src/customers/customers.service.ts` | Added `create()` method with user validation + duplicate check |
| 3 | `backend/src/customers/customers.resolver.ts` | Added `@Mutation(() => Customer) createCustomer(@Args('input'))` |
| 4 | `src/api/queries.ts` | Added `CREATE_CUSTOMER` mutation string |
| 5 | `src/components/portals/DashboardPortal.tsx` | Replaced mock create with API call; added `useUsers`, `gql`, `CREATE_CUSTOMER` imports; fixed async await; added `lastActivity` mapping |

### Documentation Updated

| # | File | Change |
|---|------|--------|
| 1 | `docs/SESSION.md` | Full session summary with all sections |
| 2 | `docs/TASKS.md` | Moved Task 1, 14 to Completed; removed blocker; updated Sprint 5 table |
| 3 | `docs/CHANGELOG.md` | Added `[1.1.0]` entry for createCustomer |
| 4 | `docs/API.md` | Added createCustomer mutation docs; removed from Missing Mutations |
| 5 | `docs/ROADMAP.md` | Sprint 4: Task 1 ✅; Sprint 5: customer wiring ✅ |
| 6 | `.ai/CURRENT_STATE.md` | Updated sprint, task, backend/frontend progress, mock inventory, DB state |
| 7 | `.ai/MEMORY.md` | Updated mock data table; added createCustomer pattern; updated queries count |

---

### Known Issues

| # | Issue | Severity |
|---|-------|----------|
| 1 | Form `onSubmit` at `DashboardPortal.tsx:4351` and button at `:4538` still use `setIsSavingCustomer` instead of the primary `setIsCustomerLoading` — two separate loading states for the same operation | Low |
| 2 | Inline Persian→English maps (`businessTypeToApiTier`, `persianStatusToApi`) added in `DashboardPortal.tsx` — adds to pre-existing duplication (ADR-011) | Low |
| 3 | Race condition: if `useUsers` hasn't loaded when admin submits create customer form, lookup by email fails | Low |

---

### Next Recommended Task

**Task 2 — Implement `createTicketMessage` mutation** (Sprint 4, High priority)

Rationale:
- High priority per roadmap
- Blocks Sprint 5 Task 10 (wire reply composer)
- Follows the same pattern established by Task 1 (DTO + resolver + service)

Alternative: **Task 6 — RBAC guards** (Critical severity, no dependencies)

---

### Current Sprint Progress

**Sprint 4: Complete Backend CRUD** — 🔄 In Progress (1/8 tasks complete)

| Task | Status |
|------|--------|
| 1 — `createCustomer` mutation | ✅ |
| 2 — `createTicketMessage` mutation | ❌ |
| 3 — `updateTicket` mutation | ❌ |
| 4 — Activity CRUD | ❌ |
| 5 — Notification CRUD | ❌ |
| 6 — RBAC guards | ❌ |
| 7 — Input validation | ❌ |
| 8 — Pagination | ❌ |
| 9 — Search/filter | ❌ |

---

## Session 2026-07-25 — Project Assessment & Documentation System

**Duration**: Prior session
**Objective**: Create comprehensive Project Assessment Report and initial documentation system.

### Work Done
- Scanned entire repository (frontend + backend + infra)
- Created 14 docs in `docs/` and 7 docs in `.ai/`
- Documented all 8 database tables, 6 enums, 7 queries, 5 mutations (backend schema)
- Authored 8 Architectural Decision Records

---

## Session 2026-07-25 — Wire Mutations to Real API (Sprint 3 Completion)

**Duration**: Prior session
**Objective**: Wire all "ثبت تیکت جدید" (Create Ticket) buttons and ticket status change actions to call the real GraphQL API.

### Problem
All create ticket and status change operations used mock data: `DashboardPortal.tsx` had inline `handleCreateTicket` with `Math.random()` IDs and local `setTickets`. `TicketInbox.tsx` and `TicketDetailsWorkspace.tsx` called `setTickets` with hardcoded Persian status strings. `AgentPortal.tsx` had an uncontrolled form with no state and a mock `showToast` on submit. `CustomerPortal.tsx` generated random `TKT-XXXX` IDs and pushed to local state.

### Changes Made

**File 1: `src/App.tsx`** (line ~60)
- Added `customersList={realCustomers}` prop to `<CustomerPortalView>`
- Previously missing — customer portal had no way to look up customer IDs

**File 2: `src/components/portals/DashboardPortal.tsx`**
- Destructured `createTicket` and `updateTicketStatus` from `useTickets()` hook (line ~208)
- Replaced mock `handleCreateTicket` (line ~398): removed `Math.random()` ID generation, local `setTickets`, mock activity/notification appending
- New flow: looks up customer ID from `customers` array → calls `apiCreateTicket({ title, priority, customerId })`
- Converted customer text `<input>` to `<select>` from existing customers (ensures valid `customerId`)
- Added `showFeedback('تیکت با موفقیت ثبت شد.', 'success')` on success
- Removed local mock `newTicketId` generation
- Removed mock activity push (`setActivities`)
- Removed mock notification push (`setNotifications`)

**File 3: `src/components/portals/CustomerPortal.tsx`**
- Added `customersList` prop to `CustomerPortalViewProps` interface
- Imported `gql` from `../../api/graphql` and `CREATE_TICKET` from `../../api/queries`
- Imported `Customer` type
- Replaced mock `handleCreateTicket` (line ~82): removed mock ID generation with `Math.random() * 9000`
- New flow: `customersList.find(c => c.email === userEmail)` → calls `gql(CREATE_TICKET, { input })` — gracefully catches errors, still updates local state as fallback

**File 4: `src/components/portals/AgentPortal.tsx`**
- Imported `gql` and `CREATE_TICKET`
- Added controlled form state: `const [newTicketFields, setNewTicketFields] = useState({ title: '', customerId: '', productId: '', priority: 'متوسط' })`
- Converted all form fields from uncontrolled to controlled (`value` + `onChange`)
- Changed customer `<select>` value from `c.name` to `c.id`
- Added `onSubmit` handler that calls `gql(CREATE_TICKET, { input: { title, priority, customerId } })`
- Reset form state after submission

**File 5: `src/components/portals/TicketInbox.tsx`**
- Imported `gql` and `UPDATE_TICKET_STATUS`
- Added `statusToApi` reverse map (`'باز' → 'OPEN'`, `'در حال بررسی' → 'INVESTIGATING'`, `'منتظر پاسخ مشتری' → 'AWAITING_CUSTOMER'`, `'بسته شده' → 'CLOSED'`)
- Added `updateStatusViaApi(id, status)` helper — calls `gql(UPDATE_TICKET_STATUS, { input: { id, status: apiStatus } })` with try/catch
- Wired into "تغییر وضعیت نوبتی" button (line ~997): added `updateStatusViaApi(t.id, nextStatus)` after `setTickets`
- Wired into "بستن رسمی تیکت" button (line ~1030): added `updateStatusViaApi(t.id, 'بسته شده')` after `setTickets`

**File 6: `src/components/portals/TicketDetailsWorkspace.tsx`**
- Imported `gql` and `UPDATE_TICKET_STATUS`
- Added `statusToApi` map (same as TicketInbox, with `'حل شده' → 'RESOLVED'`)
- Added `apiUpdateTicketStatus(id, status)` helper
- Wired into `handleUpdateTicketStatus` (line ~253): added `apiUpdateTicketStatus(currentTicket.id, newStatus)` after `setTickets` and `setCurrentTicket`

### Verification
- `npm run build` (vite build) → ✅ 0 errors, 2097 modules transformed in 21s
- Warning: chunk size > 500 kB (expected for 4,611-line component)

### Next Steps
Sprint 4: Complete backend CRUD. Sprint 5: Wire remaining frontend mutations.

---

## Prior Sessions (Reconstructed)

### Sprint 1 — Frontend Stabilization

| Task | Details |
|------|---------|
| TypeScript strict mode | Enabled `strict: true` in `tsconfig.json`, fixed paths |
| Unused deps removal | Removed express, dotenv, autoprefixer, esbuild, tsx, @types/express — 90 packages cleaned |
| RTL support | `index.html`: `lang="fa" dir="rtl"` |
| Centralized types | Moved `src/types.ts` → `src/types/index.ts` |
| Shared UI | Created Button, Badge, Card, Skeleton, Toast primitives |
| Error boundary | `ErrorBoundary.tsx` with retry button |
| Theme hook | `useTheme.ts` — dark/light with localStorage persistence |
| Portal relocation | Moved all views to `components/portals/` |
| Build verification | `tsc --noEmit`: 0 errors, `vite build`: succeeds |

### Sprint 2 — Backend Foundation

| Task | Details |
|------|---------|
| NestJS 11 + GraphQL | Apollo code-first, autoSchemaFile |
| Docker Compose | PostgreSQL 16 + Redis 7 |
| Prisma schema | 8 models, 6 enums |
| Auth module | JWT with passport-jwt, bcrypt, register + login |
| Core modules | tickets, products, customers, users — each with resolver + service |
| Seed script | 6 users, 1 customer, 4 products, 5 tickets |

### Sprint 3 — Frontend-Backend Integration (prior to wire-up)

| Task | Details |
|------|---------|
| API layer | `src/api/graphql.ts` (GQL fetch + JWT), `queries.ts`, `types.ts` |
| Transform layer | `transform.ts` (API→frontend with Persian), `transform-agent.ts`, `transform-customer.ts` |
| Hooks | `useAuth`, `useTickets`, `useProducts`, `useCustomers`, `useUsers` |
