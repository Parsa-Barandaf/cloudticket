# Changelog

> All notable changes to this project. Single source of truth for version history.

---

## [1.2.0] — User Management: Departments, Custom Roles, User CRUD (2026-07-26)

### Added

#### Backend
- **Prisma schema**: `Department` model (id, name, lead, assignedProducts[]), `CustomRole` model (id, name, description, permissions JSON). `User` extended with `phone?`, `company?`, `departmentId?`, `customRoleId?`
- **Migration**: `20260726100856_add_department_customrole_user_fields`
- **Department CRUD**: `CreateDepartmentInput`, `UpdateDepartmentInput` DTOs; `departments`/`department` queries; `createDepartment`/`updateDepartment`/`deleteDepartment` mutations — delete clears `departmentId` on assigned users
- **CustomRole CRUD**: `CreateCustomRoleInput`, `UpdateCustomRoleInput`, `DeleteCustomRoleInput` (with `reassignRoleId`); `customRoles`/`customRole` queries; `createCustomRole`/`updateCustomRole`/`deleteCustomRole` mutations — delete reassigns users or clears `customRoleId`
- **User CRUD**: `CreateUserInput`, `UpdateUserInput` DTOs; `createUser`/`updateUser`/`deleteUser` mutations; delete checks for `customerProfile` and throws Persian error if linked
- **Access request approval**: Now saves `phone` and `company` fields on user create from request data

#### Frontend
- `src/api/queries.ts`: Added 12 new strings — `GET_USERS` with phone/company/departmentId/customRoleId, `CREATE_USER`, `UPDATE_USER`, `DELETE_USER`, `GET_DEPARTMENTS`, `CREATE_DEPARTMENT`, `UPDATE_DEPARTMENT`, `DELETE_DEPARTMENT`, `GET_CUSTOM_ROLES`, `CREATE_CUSTOM_ROLE`, `UPDATE_CUSTOM_ROLE`, `DELETE_CUSTOM_ROLE`
- `src/api/types.ts`: Added `ApiDepartment`, `ApiCustomRole` interfaces; extended `ApiUser` with `phone?`, `company?`, `departmentId?`, `customRoleId?`
- `src/hooks/useDepartments.ts`: New — fetch, create, update, delete
- `src/hooks/useCustomRoles.ts`: New — fetch, create, update, delete
- `src/hooks/useUsers.ts`: Added `createUser()`, `updateUser()`, `deleteUser()`

#### UserManagement Component
- **Users tab**: Real data table (name, email, phone, company, team, role, Jalali date); create/edit drawer with organization/customer type toggle (disabled in edit mode); delete with confirm dialog
- **Roles tab (RBAC)**: List custom roles from API; permission matrix checkboxes toggle via `updateRole`; create/duplicate/delete with replacement role select on delete
- **Teams tab (Departments)**: List from API; product checkboxes for assigned products; create/update/delete with confirm dialog (user count warning)
- **Customer badge**: "مشتری" amber badge next to role in RBAC column for customer-type users
- **Dark mode**: `color-scheme: dark` on `<select>` elements; proper text colors on inputs/labels

### Fixed
- User type toggle now disabled (`opacity-50 cursor-not-allowed`) in edit mode to prevent changing user type
- Delete of customer-linked users now blocked with Persian error message
- Access request approval now preserves phone number and company name

---

## [1.1.0] — Sprint 4 Task 1: `createCustomer` Mutation (2026-07-25)

### Added

#### Backend
- `createCustomer(input: CreateCustomerInput!): Customer!` mutation in `customers.resolver.ts` — validates user exists, checks for duplicate customer profile
- `create()` service method in `customers.service.ts` with Prisma create + full include
- Extended `CreateCustomerInput` DTO: added `website?`, `address?`, `status?` fields; `tier` and `status` now use `CustomerTier`/`CustomerStatus` enum types

#### Frontend
- `CREATE_CUSTOMER` mutation string in `src/api/queries.ts` — returns full customer object with user, tickets, connections
- `DashboardPortal.tsx` `handleSaveCustomer` create branch now calls real API via `gql(CREATE_CUSTOMER)` instead of mock data
- `useUsers` hook imported in `DashboardPortal.tsx` to look up user by email for `userId` linking

### Fixed
- Form `onSubmit` and save button `onClick` now properly `await` the async `handleSaveCustomer` — no more premature loading spinner reset
- Added `lastActivity` field to frontend customer creation mapping (was missing)

---

## [1.0.0] — Sprint 3 Complete (2026-07-25)

### Added

#### Frontend — API Layer
- `src/api/graphql.ts` — Generic GraphQL fetch wrapper with JWT Bearer token injection from `localStorage.cmp_access_token`
- `src/api/queries.ts` — All GraphQL query/mutation strings (5 queries: `GET_TICKETS`, `GET_TICKET`, `GET_PRODUCTS`, `GET_CUSTOMERS`, `GET_USERS`; 4 mutations: `LOGIN_MUTATION`, `REGISTER_MUTATION`, `CREATE_TICKET`, `UPDATE_TICKET_STATUS`)
- `src/api/types.ts` — TypeScript interfaces: `ApiUser`, `ApiCustomer`, `ApiProduct`, `ApiConnection`, `ApiTicketMessage`, `ApiTicket` + 6 enum type aliases (`UserRole`, `TicketPriority`, `TicketStatus`, `ProductStatus`, `CustomerTier`, `CustomerStatus`)
- `src/api/transform.ts` — API → frontend type mapping: `mapTicket()`, `mapProduct()`, `mapCustomer()`, `mapConnection()` with Persian enum localization
- `src/api/transform-agent.ts` — Agent-specific transforms: `mapTicketToAgentItem()`, `mergeAgentTicketData()` with SLA timer calculations
- `src/api/transform-customer.ts` — Customer-specific transforms: `mapTicketToCustomerItem()`, `mapProductToActiveItem()`

#### Frontend — Hooks
- `src/hooks/useAuth.ts` — `login(email, password)` → calls `LOGIN_MUTATION`, stores JWT in localStorage, returns `{ email, role }` or `null`
- `src/hooks/useTickets.ts` — `fetchTickets()`, `createTicket(input)`, `updateTicketStatus(id, status)` — fetches and sets state
- `src/hooks/useProducts.ts` — `fetchProducts()` → maps via `mapProduct()`
- `src/hooks/useCustomers.ts` — `fetchCustomers()` → maps via `mapCustomer()`
- `src/hooks/useUsers.ts` — `fetchUsers()` → raw `ApiUser[]`

#### Frontend — Mutation Wiring
- **DashboardPortal**: `handleCreateTicket` now calls `apiCreateTicket()` from `useTickets` hook. Customer input changed from text to `<select>` dropdown of existing customers.
- **CustomerPortal**: `handleCreateTicket` now calls `gql(CREATE_TICKET, { input })`. Looks up `customerId` by matching `userEmail` against `customersList`.
- **AgentPortal**: Create ticket form converted from uncontrolled to controlled. Now calls `gql(CREATE_TICKET, { input })` on submit.
- **TicketInbox**: "تغییر وضعیت نوبتی" and "بستن رسمی تیکت" buttons now call `gql(UPDATE_TICKET_STATUS, { input })` via `updateStatusViaApi()` helper.
- **TicketDetailsWorkspace**: Status dropdown now calls `gql(UPDATE_TICKET_STATUS, { input })` via `apiUpdateTicketStatus()` helper.

#### Backend
- NestJS 11 project with Apollo GraphQL (code-first, `autoSchemaFile: 'src/schema.gql'`)
- 8 Prisma models: User, Customer, Product, ProductCustomerConnection, Ticket, TicketMessage, Activity, Notification
- 6 Prisma enums: UserRole (ADMIN/AGENT/CUSTOMER), TicketPriority (CRITICAL/HIGH/MEDIUM/LOW), TicketStatus (OPEN/INVESTIGATING/AWAITING_CUSTOMER/RESOLVED/CLOSED), ProductStatus (ACTIVE/INACTIVE/EXPIRED), CustomerTier (GOLD/SILVER/BRONZE), CustomerStatus (ACTIVE/INACTIVE/PENDING)
- Full database migration (`backend/prisma/migrations/20260723103135_init/migration.sql`)
- Auth module: JWT-based `register` + `login` mutations with bcryptjs (10 rounds), passport-jwt strategy
- Tickets module: `tickets` (all), `ticket(id)` queries; `createTicket(input)`, `updateTicketStatus(input)` mutations
- Products module: `products`, `product(id)` queries; `createProduct(input)` mutation
- Customers module: `customers`, `customer(id)` queries (no mutations)
- Users module: `users` query
- 8 GraphQL object types (`@ObjectType()`) in `common/models/`: User, Customer, Product, ProductCustomerConnection, Ticket, TicketMessage, Activity, Notification
- 4 GraphQL input types (`@InputType()`) in `common/dto/`: CreateTicketInput, UpdateTicketStatusInput, CreateProductInput, CreateCustomerInput
- Seed script (`prisma/seed.ts`): 6 users (1 admin, 4 agents, 1 customer), 1 customer profile, 4 products, 5 tickets, 4 activities, 3 notifications
- CORS configured for `localhost:3000` and `localhost:5173`

#### Infrastructure
- `docker-compose.yml` with PostgreSQL 16 Alpine + Redis 7 Alpine
- `.env.example` with `GEMINI_API_KEY` and `APP_URL` placeholders

#### Documentation
- `docs/sprint-1-complete.md` — Sprint 1 accomplishments
- `docs/sprint-2-backend.md` — Sprint 2 accomplishments + auth flow + test credentials
- `docs/sprint-3-integration.md` — Sprint 3 accomplishments + full-stack run guide
- Full documentation system: `docs/` (14 files) + `.ai/` (7 files)

### Changed

#### Breaking
- None. All changes are additive or behind the same interfaces.

#### Non-Breaking
- `CustomerPortalView` now requires `customersList` prop (added by `App.tsx`)
- `AgentPortal` create ticket form is now controlled (`newTicketFields` state added)
- `DashboardPortal` customer ticket input changed from `<input type="text">` to `<select>`
- 90 packages removed from `package.json` (Sprint 1)
- Portal views moved to `components/portals/` with backward-compatible re-exports (Sprint 1)

### Fixed

- None in this sprint.

### Known Issues

| Issue | Location | Notes |
|-------|----------|-------|
| `mapConnection` sets `productId: c.customerId` | `src/api/transform.ts:79` | Should be `c.productId` |
| No RBAC guards on any backend endpoint | All resolvers | Anyone can call any GQL |
| No input validation on GraphQL mutations | `common/dto/*.ts` | class-validator decorators absent but package installed |
| `DashboardPortal.tsx` is 4,611 lines | `src/components/portals/DashboardPortal.tsx` | Needs decomposition |
| `AuthPayload` defined inline in resolver | `backend/src/auth/auth.resolver.ts` | Inconsistent with model convention |

---

## [1.0.0] — Sprint 2 Complete (2026-07-xx)

### Added
- Backend NestJS 11 foundation with Apollo GraphQL (code-first)
- Prisma 7 ORM with PostgreSQL 16
- 8 database models + 6 enums + full migration
- Auth module with JWT (register + login)
- Core CRUD modules: tickets, products, customers, users
- Seed script with demo data (6 users, 1 customer, 4 products, 5 tickets, 4 activities, 3 notifications)
- Docker Compose: PostgreSQL 16 + Redis 7

---

## [1.0.0] — Sprint 1 Complete (2026-07-xx)

### Added
- Frontend React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS 4 project
- TypeScript strict mode enabled
- RTL support (`lang="fa" dir="rtl"`, Vazirmatn font)
- Shared types: `Ticket`, `Product`, `Customer`, `ActivityItem`, `NotificationItem`, `Priority`, `TicketStatus`, `ProductCustomerConnection`
- Utility functions: `cn()`, `formatDate()`, `formatTimeAgo()`, `generateId()`
- Shared UI primitives: `Button` (5 variants, 3 sizes, loading), `Badge` (5 variants), `Card`/`CardHeader`/`CardTitle`, `Skeleton`/`SkeletonRow`, `Toast` (animated success/error)
- `ErrorBoundary` component with retry button
- `useTheme` hook (dark/light toggle, localStorage persistence)
- `useLocalStorage` hook
- Portal views: `DashboardPortal` (admin), `AgentPortal` (agent), `CustomerPortal` (customer), `TicketInbox`, `TicketDetailsWorkspace`, `CustomerWorkspace`, `UserManagement`, `NotificationCenter`
- Backward-compatible re-exports from original file locations
- 3 sprint documentation files
