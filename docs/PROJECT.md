# پلتفرم مدیریت مشتریان

> Persian-language cloud support ticket management platform (میز خدمت)

## Overview

پلتفرم مدیریت مشتریان is a full-stack, multi-portal help desk and customer management system built for Persian-speaking enterprises. It provides three distinct role-based portals — **Admin (Dashboard)**, **Support Agent**, and **Customer** — each tailored to its user's workflow.

## Repository

| Property | Value |
|----------|-------|
| **Name** | `customer-management-platform` |
| **Version** | `1.0.0` |
| **Type** | Full-stack (monorepo with co-located backend) |
| **Language** | TypeScript (frontend + backend) |
| **Package Manager** | npm |

## Project Status

| Layer | Status |
|-------|--------|
| Frontend UI | ⚠️ Mostly complete, some mock data remaining |
| Frontend–Backend Integration | ⚠️ Partial (create ticket & status update wired) |
| Backend GraphQL API | ✅ Complete (core CRUD) |
| Database Schema | ✅ Complete (8 tables, 6 enums) |
| Authentication | ✅ Complete (JWT login/register) |
| Authorization (RBAC) | ❌ Not implemented |

## Quick Links

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, data flow, layers |
| [ROADMAP.md](./ROADMAP.md) | Development roadmap and future sprints |
| [TASKS.md](./TASKS.md) | Active and pending tasks |
| [API.md](./API.md) | GraphQL API reference |
| [DATABASE.md](./DATABASE.md) | Database schema and models |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [RULES.md](./RULES.md) | Project conventions and rules |
| [DECISIONS.md](./DECISIONS.md) | Architectural decisions and rationale |
| [SESSION.md](./SESSION.md) | Current development session log |
| [DEPENDENCIES.md](./DEPENDENCIES.md) | Dependency tree |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment instructions |
| [TESTING.md](./TESTING.md) | Testing strategy and coverage |
| [SECURITY.md](./SECURITY.md) | Security model and considerations |

## Portals

| Portal | Role | Component | Lines |
|--------|------|-----------|-------|
| **Admin Dashboard** | `admin` | `DashboardPortal.tsx` | 4,611 |
| **Agent Workspace** | `agent` | `AgentPortal.tsx` | 2,248 |
| **Customer Panel** | `customer` | `CustomerPortal.tsx` | 509 |
| **Login** | — | `LoginForm.tsx` | 539 |

## Tech Stack

- **Frontend**: React 19, Vite 6, TypeScript 5.8, Tailwind CSS 4, Motion, Lucide Icons
- **Backend**: NestJS 11, Apollo GraphQL (code-first), Prisma 7, PostgreSQL 16, Redis 7
- **Auth**: JWT (passport-jwt + bcryptjs)
- **Infrastructure**: Docker Compose

## Test Credentials (seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | 123456 |
| Agent | rezaei@example.com | 123456 |
| Customer | a.karimi@ariasecurity.ir | 123456 |
