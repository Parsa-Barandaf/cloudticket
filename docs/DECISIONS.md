# Architectural Decisions

> Significant decisions made during development, with rationale and consequences. Single source of truth — read this before making new architectural choices.

---

## ADR-001: Monorepo with Co-located Backend

**Status**: Accepted — Permanent

**Context**: The project is developed in Google AI Studio, which expects a single-root project. Backend and frontend need to coexist in the same repository.

**Decision**: Place the NestJS backend in `backend/` inside the frontend project root. Both share the same git repository but have separate `package.json` files, `node_modules`, and build configurations.

**Consequences**:
- ✅ Simple deployment for a single-app AI Studio project
- ✅ Shared git history
- ❌ Separate `package.json`, `node_modules`, and build configurations
- ❌ Must run two dev servers (Vite on port 3000, Nest on port 4000)
- ❌ Must manage two separate dependency trees

**Rule**: This structure is intentional. DO NOT move or rename the `backend/` directory. DO NOT merge into a single `package.json`.

**Files affected**:
- `package.json` (root — frontend)
- `backend/package.json` (backend)
- `backend/src/main.ts` (CORS configured for frontend ports)

---

## ADR-002: No React Router

**Status**: Accepted — May be revisited in Sprint 6

**Context**: The app has 3 portal views (admin, agent, customer) + 1 login view. Routing could be done via React Router or conditional rendering.

**Decision**: Use conditional rendering in `App.tsx` based on `portalRole` state stored in localStorage. No React Router dependency.

**Consequences**:
- ✅ Simple to understand and debug
- ✅ No extra dependencies
- ✅ Role state survives page refresh (localStorage)
- ❌ URL doesn't reflect current view (always `/`)
- ❌ No deep-linking capability (can't link to a specific portal or ticket)
- ❌ Browser back button doesn't navigate between portals

**Reconsider**: If deep-linking becomes a requirement, implement React Router with routes like `/admin`, `/agent`, `/customer`.

**Files affected**:
- `src/App.tsx` — `if (portalRole === 'customer')` / `else if (portalRole === 'agent')` / `else` pattern

---

## ADR-003: GraphQL Code-First (NestJS + Apollo)

**Status**: Accepted — Permanent

**Context**: Need an API layer that can evolve with the frontend schema without maintaining separate schema files.

**Decision**: Use NestJS GraphQL with code-first approach. Define models with `@ObjectType()` decorators and input types with `@InputType()` decorators. The schema is auto-generated to `src/schema.gql`.

**Consequences**:
- ✅ Single source of truth for types (TypeScript decorators)
- ✅ Auto-generated schema always in sync with code
- ✅ Works well with Prisma (model classes mirror Prisma models)
- ❌ Generated `schema.gql` should NEVER be hand-edited (overwritten on build)
- ❌ Requires careful decorator ordering for circular dependencies

**Files affected**:
- `backend/src/app.module.ts` — `GraphQLModule.forRoot({ autoSchemaFile: 'src/schema.gql' })`
- `backend/src/common/models/*.ts` — 8 `@ObjectType()` classes
- `backend/src/common/dto/*.ts` — 4 `@InputType()` classes

---

## ADR-004: Persian Localization via Transform Layer

**Status**: Accepted — Permanent

**Context**: The UI is entirely in Persian, but the database and API store English enums. Need a reliable translation layer.

**Decision**: Create `src/api/transform.ts` with mapping functions (`mapTicket`, `mapProduct`, `mapCustomer`, `mapConnection`) that convert English API enums to Persian strings at the API boundary. The reverse mapping (Persian → English) is done inline where mutations are called via local `const priorityToApi` / `const statusToApi` maps.

**Consequences**:
- ✅ Clean separation of API and UI concerns
- ✅ Easy to add new locales in the future (e.g., English UI)
- ✅ Frontend types use Persian strings naturally
- ❌ Reverse mapping (`priorityToApi`, `statusToApi`) is duplicated across 5+ files — consider centralizing
- ❌ Type mismatch risk if forward mapping is updated without updating reverse mapping

**Files affected**:
- `src/api/transform.ts` — Forward maps (API → Persian)
- `src/api/transform-agent.ts` — Additional agent-specific forwarding
- `src/components/portals/TicketInbox.tsx` — Inline `statusToApi`
- `src/components/portals/TicketDetailsWorkspace.tsx` — Inline `statusToApi`
- `src/components/portals/DashboardPortal.tsx` — Inline `priorityToApi`
- `src/components/portals/AgentPortal.tsx` — Inline `priorityToApi`
- `src/components/portals/CustomerPortal.tsx` — Inline `priorityToApi`

---

## ADR-005: localStorage for Auth State

**Status**: Accepted — Temporary (security concern noted)

**Context**: Need to persist authentication state across page reloads without a backend session store or refresh token mechanism.

**Decision**: Store JWT token (`sahab_access_token`), user email (`sahab_user_email`), portal role (`sahab_portal_role`), and theme preference (`sahab_theme`) in localStorage.

**Consequences**:
- ✅ Survives page reloads
- ✅ Simple to implement and debug
- ✅ No additional backend infrastructure needed
- ❌ **Vulnerable to XSS attacks**: Token accessible via `localStorage.getItem()`
- ❌ No token refresh mechanism — 7-day JWT expiry with no rotation
- ❌ No token revocation — valid until expiry

**Improvement plan**: Move to httpOnly cookies + refresh token pattern (Sprint 7).

**Files affected**:
- `src/hooks/useAuth.ts` — Stores `sahab_access_token`
- `src/api/graphql.ts` — Reads `sahab_access_token` for Bearer header
- `src/App.tsx` — Reads `sahab_user_email`, `sahab_portal_role`
- `src/hooks/useTheme.ts` — Stores `sahab_theme`

---

## ADR-006: No RBAC Guards (Temporary)

**Status**: Accepted — Plan to implement in Sprint 4

**Context**: Initial development priority was getting the API functional. Authorization was deferred for speed.

**Decision**: All GraphQL queries and mutations are publicly accessible. The `User.role` field exists in the database and is returned in login responses, but no resolver checks it.

**Consequences**:
- ✅ Faster initial development
- ❌ **Security risk**: Any user (or unauthenticated visitor) can call any endpoint
- ❌ No audit trail for which role performed which action
- ❌ No granular permission control per operation

**Improvement plan**: Implement `@Roles()` decorator + `RolesGuard` in Sprint 4. Suggested roles: ADMIN (full access), AGENT (tickets + customers), CUSTOMER (own tickets only).

**Files affected**:
- ALL backend resolvers — none have `@UseGuards()`
- `common/models/user.model.ts` — `UserRole` enum defined but unused in guards

---

## ADR-007: Activity and Notification as Standalone Tables

**Status**: Accepted — May be revisited

**Context**: Activities and notifications need to be stored but don't have a clear parent-child relationship with a single entity. A ticket creation generates an activity, but the activity doesn't belong exclusively to the ticket.

**Decision**: Create Activity and Notification as standalone tables with NO foreign keys. No cascading deletes. Manual cleanup required.

**Consequences**:
- ✅ Flexible data model — can reference any entity type by ID pattern
- ✅ Simple implementation
- ❌ No referential integrity — orphaned records possible
- ❌ Cannot cascade deletes — deleting a user/ticket leaves orphaned activities
- ❌ Manual cleanup queries required

**Alternative considered**: Polymorphic associations (type + ID columns) — rejected for complexity.

---

## ADR-008: `ApiTicket` / `Ticket` Dual Type System

**Status**: Accepted — Permanent

**Context**: API responses have a different shape (nested objects, English enums, server-generated IDs) than what the frontend UI needs (flattened fields, Persian strings, display-optimized).

**Decision**: Maintain two parallel TypeScript type hierarchies:
- **API types** in `src/api/types.ts` (`ApiUser`, `ApiCustomer`, `ApiTicket`, etc.) — exact match to GraphQL response shapes
- **Frontend types** in `src/types/index.ts` (`Ticket`, `Product`, `Customer`, etc.) — match UI component needs
- **Transform functions** in `src/api/transform.ts` bridge the gap

**Consequences**:
- ✅ Frontend types stay clean and UI-focused
- ✅ API changes don't directly affect UI code (only transform layer changes)
- ✅ Easy to add new fields without refactoring components
- ❌ Dual maintenance — must update both type files + transform on schema changes
- ❌ Occasional type drift if transforms aren't updated alongside API types

**Known bugs**:
- `mapConnection` at `src/api/transform.ts:79` sets `productId: c.customerId` instead of `c.productId`. Root cause: copy-paste error. Impacts customer portal product display. FILED as ROADMAP.md `S7` / TASKS.md `#16`.

**Files affected**:
- `src/api/types.ts` — 6 interfaces + 6 type aliases
- `src/types/index.ts` — 7 interfaces + 4 type aliases
- `src/api/transform.ts` — 4 mapper functions
- `src/api/transform-agent.ts` — Agent ticket item type + mapper
- `src/api/transform-customer.ts` — Customer ticket item type + mapper

---

## ADR-009: Uncontrolled → Controlled Form Migration for API Integration

**Status**: Accepted — Sprint 3

**Context**: The AgentPortal create ticket form was originally uncontrolled (no `value`/`onChange` bindings). To submit data to the API, the form needed to collect field values.

**Decision**: Convert uncontrolled forms to controlled components when they need to submit data to the API. Use a single state object for related fields (e.g., `newTicketFields`) rather than individual `useState` calls per field.

**Consequences**:
- ✅ Single state object makes reset/validation simpler
- ✅ Clear data flow: state → form → API
- ❌ More boilerplate than uncontrolled forms
- ❌ Re-renders on every keystroke (acceptable for sparse forms)

**Files affected**:
- `AgentPortal.tsx` — Added `newTicketFields` state, wired all form inputs

---

## ADR-010: Animation Library Choice (Motion)

**Status**: Accepted — Permanent

**Context**: Need animation library for modal transitions, menu animations, toast animations, and layout animations.

**Decision**: Use `motion` (formerly Framer Motion, now `motion/react` v12). Use `motion.div`, `AnimatePresence`, and `motion.button` for transitions.

**Consequences**:
- ✅ Rich animation API (layout animations, spring physics, gestures)
- ✅ `AnimatePresence` for exit animations
- ✅ Widely adopted, well-documented
- ❌ ~20KB bundle size impact
- ❌ Learning curve for advanced features

**Files affected**:
- All portal components — `AnimatePresence` for modals, `motion.div` for transitions

---

## ADR-011: Duplicate Inline Persian→English Maps (Technical Debt)

**Status**: Accepted — Acknowledged technical debt

**Context**: The reverse Persian→English enum mapping (`priorityToApi`, `statusToApi`) is defined inline in 5 different components. This violates DRY.

**Decision**: Accept duplication for now. Centralizing into `transform.ts` or a shared constants file would require refactoring all 5 components. Defer to a maintenance sprint (Sprint 5 or 6).

**Consequences**:
- ❌ 5 copies of essentially the same map
- ❌ Adding a new priority/status requires updating 5 locations
- ❌ Risk of inconsistency between components

**Improvement plan**: Create `src/api/constants.ts` with exported `PRIORITY_TO_API`, `STATUS_TO_API` maps. Import in all 5 components.

**Files affected**:
- `DashboardPortal.tsx` — `priorityToApi`
- `CustomerPortal.tsx` — `priorityToApi`
- `AgentPortal.tsx` — `priorityToApi`
- `TicketInbox.tsx` — `statusToApi`
- `TicketDetailsWorkspace.tsx` — `statusToApi`

---

## ADR-012: CORS Configuration for Development

**Status**: Accepted — Update for production

**Context**: Frontend dev server runs on port 3000 (Vite default). Backend runs on port 4000. Need CORS to allow cross-origin requests.

**Decision**: Configure NestJS CORS to allow `localhost:3000` and `localhost:5173` (Vite fallback). No wildcard. No production origins configured yet.

**Consequences**:
- ✅ Allows development workflow
- ❌ No production CORS policy configured
- ❌ No HTTPS requirements enforced

**Files affected**:
- `backend/src/main.ts` — `app.enableCors({ origin: ['http://localhost:3000', 'http://localhost:5173'] })`
