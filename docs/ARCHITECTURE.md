# Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  App.tsx (Root)                                           │  │
│  │  ├── portalRole === 'admin'    → DashboardPortal (4611 ln) │  │
│  │  ├── portalRole === 'agent'    → AgentPortal (2248 ln)     │  │
│  │  └── portalRole === 'customer' → CustomerPortal (509 ln)   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                         │                                        │
│                    useHooks()                                     │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────────────────┐  │
│  │  src/api/                                                 │  │
│  │  ├── graphql.ts     — Generic GQL fetch + JWT injection   │  │
│  │  ├── queries.ts     — All GQL query/mutation strings      │  │
│  │  ├── transform.ts   — ApiTicket/ApiProduct → Ticket/etc.  │  │
│  │  ├── transform-agent.ts — Agent-specific transforms + SLA │  │
│  │  ├── transform-customer.ts — Customer-specific transforms │  │
│  │  ├── types.ts       — API response TypeScript interfaces  │  │
│  │  └── client.ts      — REST fetch wrapper (unused)         │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP POST /graphql
                               │ Authorization: Bearer <JWT>
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (NestJS 11)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  main.ts — CORS (3000,5173), port 4000                    │  │
│  │  app.module.ts — GraphQLModule + 5 feature modules        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────────────────┐  │
│  │  Resolvers (GraphQL) → Services (Business Logic)         │  │
│  │  ├── auth/        login, register                         │  │
│  │  ├── tickets/     tickets, ticket, createTicket,          │  │
│  │  │                updateTicketStatus                      │  │
│  │  ├── products/    products, product, createProduct        │  │
│  │  ├── customers/   customers, customer                     │  │
│  │  └── users/       users                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────────────────┐  │
│  │  common/                                                  │  │
│  │  ├── prisma.service.ts — PrismaClient lifecycle           │  │
│  │  ├── database.module.ts — Global DB module                │  │
│  │  ├── models/           — 8 @ObjectType() GraphQL models   │  │
│  │  └── dto/              — @InputType() DTOs                │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Prisma ORM
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL 16 (Docker)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  8 Tables: User, Customer, Product,                       │  │
│  │  ProductCustomerConnection, Ticket, TicketMessage,        │  │
│  │  Activity, Notification                                   │  │
│  │  6 Enums: UserRole, TicketPriority, TicketStatus,         │  │
│  │  ProductStatus, CustomerTier, CustomerStatus              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Redis 7 (Docker, unused)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
D:\Dev\CRM\
├── src/                         # Frontend source
│   ├── App.tsx                  # Root component + routing
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Tailwind v4 + Vazirmatn font
│   ├── types/index.ts           # Frontend domain types
│   ├── api/                     # API layer
│   ├── hooks/                   # React hooks
│   ├── components/
│   │   ├── portals/             # Portal views (8 components)
│   │   ├── ui/                  # Shared UI primitives (5 components)
│   │   ├── LoginForm.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── AbstractIllustration.tsx
│   └── lib/utils.ts             # Utility functions
├── backend/                     # NestJS backend
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── schema.gql           # Auto-generated
│   │   ├── auth/
│   │   ├── users/
│   │   ├── tickets/
│   │   ├── products/
│   │   ├── customers/
│   │   └── common/              # Shared (models, dto, prisma)
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.ts
│       └── migrations/
├── docker-compose.yml           # PostgreSQL + Redis
└── docs/                        # Documentation
```

## Data Flow

```
User Action
    │
    ▼
React Component (e.g., TicketInbox)
    │
    ▼
Custom Hook (e.g., useTickets)
    │
    ▼
gql() function (src/api/graphql.ts)
    │  ┌─ Injects Bearer token from localStorage
    │  └─ POST to http://localhost:4000/graphql
    ▼
NestJS GraphQL Resolver
    │
    ▼
Service → PrismaService → PostgreSQL
    │
    ▼
Response flows back through the same chain
    │
    ▼
API types mapped to frontend types via transform.ts
    │
    ▼
React state updated, UI re-renders
```

## Auth Flow

```
LoginForm
  → useAuth().login(email, password)
    → gql(LOGIN_MUTATION, { email, password })
      → Backend: auth.service (bcrypt.compare → JWT.sign)
    → Stores token in localStorage.sahab_access_token
  → Sets portalRole in localStorage.sahab_portal_role
  → App.tsx re-renders with matching portal component

All subsequent gql() calls:
  → Reads token from localStorage
  → Sets Authorization: Bearer <token> header
  → Backend JwtStrategy validates token
  → Request proceeds (no RBAC checks currently)
```

## Key Design Decisions

1. **Monorepo with co-located backend**: Backend lives in `backend/` directory intentionally. DO NOT move it.
2. **No React Router**: Portal switching via conditional rendering in App.tsx based on `portalRole` state.
3. **localStorage for auth state**: JWT, user email, portal role, and theme preference all persisted in localStorage.
4. **GraphQL code-first**: NestJS auto-generates `schema.gql` from decorators in model/DTO files.
5. **Persian-first**: All UI strings, status labels, and priorities are in Persian. API ↔ frontend transformation maps English enums to Persian.
