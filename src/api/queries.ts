// ── Auth ──
export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user { id email name role }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
      accessToken
      user { id email name role }
    }
  }
`;

export const UPDATE_TICKET_STATUS = `
  mutation UpdateTicketStatus($input: UpdateTicketStatusInput!) {
    updateTicketStatus(input: $input) {
      id title priority status date
    }
  }
`;

// ── Tickets ──
export const GET_TICKETS = `
  query Tickets {
    tickets {
      id title priority status date
      customerId productId assignedToId
      customer { id commercialName industry }
      product { id name }
      assignedTo { id name }
    }
  }
`;

export const GET_TICKET = `
  query Ticket($id: String!) {
    ticket(id: $id) {
      id title priority status date
      customer { id commercialName industry }
      product { id name version }
      assignedTo { id name email }
      messages { id text senderName isInternal createdAt }
    }
  }
`;

export const CREATE_TICKET = `
  mutation CreateTicket($input: CreateTicketInput!) {
    createTicket(input: $input) {
      id title priority status date
    }
  }
`;

// ── Products ──
export const GET_PRODUCTS = `
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
      connections { id customer { id commercialName } licenseStatus startDate endDate }
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
      connections { id customer { id commercialName } licenseStatus startDate endDate }
    }
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
    users { id email name role active }
  }
`;
