# Project Structure & Stack

> Snapshot for AI agents/developers. Business docs live in `docs/`; this file describes the code that actually exists.

## Overview

**CloudTicket** — customer support / CRM platform. Single-page React app (Persian, RTL) backed by a NestJS GraphQL API over PostgreSQL. The backend also serves the built frontend in production.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4 (`@tailwindcss/vite`), Motion, lucide-react, jalaali-js |
| Backend | NestJS 11, GraphQL + Apollo Server 5 (code-first), Passport JWT, bcryptjs |
| Database | PostgreSQL 16, Prisma ORM 5.22 |
| Tests | Vitest + Testing Library (frontend); Jest configured but no backend tests |
| Infra | Docker, docker-compose |

## Repo layout

```
D:\Dev\CRM
├── src/                      # Frontend (Vite root)
│   ├── App.tsx               # Shell: login vs. one of 3 portals (admin/agent/customer)
│   ├── main.tsx
│   ├── types.ts, types/      # Domain types
│   ├── api/                  # GraphQL client, queries, transforms, localStorage helpers
│   ├── hooks/                # useAuth, useTickets, useTasks, useUsers, useRoles, ...
│   └── components/
│       ├── portals/          # Admin dashboard, agent portal, customer portal
│       ├── ui/               # Button, Card, Badge, Toast, Skeleton
│       └── *.tsx             # Screens (login, ticket inbox/details, user management, ...)
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── main.ts           # Bootstrap: CORS, static serving, SPA fallback, port 4000
│   │   ├── app.module.ts     # Root module + Apollo config (autoSchemaFile: src/schema.gql)
│   │   ├── auth/             # JWT login/register, strategy, guard
│   │   ├── users/            # Users + departments
│   │   ├── tickets/          # Tickets + messages
│   │   ├── tasks/            # Tasks + comments
│   │   ├── roles/            # Portals, permissions, roles, assignments
│   │   ├── customers/        # Customers
│   │   ├── products/         # Products + license connections
│   │   ├── notifications/
│   │   ├── activities/
│   │   ├── access-requests/
│   │   └── common/           # PrismaService, GraphQL models, DTO inputs
│   ├── prisma/               # schema.prisma, migrations, seed.ts, create-root.ts
│   └── test/                 # Jest e2e scaffold
├── docs/                     # Architecture/API/DB docs (partially stale — trust code)
├── scripts/, tools/          # Utility scripts
└── docker-compose.yml        # postgres:5433, redis:6379
```

## Backend API (GraphQL, `/graphql`)

Modules and their main operations:

- **auth** — `login(email, password, rememberMe)`, `register`, `me` (only guarded query)
- **users** — `users`, `user`, `usersByCompany`, `departments`, CRUD users/departments
- **tickets** — `tickets`, `ticket`, create/update, `updateTicketStatus`, message CRUD, bulk delete
- **tasks** — `tasks(filter)`, `myTasks`, CRUD, `updateTaskStatus`, `reorderTasks`, `markTaskSeen`, `addTaskComment`
- **roles** — `portals`, `permissions`, `roles`, `userRoles`, `userEffectivePermissions`, role CRUD/assign/unassign
- **customers** — `customers`, `customer`, CRUD; computed `activeProductsCount`, `usersCount`
- **products** — `products`, `product`, `customerConnections`, CRUD + connection CRUD
- **notifications** — list, create, mark read (global inbox), archive, delete
- **activities** — `activities(limit)` global feed
- **access-requests** — list, `requestAccess`, approve/reject

No subscriptions; the UI polls/refetches.

## Data model (Prisma)

`User` (legacy `role` enum + RBAC roles), `Customer`, `Product`, `ProductCustomerConnection`, `Ticket` / `TicketMessage` / `TicketAttachment`, `Task` / `TaskComment`, `Department`, `Notification`, `Activity`, `AccessRequest`, `Portal` → `Permission` → `Role` → `RolePermission` / `RolePortal` / `UserRoleAssignment`.

Key relationships: a `Customer` is owned by one `User` (`Customer.userId`); users may also point at a customer via `User.customerId`. Tickets belong to a customer, optionally a product and an assigned agent.

## Frontend architecture

- `App.tsx` picks the portal from `portalRole` (`admin | agent | customer`) stored in localStorage.
- `src/api/graphql.ts` posts to `VITE_API_URL || http://localhost:4000/graphql` with a Bearer token from localStorage.
- Hooks wrap queries/mutations and expose data + `refetch`; screens receive data as props.
- Styling is Tailwind utility classes; whole app is `dir="rtl"` with Persian copy and Jalali dates.

## Auth

1. `login` verifies bcrypt hash, issues JWT `{ sub, email }` (1d, or 30d with `rememberMe`).
2. Response includes `accessiblePortals` and flat permission keys derived from RBAC roles.
3. Frontend resolves the portal from `accessiblePortals` and stores the token in localStorage.
4. Env: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `PORT`, `CORS_ORIGIN`, `ROOT_*`.

Demo credentials: `admin@example.com` / `123456` (all seeded users share `123456`).

## Run locally

```powershell
# 1. database
docker compose up -d

# 2. backend (terminal 1)
cd backend
npm.cmd exec prisma migrate deploy
npm.cmd run seed
npm.cmd run start:dev        # http://localhost:4000/graphql

# 3. frontend (terminal 2)
npm.cmd run dev              # http://localhost:3000
```

On Windows PowerShell `npm.ps1` may be blocked — use `npm.cmd`.

## Notes for agents

- `docs/` is partly outdated; `backend/src/schema.gql` is regenerated at boot and may lag behind decorators.
- Only `me` uses `GqlAuthGuard`; most resolvers are currently unauthenticated, and identity fields (`authorId`, `createdById`, `userId`) are trusted from the client.
- Email lookup is case-insensitive (`UsersService.findByEmail`).
- Duplicated screen components exist in `src/components/` and `src/components/portals/` — check which one is imported by `App.tsx` before editing.
- `TicketAttachment`, `@prisma/adapter-pg`, `pg`, `class-validator` are present but unused.
