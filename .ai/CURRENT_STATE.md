# Current Project State

> Single source of truth. Updated at end of every session. NEVER rely on conversation history — read this file first.
> NOTE: `AGENTS.md` at repo root is the primary handoff point and is always loaded by opencode. Keep this file in sync with it.

---

## Snapshot Meta

| Field | Value |
|-------|-------|
| **Last Updated** | 2026-08-01 |
| **Current Focus** | Support Portal (`AgentPortal.tsx`) |
| **Build Status** | ✅ frontend `npm run build`, backend `nest build` pass |
| **Branch** | `main` |

---

## What Changed Recently (committed)

| Commit | Summary |
|--------|---------|
| `ef653b4` | Users table pagination (5/10/20/50 + prev/next); dashboard recent tickets & activities scrollable with count selectors |
| `8e4ea42` | Customer portal option in role toggle; Customer Admin = protected system role; toast notifications on immutable-role actions |
| `88a1ee1` | Full RBAC (Portal/Permission/Role/RolePortal/RolePermission/UserRoleAssignment); removed legacy CustomRole entirely |

## Current Architecture (RBAC)

- Login → `roles.service.ts getUserEffectivePermissions(userId)` returns `accessiblePortals` (via `RolePortal`) + `permissions` (via `RolePermission`).
- Frontend `useAuth.ts resolvePortalRole()` decides portal: `main`→admin, `support`→agent, `customer`→customer.
- System roles (Super Admin, Customer Admin) cannot be edited/deleted/duplicated — backend enforces + frontend shows toasts.
- Customer users are created/edited with customer-scope roles (`roleId`).
- `User.userRoles { id name }` exposed so tables show real role names.

## DB Roles (seeded)

Super Admin (system, internal), Customer Admin (system, customer), Customer User (customer), Support Agent (internal). Portals: `main`, `support`, `customer`.

## Mock Data Remaining (backend gap)

- `createTicketMessage` mutation missing → support portal replies likely still mock.
- `updateTicket` (full) missing.
- `TicketMessage`, `Activity`, `Notification` have no query/mutation coverage beyond partial.
- `AgentPortal.tsx` still has local state where API should be used — this is the next work area.

## Startup

```powershell
docker compose up -d
# backend: cd backend && npm run start:dev   (port 4000)
# frontend: npm run dev                      (port 3000)
```
npm/npx must run via `cmd /c` (PowerShell blocks npm.ps1).

## Docs

- `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md`, `docs/SESSION.md`, `docs/TASKS.md`, `docs/ROADMAP.md`
- `.ai/AGENT.md`, `.ai/MEMORY.md`, `.ai/WORKFLOW.md`
