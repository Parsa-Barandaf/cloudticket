export class CreateTicketInput {
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  customerId: string;
  productId?: string;
  assignedToId?: string;
}

export class CreateProductInput {
  name: string;
  category: string;
  description?: string;
  version?: string;
}

export class CreateCustomerInput {
  industry: string;
  commercialName?: string;
  phone?: string;
  tier?: 'GOLD' | 'SILVER' | 'BRONZE';
  userId: string;
}
