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

// ── Users ──
export const GET_USERS = `
  query Users {
    users { id email name role active }
  }
`;
