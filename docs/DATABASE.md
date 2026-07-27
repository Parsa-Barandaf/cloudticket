# Database Schema

> Powered by Prisma 7 ORM, PostgreSQL 16. Schema defined in `backend/prisma/schema.prisma` (214 lines). Migration at `backend/prisma/migrations/20260723103135_init/migration.sql` + `backend/prisma/migrations/20260726100856_add_department_customrole_user_fields/`.

## Entity Relationship Diagram

```
User (1) ──── (0..1) Customer (1) ──── (0..*) ProductCustomerConnection (0..*) ──── (1) Product
  │                       │
  │                       │
  │── (0..*) Department   │
  │── (0..*) CustomRole   │
  │                       │
  └── (0..*) Ticket ──────┘
               │
               └── (0..*) TicketMessage

Activity       (standalone, no FK)
Notification   (standalone, no FK)
AccessRequest  (standalone, no FK)
```

## Tables

### User

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `email` | `TEXT` | **UNIQUE**, NOT NULL | |
| `password` | `TEXT` | NOT NULL | bcrypt-hashed |
| `name` | `TEXT` | NOT NULL | |
| `role` | `UserRole` | NOT NULL, default `ADMIN` | Enum: ADMIN, AGENT, CUSTOMER |
| `avatar` | `TEXT?` | nullable | |
| `active` | `BOOLEAN` | NOT NULL, default `true` | |
| `phone` | `TEXT?` | nullable | Contact phone |
| `company` | `TEXT?` | nullable | Company name (for customer-type users) |
| `departmentId` | `TEXT?` | nullable, FK → Department.id | Support team assignment |
| `customRoleId` | `TEXT?` | nullable, FK → CustomRole.id | Custom RBAC role |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, auto-updated | |

**Relations**: `assignedTickets` → `Ticket[]` via `assignedToId` (named "AssignedAgent"), `customerProfile` → `Customer?`, `department` → `Department?`, `customRole` → `CustomRole?`

### Department (New)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `name` | `TEXT` | NOT NULL | Department name |
| `lead` | `TEXT` | NOT NULL | Department lead name |
| `assignedProducts` | `TEXT[]` | NOT NULL, default `[]` | Product IDs |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, auto-updated | |

**Relations**: `users` → `User[]`

### CustomRole (New)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `name` | `TEXT` | NOT NULL | Role name |
| `description` | `TEXT?` | nullable | |
| `permissions` | `JSON` | NOT NULL, default `{}` | JSON permission matrix |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, auto-updated | |

**Relations**: `users` → `User[]`

### Customer

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `commercialName` | `TEXT?` | nullable | Company name |
| `industry` | `TEXT` | NOT NULL | e.g. "امنیت سایبری" |
| `phone` | `TEXT?` | nullable | |
| `website` | `TEXT?` | nullable | |
| `address` | `TEXT?` | nullable | |
| `tier` | `CustomerTier` | NOT NULL, default `BRONZE` | Enum: GOLD, SILVER, BRONZE |
| `status` | `CustomerStatus` | NOT NULL, default `ACTIVE` | Enum: ACTIVE, INACTIVE, PENDING |
| `usersCount` | `INT` | NOT NULL, default `0` | |
| `activeProductsCount` | `INT` | NOT NULL, default `0` | |
| `partnershipStartDate` | `TIMESTAMP(3)?` | nullable | |
| `lastActivity` | `TIMESTAMP(3)?` | nullable | |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, auto-updated | |
| `userId` | `TEXT` | **UNIQUE**, NOT NULL, FK → User.id | Links to login account |

**Relations**: `user` → `User`, `tickets` → `Ticket[]`, `connections` → `ProductCustomerConnection[]`

### Product

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `name` | `TEXT` | NOT NULL | Product name |
| `category` | `TEXT` | NOT NULL | e.g. "امنیت ابری" |
| `description` | `TEXT?` | nullable | |
| `version` | `TEXT` | NOT NULL, default `v1.0.0` | |
| `status` | `ProductStatus` | NOT NULL, default `ACTIVE` | Enum: ACTIVE, INACTIVE, EXPIRED |
| `clientsCount` | `INT` | NOT NULL, default `0` | |
| `logoColor` | `TEXT?` | nullable | Tailwind gradient class |
| `logoInitials` | `TEXT?` | nullable | 2-char initials |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |
| `lastUpdated` | `TIMESTAMP(3)` | NOT NULL, auto-updated | |

**Relations**: `tickets` → `Ticket[]`, `connections` → `ProductCustomerConnection[]`

### ProductCustomerConnection

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `startDate` | `TIMESTAMP(3)` | NOT NULL | |
| `endDate` | `TIMESTAMP(3)` | NOT NULL | |
| `licenseStatus` | `TEXT` | NOT NULL, default `ACTIVE` | Free text (not enum) |
| `userCount` | `INT` | NOT NULL, default `0` | |
| `activationKey` | `TEXT` | NOT NULL | |
| `notes` | `TEXT?` | nullable | |
| `subscriptionType` | `TEXT` | NOT NULL | Free text |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |
| `productId` | `TEXT` | NOT NULL, FK → Product.id | |
| `customerId` | `TEXT` | NOT NULL, FK → Customer.id | |

### Ticket

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `title` | `TEXT` | NOT NULL | |
| `priority` | `TicketPriority` | NOT NULL, default `MEDIUM` | Enum: CRITICAL, HIGH, MEDIUM, LOW |
| `status` | `TicketStatus` | NOT NULL, default `OPEN` | Enum: OPEN, INVESTIGATING, AWAITING_CUSTOMER, RESOLVED, CLOSED |
| `date` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |
| `customerId` | `TEXT` | NOT NULL, FK → Customer.id | |
| `productId` | `TEXT?` | nullable, FK → Product.id | `ON DELETE SET NULL` |
| `assignedToId` | `TEXT?` | nullable, FK → User.id | `ON DELETE SET NULL` |

**Relations**: `customer` → `Customer`, `product` → `Product?`, `assignedTo` → `User?` (named "AssignedAgent"), `messages` → `TicketMessage[]`

### TicketMessage

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `text` | `TEXT` | NOT NULL | |
| `senderName` | `TEXT` | NOT NULL | |
| `isInternal` | `BOOLEAN` | NOT NULL, default `false` | Internal notes vs customer-visible |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |
| `ticketId` | `TEXT` | NOT NULL, FK → Ticket.id | |

**Relations**: `ticket` → `Ticket`

### Activity

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `type` | `TEXT` | NOT NULL | Free text |
| `title` | `TEXT` | NOT NULL | |
| `subtitle` | `TEXT` | NOT NULL | |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |

**No foreign keys** — standalone table.

### Notification

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `TEXT` | PK, default `cuid()` | |
| `title` | `TEXT` | NOT NULL | |
| `description` | `TEXT` | NOT NULL | |
| `type` | `TEXT` | NOT NULL | Free text |
| `read` | `BOOLEAN` | NOT NULL, default `false` | |
| `createdAt` | `TIMESTAMP(3)` | NOT NULL, default `now()` | |

**No foreign keys** — standalone table.

## Enums

| Enum Name | Values | Used By |
|-----------|--------|---------|
| `UserRole` | `ADMIN`, `AGENT`, `CUSTOMER` | User |
| `TicketPriority` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | Ticket |
| `TicketStatus` | `OPEN`, `INVESTIGATING`, `AWAITING_CUSTOMER`, `RESOLVED`, `CLOSED` | Ticket |
| `ProductStatus` | `ACTIVE`, `INACTIVE`, `EXPIRED` | Product |
| `CustomerTier` | `GOLD`, `SILVER`, `BRONZE` | Customer |
| `CustomerStatus` | `ACTIVE`, `INACTIVE`, `PENDING` | Customer |

## Frontend Type Mapping

API enums are mapped to Persian strings in `src/api/transform.ts`:

```typescript
// Priority
CRITICAL → 'بحرانی', HIGH → 'بالا', MEDIUM → 'متوسط', LOW → 'پایین'

// Status
OPEN → 'باز', INVESTIGATING → 'در حال بررسی',
AWAITING_CUSTOMER → 'منتظر پاسخ مشتری',
RESOLVED → 'بسته شده', CLOSED → 'بسته شده'

// Product Status
ACTIVE → 'فعال', INACTIVE → 'غیرفعال', EXPIRED → 'منقضی شده'
```

## Seed Data

File: `backend/prisma/seed.ts` — Populates with:

- **6 Users**: 1 admin, 4 agents, 1 customer (a.karimi@ariasecurity.ir)
- **1 Customer**: "توسعه امنیت آریا" (GOLD tier, امنیت سایبری industry)
- **4 Products**: Cloud Security Platform, Identity Protection Server, Elastic Compute Node, Global Edge CDN
- **5 Tickets**: Mixed priorities (CRITICAL×2, HIGH, MEDIUM, LOW) and statuses
- **4 Activities**: Ticket/reply/product/customer events
- **3 Notifications**: SLA, update, and alert types
