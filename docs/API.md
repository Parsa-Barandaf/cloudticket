# GraphQL API Reference

> Auto-generated schema at `backend/src/schema.gql`. All endpoints are served from `http://localhost:4000/graphql`.

## Authentication

No authentication guards are currently enforced on any backend endpoint. Auth routes are open by design; all other routes are open due to missing RBAC implementation.

### `login`

```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    user {
      id
      email
      name
      role       # ADMIN | AGENT | CUSTOMER
    }
  }
}
```

### `register`

```graphql
mutation Register($email: String!, $password: String!, $name: String!) {
  register(email: $email, password: $password, name: $name) {
    accessToken
    user { id email name role }
  }
}
```

## Tickets

### `tickets` (Query)

```graphql
query Tickets {
  tickets {
    id title priority status date
    customerId productId assignedToId
    customer { id commercialName industry }
    product { id name }
    assignedTo { id name }
  }
}
```

Returns all tickets ordered by `date DESC`. No pagination or filtering supported.

### `ticket(id)` (Query)

```graphql
query Ticket($id: String!) {
  ticket(id: $id) {
    id title priority status date
    customer { id commercialName industry }
    product { id name version }
    assignedTo { id name email }
    messages { id text senderName isInternal createdAt }
  }
}
```

Returns `null` if ticket not found.

### `createTicket` (Mutation)

```graphql
mutation CreateTicket($input: CreateTicketInput!) {
  createTicket(input: $input) {
    id title priority status date
  }
}
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | `String!` | ✅ | Ticket subject |
| `priority` | `TicketPriority!` | ✅ | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `customerId` | `String!` | ✅ | Must reference existing customer |
| `productId` | `String` | ❌ | References existing product |
| `assignedToId` | `String` | ❌ | References existing user |

### `updateTicketStatus` (Mutation)

```graphql
mutation UpdateTicketStatus($input: UpdateTicketStatusInput!) {
  updateTicketStatus(input: $input) {
    id title priority status date
  }
}
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `String!` | ✅ | Ticket ID |
| `status` | `String!` | ✅ | Any string, mapped to `TicketStatus` enum server-side |

## Products

### `products` (Query)

```graphql
query Products {
  products {
    id name category description version status clientsCount
    logoColor logoInitials createdAt lastUpdated
    connections {
      id customer { id commercialName }
      licenseStatus startDate endDate
    }
  }
}
```

### `product(id)` (Query)

```graphql
query Product($id: String!) {
  product(id: $id) {
    id name category description version status clientsCount
    logoColor logoInitials createdAt lastUpdated
    connections {
      id customer { id commercialName }
      licenseStatus startDate endDate
    }
  }
}
```

### `createProduct` (Mutation)

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id name category status version
  }
}
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `String!` | ✅ | Product name |
| `category` | `String!` | ✅ | Product category |
| `description` | `String` | ❌ | Free text |
| `version` | `String` | ❌ | Defaults to `v1.0.0` |

## Customers

### `customers` (Query)

```graphql
query Customers {
  customers {
    id industry commercialName phone website address
    tier status usersCount activeProductsCount
    user { id email name }
    tickets { id title priority status }
  }
}
```

### `customer(id)` (Query)

```graphql
query Customer($id: String!) {
  customer(id: $id) {
    id commercialName industry tier status
    user { id email name }
    connections { id product { name } licenseStatus }
  }
}
```

**No `createCustomer` mutation exists yet.**

## Users

### `users` (Query)

```graphql
query Users {
  users { id email name role active }
}
```

## GraphQL Schema Types

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | `ADMIN`, `AGENT`, `CUSTOMER` |
| `TicketPriority` | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `TicketStatus` | `OPEN`, `INVESTIGATING`, `AWAITING_CUSTOMER`, `RESOLVED`, `CLOSED` |
| `ProductStatus` | `ACTIVE`, `INACTIVE`, `EXPIRED` |
| `CustomerTier` | `GOLD`, `SILVER`, `BRONZE` |
| `CustomerStatus` | `ACTIVE`, `INACTIVE`, `PENDING` |

### Object Types

| Type | Fields |
|------|--------|
| `User` | id, email, name, role, avatar?, active, createdAt, updatedAt |
| `Customer` | id, industry, commercialName?, phone?, website?, address?, tier, status, usersCount, activeProductsCount, partnershipStartDate?, lastActivity?, userId, user, tickets[], connections[] |
| `Product` | id, name, category, description?, version, status, clientsCount, logoColor?, logoInitials?, createdAt, lastUpdated, connections[] |
| `ProductCustomerConnection` | id, startDate, endDate, licenseStatus, userCount, activationKey, notes?, subscriptionType, customerId, customer |
| `Ticket` | id, title, priority, status, date, customerId, customer, productId?, product?, assignedToId?, assignedTo?, messages[] |
| `TicketMessage` | id, text, senderName, isInternal, createdAt |
| `Activity` | id, type, title, subtitle, createdAt |
| `Notification` | id, title, description, type, read, createdAt |
| `AuthPayload` | accessToken, user |

## Missing Mutations

The following queries or mutations are defined as DTOs or models but have NO resolver/service:

| Feature | DTO/Model Exists? | Resolver? | Service? |
|---------|-------------------|-----------|----------|
| `createCustomer` | ✅ (`customer.input.ts`) | ❌ | ❌ |
| `createTicketMessage` | ❌ (no input) | ❌ | ❌ |
| `updateTicket` (general) | ❌ | ❌ | ❌ |

## Frontend API Layer

Files in `src/api/`:

| File | Purpose |
|------|---------|
| `graphql.ts` | Generic GQL fetch with JWT Bearer injection |
| `queries.ts` | All query/mutation strings (login, register, tickets, products, customers, users) |
| `types.ts` | TypeScript interfaces matching GraphQL responses |
| `transform.ts` | Maps API types → frontend types (Persian enums, field renaming) |
| `transform-agent.ts` | Agent-specific transforms + SLA calculations |
| `transform-customer.ts` | Customer-specific transforms |
| `client.ts` | REST fetch wrapper (UNUSED — kept for future REST endpoints) |

### Frontend Hooks

| Hook | API Call | Returns |
|------|----------|---------|
| `useAuth().login(email, password)` | `LOGIN_MUTATION` | `{ email, role }` or `null` |
| `useTickets()` | `GET_TICKETS`, `CREATE_TICKET`, `UPDATE_TICKET_STATUS` | `{ tickets, loading, error, createTicket, updateTicketStatus }` |
| `useProducts()` | `GET_PRODUCTS` | `{ products, loading, error }` |
| `useCustomers()` | `GET_CUSTOMERS` | `{ customers, loading, error }` |
| `useUsers()` | `GET_USERS` | `{ users, loading, error }` |
