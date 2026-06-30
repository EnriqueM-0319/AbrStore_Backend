import { StockExitEntity } from '../../../stock-exits';
import { toNumber } from '../number.util';

export function serializeStockExit(stockExit: StockExitEntity) {
  return {
    id: stockExit.id,
    productId: stockExit.productId,
    sku: stockExit.sku,
    name: stockExit.name,
    description: stockExit.description,
    unit: stockExit.unit,
    quantity: toNumber(stockExit.quantity),
    reason: stockExit.reason,
    note: stockExit.note,
    createdAt: stockExit.createdAt.toISOString(),
    user: stockExit.user,
  };
}
