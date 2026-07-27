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

### `createCustomer` (Mutation)

```graphql
mutation CreateCustomer($input: CreateCustomerInput!) {
  createCustomer(input: $input) {
    id commercialName industry phone website address tier status
    usersCount activeProductsCount partnershipStartDate lastActivity
    userId
    user { id email name }
    tickets { id title priority status }
    connections { id customer { id commercialName } licenseStatus startDate endDate }
  }
}
```

**Input**: `CreateCustomerInput`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `industry` | `String!` | ✅ | Customer's industry |
| `commercialName` | `String` | ❌ | Company name |
| `phone` | `String` | ❌ | Contact phone |
| `website` | `String` | ❌ | Company website |
| `address` | `String` | ❌ | Physical address |
| `tier` | `CustomerTier` | ❌ | Defaults to `BRONZE` |
| `status` | `CustomerStatus` | ❌ | Defaults to `ACTIVE` |
| `userId` | `String!` | ✅ | FK to existing User |

**Returns**: Full `Customer` object with user, tickets, and connections.

## Users

### `users` (Query)

```graphql
query Users {
  users { id email name role active phone company departmentId customRoleId createdAt updatedAt }
}
```

Returns all users ordered by `createdAt DESC`. Includes `departmentId` and `customRoleId` for relationship wiring.

### `user(id)` (Query)

```graphql
query User($id: String!) {
  user(id: $id) { id email name role active phone company departmentId customRoleId createdAt updatedAt }
}
```

Returns a single user by ID, or `null` if not found.

### `createUser` (Mutation)

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id email name role active phone company departmentId customRoleId createdAt updatedAt }
}
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | `String!` | ✅ | Must be unique |
| `password` | `String!` | ✅ | Plain text, hashed server-side |
| `name` | `String!` | ✅ | Display name |
| `phone` | `String` | ❌ | Contact phone |
| `company` | `String` | ❌ | Company name (for customer-type users) |
| `departmentId` | `String` | ❌ | FK to Department |
| `customRoleId` | `String` | ❌ | FK to CustomRole |
| `active` | `Boolean` | ❌ | Defaults to `true` |

### `updateUser` (Mutation)

```graphql
mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) { id email name role active phone company departmentId customRoleId createdAt updatedAt }
}
```

**Input**: Same fields as `CreateUserInput` plus `id` (required). All fields optional except `id`. Pass `null` for `departmentId`/`customRoleId` to disconnect.

### `deleteUser` (Mutation)

```graphql
mutation DeleteUser($id: String!) {
  deleteUser(id: $id)
}
```

Returns `true` on success. Throws `BadRequestException` with Persian error if user has a linked `Customer` profile: «این کاربر به یک شرکت (مشتری) متصل است. ابتدا مشتری مربوطه را حذف کنید.»

## Departments

### `departments` (Query)

```graphql
query Departments {
  departments { id name lead assignedProducts createdAt updatedAt }
}
```

### `department(id)` (Query)

```graphql
query Department($id: String!) {
  department(id: $id) { id name lead assignedProducts createdAt updatedAt }
}
```

### `createDepartment` (Mutation)

```graphql
mutation CreateDepartment($input: CreateDepartmentInput!) {
  createDepartment(input: $input) { id name lead assignedProducts createdAt updatedAt }
}
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `String!` | ✅ | Department name |
| `lead` | `String!` | ✅ | Department lead name |
| `assignedProducts` | `[String!]` | ❌ | Defaults to `[]` |

### `updateDepartment` (Mutation)

```graphql
mutation UpdateDepartment($input: UpdateDepartmentInput!) {
  updateDepartment(input: $input) { id name lead assignedProducts createdAt updatedAt }
}
```

**Input**: Same as create + `id` (required). All fields optional.

### `deleteDepartment` (Mutation)

```graphql
mutation DeleteDepartment($id: String!) {
  deleteDepartment(id: $id)
}
```

Returns `true`. Before deleting, clears `departmentId` on all users assigned to this department.

## Custom Roles

### `customRoles` (Query)

```graphql
query CustomRoles {
  customRoles { id name description permissions createdAt updatedAt }
}
```

### `customRole(id)` (Query)

```graphql
query CustomRole($id: String!) {
  customRole(id: $id) { id name description permissions createdAt updatedAt }
}
```

### `createCustomRole` (Mutation)

```graphql
mutation CreateCustomRole($input: CreateCustomRoleInput!) {
  createCustomRole(input: $input) { id name description permissions createdAt updatedAt }
}
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `String!` | ✅ | Role name |
| `description` | `String` | ❌ | Optional description |
| `permissions` | `String` | ❌ | JSON string, defaults to `"{}"` |

### `updateCustomRole` (Mutation)

```graphql
mutation UpdateCustomRole($input: UpdateCustomRoleInput!) {
  updateCustomRole(input: $input) { id name description permissions createdAt updatedAt }
}
```

**Input**: Same as create + `id` (required). All fields optional.

### `deleteCustomRole` (Mutation)

```graphql
mutation DeleteCustomRole($input: DeleteCustomRoleInput!) {
  deleteCustomRole(input: $input)
}
```

**Input**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `String!` | ✅ | Role to delete |
| `reassignRoleId` | `String` | ❌ | If provided, users with this role are reassigned; otherwise `customRoleId` is cleared |

Returns `true`. Throws `BadRequestException` if role not found or if `reassignRoleId` references a non-existent role.

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
| `User` | id, email, name, role, avatar?, active, phone?, company?, departmentId?, customRoleId?, createdAt, updatedAt |
| `Department` | id, name, lead, assignedProducts[], createdAt, updatedAt |
| `CustomRole` | id, name, description?, permissions, createdAt, updatedAt |
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
| `createTicketMessage` | ❌ (no input) | ❌ | ❌ |
| `updateTicket` (general) | ❌ | ❌ | ❌ |
| Department, CustomRole, User CRUD | ✅ | ✅ | ✅ |

## Frontend API Layer

Files in `src/api/`:

| File | Purpose |
|------|---------|
| `graphql.ts` | Generic GQL fetch with JWT Bearer injection |
| `queries.ts` | All query/mutation strings (17 queries & mutations: tickets, products, customers, connections, access requests, users, departments, custom roles) |
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
| `useUsers()` | `GET_USERS`, `CREATE_USER`, `UPDATE_USER`, `DELETE_USER` | `{ users, loading, error, createUser, updateUser, deleteUser }` |
| `useDepartments()` | `GET_DEPARTMENTS`, `CREATE_DEPARTMENT`, `UPDATE_DEPARTMENT`, `DELETE_DEPARTMENT` | `{ departments, loading, error, createDepartment, updateDepartment, deleteDepartment }` |
| `useCustomRoles()` | `GET_CUSTOM_ROLES`, `CREATE_CUSTOM_ROLE`, `UPDATE_CUSTOM_ROLE`, `DELETE_CUSTOM_ROLE` | `{ customRoles, loading, error, createCustomRole, updateCustomRole, deleteCustomRole }` |
