export type RealtimeMessage = {
  event_type: string;
  organization_id: string;
  aggregate_type?: string | null;
  aggregate_id?: string | null;
  payload?: Record<string, unknown>;
};

export function resourcesForEvent(eventType: string): string[] {
  if (eventType.startsWith('order.')) return ['orders', 'invoices', 'dashboard'];
  if (eventType.startsWith('invoice.')) return ['invoices', 'dashboard'];
  if (eventType.startsWith('payment.')) return ['invoices', 'dashboard'];
  if (eventType.startsWith('delivery.')) return ['deliveries', 'dashboard'];
  return ['dashboard'];
}
