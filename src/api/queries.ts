// ── Activities ──
export const GET_ACTIVITIES = `
  query Activities($limit: Float) {
    activities(limit: $limit) {
      id type title subtitle createdAt
    }
  }
`;

// ── Auth ──
export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user { id email name role customRoleId portalType }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
      accessToken
      user { id email name role customRoleId portalType }
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
export const GET_USERS = `
  query Users {
    users { id email name role active phone company isCustomer departmentId customRoleId createdAt updatedAt }
  }
`;

export const GET_USERS_BY_COMPANY = `
  query UsersByCompany($company: String!) {
    usersByCompany(company: $company) { id email name role active phone company isCustomer departmentId customRoleId createdAt updatedAt }
  }
`;

export const CREATE_USER = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id email name role active phone company isCustomer departmentId customRoleId createdAt updatedAt
    }
  }
`;

export const UPDATE_USER = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id email name role active phone company isCustomer departmentId customRoleId createdAt updatedAt
    }
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

// ── Custom Roles ──
export const GET_CUSTOM_ROLES = `
  query CustomRoles {
    customRoles { id name description permissions createdAt updatedAt }
  }
`;

export const CREATE_CUSTOM_ROLE = `
  mutation CreateCustomRole($input: CreateCustomRoleInput!) {
    createCustomRole(input: $input) {
      id name description portalType permissions createdAt updatedAt
    }
  }
`;

export const UPDATE_CUSTOM_ROLE = `
  mutation UpdateCustomRole($input: UpdateCustomRoleInput!) {
    updateCustomRole(input: $input) {
      id name description portalType permissions createdAt updatedAt
    }
  }
`;

export const DELETE_CUSTOM_ROLE = `
  mutation DeleteCustomRole($input: DeleteCustomRoleInput!) {
    deleteCustomRole(input: $input)
  }
`;
