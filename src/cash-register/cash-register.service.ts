import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { AppError } from '../common/app-error';
import { GraphqlContext } from '../common/interfaces';
import { money, serializeCashRegisterSession, toNumber } from '../common/utils';
import { operationalRoles } from '../common/utils';
import { CashMovementEntity } from '../cash-movements';
import {
  CashMovementType,
  CashRegisterStatus,
  PaymentMethod,
} from '../common/enums';
import { SaleEntity } from '../sales';
import { CashRegisterSessionEntity } from './cash-register-session.entity';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegisterSessionEntity)
    private readonly sessions: Repository<CashRegisterSessionEntity>,
    @InjectRepository(CashMovementEntity)
    private readonly movements: Repository<CashMovementEntity>,
    @InjectRepository(SaleEntity)
    private readonly sales: Repository<SaleEntity>,
    private readonly authService: AuthService,
  ) {}

  async current(context: GraphqlContext) {
    await this.authService.requireRole(context, operationalRoles);
    const session = await this.findOpenSession();
    return session ? serializeCashRegisterSession(session) : null;
  }

  async summary(context: GraphqlContext) {
    await this.authService.requireRole(context, operationalRoles);
    const session = await this.findOpenSession();
    if (!session) return null;
    return this.getSummary(session);
  }

  async open(context: GraphqlContext, openingAmount: number, notes?: string) {
    const user = await this.authService.requireRole(context, operationalRoles);
    if (!Number.isFinite(openingAmount) || openingAmount < 0)
      throw new AppError('Ingresa una caja inicial válida.');
    if (await this.findOpenSession())
      throw new AppError('Ya existe una caja abierta.', HttpStatus.CONFLICT);

    const session = this.sessions.create({
      openingAmount: money(openingAmount),
      openedById: user.id,
      openedBy: user,
      notes: notes?.trim() || null,
    });
    return serializeCashRegisterSession(await this.sessions.save(session));
  }

  async close(context: GraphqlContext, closingAmount: number, notes?: string) {
    const user = await this.authService.requireRole(context, operationalRoles);
    const session = await this.findOpenSession();
    if (!session)
      throw new AppError(
        'No hay una caja abierta para cerrar.',
        HttpStatus.CONFLICT,
      );

    const summary = await this.getSummary(session);
    session.status = CashRegisterStatus.CLOSED;
    session.closingAmount = money(closingAmount);
    session.expectedAmount = money(summary.expectedAmount);
    session.difference = money(closingAmount - summary.expectedAmount);
    session.closedById = user.id;
    session.closedBy = user;
    session.closedAt = new Date();
    session.notes = notes?.trim() || null;

    return {
      session: serializeCashRegisterSession(await this.sessions.save(session)),
      summary,
    };
  }

  async findOpenSession() {
    return this.sessions.findOne({
      where: { status: CashRegisterStatus.OPEN },
      relations: { openedBy: true, closedBy: true },
      order: { openedAt: 'DESC' },
    });
  }

  async getSummary(session: CashRegisterSessionEntity) {
    const sum = (type: CashMovementType) =>
      this.movements
        .createQueryBuilder('movement')
        .select('COALESCE(SUM(movement.amount), 0)', 'total')
        .where('movement.cashSessionId = :cashSessionId', {
          cashSessionId: session.id,
        })
        .andWhere('movement.type = :type', { type })
        .getRawOne<{ total: string }>()
        .then((row) => Number(row?.total ?? 0));
    const [
      cashIn,
      adjustment,
      supplierPayment,
      withdrawal,
      expense,
      salesByPaymentMethod,
    ] = await Promise.all([
      sum(CashMovementType.CASH_IN),
      sum(CashMovementType.ADJUSTMENT),
      sum(CashMovementType.SUPPLIER_PAYMENT),
      sum(CashMovementType.WITHDRAWAL),
      sum(CashMovementType.EXPENSE),
      this.getSalesByPaymentMethod(session.id),
    ]);
    const cashSales = salesByPaymentMethod[PaymentMethod.CASH];
    const cardSales = salesByPaymentMethod[PaymentMethod.CARD];
    const transferSales = salesByPaymentMethod[PaymentMethod.TRANSFER];
    const creditSales = salesByPaymentMethod[PaymentMethod.CREDIT];
    const cashOutTotal =
      toNumber(supplierPayment) + toNumber(withdrawal) + toNumber(expense);
    const nonCashSalesTotal =
      toNumber(cardSales.total) +
      toNumber(transferSales.total) +
      toNumber(creditSales.total);
    const expectedAmount =
      toNumber(session.openingAmount) +
      toNumber(cashSales.total) +
      toNumber(cashIn) +
      toNumber(adjustment) -
      cashOutTotal;
    return {
      openingAmount: toNumber(session.openingAmount),
      cashSalesTotal: toNumber(cashSales.total),
      cashSalesCount: cashSales.count,
      cardSalesTotal: toNumber(cardSales.total),
      transferSalesTotal: toNumber(transferSales.total),
      creditSalesTotal: toNumber(creditSales.total),
      nonCashSalesTotal,
      cashInTotal: toNumber(cashIn),
      adjustmentTotal: toNumber(adjustment),
      supplierPaymentTotal: toNumber(supplierPayment),
      withdrawalTotal: toNumber(withdrawal),
      expenseTotal: toNumber(expense),
      cashOutTotal,
      expectedAmount,
    };
  }

  private async getSalesByPaymentMethod(cashSessionId: string) {
    const emptySummary = { total: 0, count: 0 };
    const summary: Record<PaymentMethod, { total: number; count: number }> = {
      [PaymentMethod.CASH]: { ...emptySummary },
      [PaymentMethod.CARD]: { ...emptySummary },
      [PaymentMethod.TRANSFER]: { ...emptySummary },
      [PaymentMethod.CREDIT]: { ...emptySummary },
    };
    const rows = await this.sales
      .createQueryBuilder('sale')
      .select('sale.paymentMethod', 'paymentMethod')
      .addSelect('COALESCE(SUM(COALESCE(sale.paymentTotal, sale.total)), 0)', 'total')
      .addSelect('COUNT(sale.id)', 'count')
      .where('sale.cashSessionId = :cashSessionId', { cashSessionId })
      .andWhere('sale.canceledAt IS NULL')
      .groupBy('sale.paymentMethod')
      .getRawMany<{ paymentMethod: PaymentMethod; total: string; count: string }>();

    for (const row of rows) {
      summary[row.paymentMethod] = {
        total: Number(row.total ?? 0),
        count: Number(row.count ?? 0),
      };
    }

    return summary;
  }
}
