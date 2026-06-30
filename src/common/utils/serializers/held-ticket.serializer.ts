import { HeldTicketEntity } from '../../../held-tickets';
import { toNumber } from '../number.util';
import { serializeProduct } from './product.serializer';

export function serializeHeldTicket(ticket: HeldTicketEntity) {
  return {
    id: ticket.id,
    note: ticket.note,
    itemCount: toNumber(ticket.itemCount),
    total: toNumber(ticket.total),
    paymentMethod: ticket.paymentMethod,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    createdBy: ticket.createdBy,
    items: (ticket.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      description: item.description,
      unit: item.unit,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      lineTotal: toNumber(item.lineTotal),
      product: item.product ? serializeProduct(item.product) : null,
    })),
  };
}
