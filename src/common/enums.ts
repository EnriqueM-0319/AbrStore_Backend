import { registerEnumType } from '@nestjs/graphql';
import {
  CashMovementType,
  CashRegisterStatus,
  PaymentMethod,
  Role,
  StockExitReason,
  UnitType,
} from './enums/index';

export * from './enums/index';

registerEnumType(Role, { name: 'Role' });
registerEnumType(UnitType, { name: 'UnitType' });
registerEnumType(StockExitReason, { name: 'StockExitReason' });
registerEnumType(CashRegisterStatus, { name: 'CashRegisterStatus' });
registerEnumType(CashMovementType, { name: 'CashMovementType' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });

export {
  CashMovementType,
  CashRegisterStatus,
  PaymentMethod,
  Role,
  StockExitReason,
  UnitType,
};
