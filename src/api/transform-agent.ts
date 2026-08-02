import type { Ticket, Customer } from '../types';

export interface AgentTicketItem {
  id: string;
  ticketNumber: number;
  title: string;
  customer: string;
  customerTier: 'طلایی' | 'نقره‌ای' | 'برنزی';
  product: string;
  productId?: string;
  priority: 'بحرانی' | 'بالا' | 'متوسط' | 'پایین';
  status: 'جدید' | 'در حال بررسی' | 'منتظر پاسخ مشتری' | 'حل شده' | 'بسته شده';
  waitingTime: string;
  slaRemaining: string;
  slaRisk: boolean;
  assignedToMe: boolean;
  pinned: boolean;
  important: boolean;
  createdAt: string;
  messages: Array<{
    id: string;
    sender: 'customer' | 'agent' | 'system';
    senderName: string;
    avatar?: string;
    text: string;
    time: string;
    isInternalNote?: boolean;
    attachments?: Array<{ name: string; size: string }>;
  }>;
}

const ticketStatusToAgent: Record<string, 'جدید' | 'در حال بررسی' | 'منتظر پاسخ مشتری' | 'حل شده' | 'بسته شده'> = {
  'باز': 'جدید',
  'در حال بررسی': 'در حال بررسی',
  'منتظر پاسخ مشتری': 'منتظر پاسخ مشتری',
  'بسته شده': 'بسته شده',
};

const customerTierMap: Record<string, 'طلایی' | 'نقره‌ای' | 'برنزی'> = {
  'طلایی': 'طلایی',
  'نقره‌ای': 'نقره‌ای',
  'برنزی': 'برنزی',
};

const prioritySlaMap: Record<string, string> = {
  'بحرانی': '۰۰:۳۰:۰۰',
  'بالا': '۰۲:۰۰:۰۰',
  'متوسط': '۰۴:۰۰:۰۰',
  'پایین': '۰۸:۰۰:۰۰',
};

export function mapTicketToAgentItem(
  t: Ticket,
  customersList: Customer[],
  currentUserId: string,
): AgentTicketItem {
  const customerData = customersList.find(c => c.name === t.customer || c.commercialName === t.customer);
  const tier = customerTierMap[customerData?.tier || ''] || 'برنزی';

  return {
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    customer: t.customer,
    customerTier: tier,
    product: t.product,
    productId: t.productId,
    priority: t.priority,
    status: ticketStatusToAgent[t.status] || 'جدید',
    waitingTime: t.date,
    slaRemaining: prioritySlaMap[t.priority] || '۰۴:۰۰:۰۰',
    slaRisk: t.priority === 'بحرانی' || t.priority === 'بالا',
    assignedToMe: !!currentUserId && t.assignedToId === currentUserId,
    pinned: false,
    important: false,
    createdAt: t.date,
    messages: [],
  };
}

export function mergeAgentTicketData(
  tickets: Ticket[],
  customersList: Customer[],
  currentUserId: string,
  existingMockMessages: Record<string, AgentTicketItem['messages']>,
): AgentTicketItem[] {
  return tickets.map(t => {
    const agentItem = mapTicketToAgentItem(t, customersList, currentUserId);
    const mockMessages = existingMockMessages[t.id];
    if (mockMessages) {
      agentItem.messages = mockMessages;
    }
    return agentItem;
  });
}
