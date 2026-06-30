import { CashRegisterSessionEntity } from '../../../cash-register';
import { toNumber } from '../number.util';

export function serializeCashRegisterSession(
  session: CashRegisterSessionEntity,
) {
  return {
    id: session.id,
    status: session.status,
    openingAmount: toNumber(session.openingAmount),
    closingAmount:
      session.closingAmount == null ? null : toNumber(session.closingAmount),
    expectedAmount:
      session.expectedAmount == null ? null : toNumber(session.expectedAmount),
    difference:
      session.difference == null ? null : toNumber(session.difference),
    notes: session.notes,
    openedAt: session.openedAt.toISOString(),
    closedAt: session.closedAt?.toISOString() ?? null,
    openedBy: session.openedBy,
    closedBy: session.closedBy,
  };
}
