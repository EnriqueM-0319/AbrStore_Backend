import { CashMovementEntity } from '../../../cash-movements';
import { toNumber } from '../number.util';

export function serializeCashMovement(movement: CashMovementEntity) {
  return {
    id: movement.id,
    cashSessionId: movement.cashSessionId,
    type: movement.type,
    amount: toNumber(movement.amount),
    description: movement.description,
    createdAt: movement.createdAt.toISOString(),
    createdBy: movement.createdBy,
  };
}
