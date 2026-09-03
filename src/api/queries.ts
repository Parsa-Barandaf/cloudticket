// ── Activities ──
export const GET_ACTIVITIES = `
  query Activities($limit: Float) {
    activities(limit: $limit) {
      id type title subtitle createdAt
    }
  }
`;

// ── Notifications ──
const NOTIFICATION_FIELDS = `id title description type priority read archived authorName authorAvatarBg detailedContent linkedType linkedId linkedName createdAt`;

export const GET_NOTIFICATIONS = `
  query Notifications($limit: Float, $includeArchived: Boolean) {
    notifications(limit: $limit, includeArchived: $includeArchived) {
      ${NOTIFICATION_FIELDS}
    }
  }
`;

export const CREATE_NOTIFICATION = `
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      ${NOTIFICATION_FIELDS}
    }
  }
`;

export const MARK_NOTIFICATION_READ = `
  mutation MarkNotificationRead($id: String!) {
    markNotificationRead(id: $id) {
      id title read
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = `
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const TOGGLE_NOTIFICATION_ARCHIVE = `
  mutation ToggleNotificationArchive($id: String!) {
    toggleNotificationArchive(id: $id) {
      id archived
    }
  }
`;

export const DELETE_NOTIFICATION = `
  mutation DeleteNotification($id: String!) {
    deleteNotification(id: $id)
  }
`;

export const DELETE_NOTIFICATIONS = `
  mutation DeleteNotifications($input: DeleteNotificationsInput!) {
    deleteNotifications(input: $input)
  }
`;

// ── Tasks ──
const TASK_COMMENT_FIELDS = `id taskId text type createdAt authorId author { id name email role }`;

const TASK_FIELDS = `id title description priority status dueDate completedAt sortOrder createdAt updatedAt createdById assigneeId createdBy { id name email role } assignee { id name email role } comments { ${TASK_COMMENT_FIELDS} }`;

export const GET_TASKS = `
  query Tasks($filter: TaskFilterInput) {
    tasks(filter: $filter) {
      ${TASK_FIELDS}
    }
  }
`;

export const GET_MY_TASKS = `
  query MyTasks($userId: String!) {
    myTasks(userId: $userId) {
      ${TASK_FIELDS}
    }
  }
`;

export const GET_TASK = `
  query Task($id: String!) {
    task(id: $id) {
      ${TASK_FIELDS}
    }
  }
`;

export const CREATE_TASK = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      ${TASK_FIELDS}
    }
  }
`;

export const UPDATE_TASK = `
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      ${TASK_FIELDS}
    }
  }
`;

export const UPDATE_TASK_STATUS = `
  mutation UpdateTaskStatus($input: UpdateTaskStatusInput!) {
    updateTaskStatus(input: $input) {
      id title status priority dueDate updatedAt
    }
  }
`;

export const DELETE_TASK = `
  mutation DeleteTask($id: String!) {
    deleteTask(id: $id)
  }
`;

export const REORDER_TASKS = `
  mutation ReorderTasks($input: ReorderTasksInput!) {
    reorderTasks(input: $input)
  }
`;

export const ADD_TASK_COMMENT = `
  mutation AddTaskComment($input: AddTaskCommentInput!) {
    addTaskComment(input: $input) {
      ${TASK_COMMENT_FIELDS}
    }
  }
`;

// ── Auth ──
export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!, $rememberMe: Boolean) {
    login(email: $email, password: $password, rememberMe: $rememberMe) {
      accessToken
      accessiblePortals
      permissions
      user { id email name role isCustomer customerId departmentId }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
      accessToken
      accessiblePortals
      permissions
      user { id email name role isCustomer customerId departmentId }
    }
  }
`;

export const GET_CURRENT_USER = `
  query Me {
    me {
      accessiblePortals
      permissions
      user { id email name role isCustomer customerId departmentId }
    }
  }
`;

export const UPDATE_TICKET_STATUS = `
  mutation UpdateTicketStatus($input: UpdateTicketStatusInput!) {
    updateTicketStatus(input: $input) {
      id title priority status date updatedAt
    }
  }
`;

export const UPDATE_TICKET = `
  mutation UpdateTicket($input: UpdateTicketInput!) {
    updateTicket(input: $input) {
      id title priority status date updatedAt assignedToId
    }
  }
`;

export const CREATE_TICKET_MESSAGE = `
  mutation CreateTicketMessage($input: CreateTicketMessageInput!) {
    createTicketMessage(input: $input) {
      id text senderName isInternal createdAt authorId authorType
    }
  }
`;

export const DELETE_TICKET = `
  mutation DeleteTicket($id: String!) {
    deleteTicket(id: $id)
  }
`;

export const DELETE_TICKETS = `
  mutation DeleteTickets($input: DeleteTicketsInput!) {
    deleteTickets(input: $input)
  }
`;

export const UPDATE_TICKET_MESSAGE = `
  mutation UpdateTicketMessage($id: String!, $text: String!) {
    updateTicketMessage(id: $id, text: $text) {
      id text senderName isInternal createdAt authorId authorType
    }
  }
`;

export const DELETE_TICKET_MESSAGE = `
  mutation DeleteTicketMessage($id: String!) {
    deleteTicketMessage(id: $id)
  }
`;

// ── Tickets ──
export const GET_TICKETS = `
  query Tickets {
    tickets {
      id ticketNumber title priority status date updatedAt
      customerId productId assignedToId
      customer { id commercialName industry user { id name } }
      product { id name }
      assignedTo { id name }
    }
  }
`;

export const GET_TICKET = `
  query Ticket($id: String!) {
    ticket(id: $id) {
      id ticketNumber title priority status date updatedAt
      customer { id commercialName industry user { id name email } }
      product { id name version }
      assignedTo { id name email }
      messages { id text senderName isInternal createdAt authorId authorType }
    }
  }
`;

export const CREATE_TICKET = `
  mutation CreateTicket($input: CreateTicketInput!) {
    createTicket(input: $input) {
      id ticketNumber title priority status date
    }
  }
`;

// ── Products ──
export const CREATE_PRODUCT = `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id name category description version status clientsCount
      logoColor logoInitials createdAt lastUpdated
      connections { id productId customerId customer { id commercialName } product { id name } licenseStatus startDate endDate }
    }
  }
`;

export const UPDATE_PRODUCT = `
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id name category description version status clientsCount
      logoColor logoInitials createdAt lastUpdated
      connections { id productId customerId customer { id commercialName } product { id name } licenseStatus startDate endDate }
    }
  }
`;

export const DELETE_PRODUCT = `
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id)
  }
`;

export const GET_PRODUCTS = `
  query Products {
    products {
      id name category description version status clientsCount
      logoColor logoInitials createdAt lastUpdated
      connections {
        id productId customerId customer { id commercialName } product { id name }
        licenseStatus startDate endDate
      }
    }
  }
`;

// ── Connections ──
export const CREATE_CONNECTION = `
  mutation CreateConnection($input: CreateConnectionInput!) {
    createConnection(input: $input) {
      id productId customerId startDate endDate licenseStatus
      userCount activationKey notes subscriptionType
      customer { id commercialName }
      product { id name version logoColor logoInitials }
    }
  }
`;

export const DELETE_CONNECTION = `
  mutation DeleteConnection($id: String!) {
    deleteConnection(id: $id)
  }
`;

export const UPDATE_CONNECTION = `
  mutation UpdateConnection($input: UpdateConnectionInput!) {
    updateConnection(input: $input) {
      id productId customerId startDate endDate licenseStatus
      userCount activationKey notes subscriptionType
      customer { id commercialName }
      product { id name version logoColor logoInitials }
    }
  }
`;

export const GET_CUSTOMER_CONNECTIONS = `
  query CustomerConnections($customerId: String!) {
    customerConnections(customerId: $customerId) {
      id productId customerId startDate endDate licenseStatus
      userCount activationKey notes subscriptionType
      customer { id commercialName }
      product { id name version logoColor logoInitials category }
    }
  }
`;

// ── Customers ──
export const CREATE_CUSTOMER = `
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      id commercialName industry phone website address tier status
      usersCount activeProductsCount partnershipStartDate lastActivity
      userId
      user { id email name }
      tickets { id title priority status }
      connections { id productId customerId product { id name } customer { id commercialName } licenseStatus startDate endDate }
    }
  }
`;

export const GET_CUSTOMERS = `
  query Customers {
    customers {
      id industry commercialName phone website address
      tier status usersCount activeProductsCount
      user { id email name }
      tickets { id title priority status }
      connections {
        id productId customerId
        product { id name version logoColor logoInitials }
        customer { id commercialName }
        startDate endDate licenseStatus
        userCount activationKey subscriptionType notes
      }
    }
  }
`;

export const UPDATE_CUSTOMER = `
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id commercialName industry phone website address tier status
      usersCount activeProductsCount partnershipStartDate lastActivity
      userId
      user { id email name }
      tickets { id title priority status }
      connections { id productId customerId product { id name } customer { id commercialName } licenseStatus startDate endDate }
    }
  }
`;

export const DELETE_CUSTOMER = `
  mutation DeleteCustomer($id: String!) {
    deleteCustomer(id: $id)
  }
`;

// ── Access Requests ──
export const REQUEST_ACCESS = `
  mutation RequestAccess($input: RequestAccessInput!) {
    requestAccess(input: $input) {
      id name companyName email phone status createdAt
    }
  }
`;

export const GET_PENDING_ACCESS_REQUESTS = `
  query PendingAccessRequests {
    pendingAccessRequests {
      id name companyName email phone industry status createdAt updatedAt
    }
  }
`;

export const APPROVE_ACCESS_REQUEST = `
  mutation ApproveAccessRequest($input: ApproveAccessRequestInput!) {
    approveAccessRequest(input: $input) {
      id status updatedAt
    }
  }
`;

export const REJECT_ACCESS_REQUEST = `
  mutation RejectAccessRequest($input: RejectAccessRequestInput!) {
    rejectAccessRequest(input: $input) {
      id status updatedAt
    }
  }
`;

// ── Users ──
const USER_FIELDS = `id email name role active phone company isCustomer customerId departmentId createdAt updatedAt userRoles { id name }`;

export const GET_USERS = `
  query Users {
    users { ${USER_FIELDS} }
  }
`;

export const GET_USERS_BY_COMPANY = `
  query UsersByCompany($company: String!) {
    usersByCompany(company: $company) { ${USER_FIELDS} }
  }
`;

export const CREATE_USER = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) { ${USER_FIELDS} }
  }
`;

export const UPDATE_USER = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) { ${USER_FIELDS} }
  }
`;

export const DELETE_USER = `
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id)
  }
`;

// ── Departments ──
export const GET_DEPARTMENTS = `
  query Departments {
    departments { id name lead icon color assignedProducts createdAt updatedAt }
  }
`;

export const CREATE_DEPARTMENT = `
  mutation CreateDepartment($input: CreateDepartmentInput!) {
    createDepartment(input: $input) {
      id name lead icon color assignedProducts createdAt updatedAt
    }
  }
`;

export const UPDATE_DEPARTMENT = `
  mutation UpdateDepartment($input: UpdateDepartmentInput!) {
    updateDepartment(input: $input) {
      id name lead icon color assignedProducts createdAt updatedAt
    }
  }
`;

export const DELETE_DEPARTMENT = `
  mutation DeleteDepartment($id: String!) {
    deleteDepartment(id: $id)
  }
`;

// ── New RBAC ──
const ROLE_FIELDS = `id name description isEditable isSystem scope orgId createdAt updatedAt _count { userRoles } rolePermissions { permissionId permission { id key module portalId } } portals { portalId portal { id key name } }`;

export const GET_ROLES = `
  query Roles {
    roles { ${ROLE_FIELDS} }
  }
`;

export const GET_ROLE = `
  query Role($id: String!) {
    role(id: $id) { ${ROLE_FIELDS} }
  }
`;

export const CREATE_ROLE = `
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) { ${ROLE_FIELDS} }
  }
`;

export const UPDATE_ROLE = `
  mutation UpdateRole($input: UpdateRoleInput!) {
    updateRole(input: $input) { ${ROLE_FIELDS} }
  }
`;

export const DELETE_ROLE = `
  mutation DeleteRole($id: String!, $reassignRoleId: String) {
    deleteRole(id: $id, reassignRoleId: $reassignRoleId)
  }
`;

export const GET_PORTALS = `
  query Portals {
    portals { id key name createdAt }
  }
`;

export const GET_PERMISSIONS = `
  query Permissions {
    permissions { id key module portalId createdAt }
  }
`;

export const GET_PERMISSIONS_BY_PORTAL = `
  query PermissionsByPortal($portalId: String!) {
    permissionsByPortal(portalId: $portalId) { id key module portalId createdAt }
  }
`;

export const GET_USER_ROLES = `
  query UserRoles($userId: String!) {
    userRoles(userId: $userId) { ${ROLE_FIELDS} }
  }
`;

export const GET_USER_EFFECTIVE_PERMISSIONS = `
  query UserEffectivePermissions($userId: String!) {
    userEffectivePermissions(userId: $userId) { accessiblePortals permissions { key module portalKey } }
  }
`;

export const ASSIGN_ROLE_TO_USER = `
  mutation AssignRoleToUser($input: AssignRoleInput!) {
    assignRoleToUser(input: $input) { ${ROLE_FIELDS} }
  }
`;

export const UNASSIGN_ROLE_FROM_USER = `
  mutation UnassignRoleFromUser($input: UnassignRoleInput!) {
    unassignRoleFromUser(input: $input) { ${ROLE_FIELDS} }
  }
`;
