import { SaleEntity } from '../../../sales';
import { CashRegisterStatus } from '../../enums';
import { toNumber } from '../number.util';

export function serializeSale(
  sale: SaleEntity,
  currentCashSessionId?: string | null,
) {
  const canCancel =
    !sale.canceledAt &&
    Boolean(
      sale.cashSessionId &&
      currentCashSessionId &&
      sale.cashSessionId === currentCashSessionId &&
      sale.cashSession?.status === CashRegisterStatus.OPEN,
    );

  return {
    id: sale.id,
    folio: sale.folio,
    total: toNumber(sale.total),
    paymentTotal: toNumber(sale.paymentTotal ?? sale.total),
    itemCount: toNumber(sale.itemCount),
    paymentMethod: sale.paymentMethod,
    cashReceived:
      sale.cashReceived == null ? null : toNumber(sale.cashReceived),
    changeDue: sale.changeDue == null ? null : toNumber(sale.changeDue),
    canceledAt: sale.canceledAt?.toISOString() ?? null,
    cancelReason: sale.cancelReason,
    canceledBy: sale.canceledBy ?? null,
    creditPaidAt: sale.creditPaidAt?.toISOString() ?? null,
    creditPaidBy: sale.creditPaidBy ?? null,
    creditPaymentMethod: sale.creditPaymentMethod ?? null,
    creditCustomerName: sale.creditCustomerName,
    creditNote: sale.creditNote,
    canCancel,
    createdAt: sale.createdAt.toISOString(),
    seller: sale.seller,
    cashSession: sale.cashSession
      ? {
          id: sale.cashSession.id,
          openedAt: sale.cashSession.openedAt.toISOString(),
          status: sale.cashSession.status,
        }
      : null,
    items: (sale.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      description: item.description,
      unit: item.unit,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      lineTotal: toNumber(item.lineTotal),
      canceledAt: item.canceledAt?.toISOString() ?? null,
      cancelReason: item.cancelReason,
    })),
  };
}
