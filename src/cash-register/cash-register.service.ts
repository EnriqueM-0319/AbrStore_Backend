import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { AppError } from '../common/app-error';
import { GraphqlContext } from '../common/interfaces';
import { money, serializeCashRegisterSession, toNumber } from '../common/utils';
import { operationalRoles } from '../common/utils';
import { CashMovementEntity } from '../cash-movements';
import { CashMovementType, CashRegisterStatus } from '../common/enums';
import { CashRegisterSessionEntity } from './cash-register-session.entity';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegisterSessionEntity)
    private readonly sessions: Repository<CashRegisterSessionEntity>,
    @InjectRepository(CashMovementEntity)
    private readonly movements: Repository<CashMovementEntity>,
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
    const cashIn = await sum(CashMovementType.CASH_IN);
    const adjustment = await sum(CashMovementType.ADJUSTMENT);
    const supplierPayment = await sum(CashMovementType.SUPPLIER_PAYMENT);
    const withdrawal = await sum(CashMovementType.WITHDRAWAL);
    const expense = await sum(CashMovementType.EXPENSE);
    const cashOutTotal =
      toNumber(supplierPayment) + toNumber(withdrawal) + toNumber(expense);
    const expectedAmount =
      toNumber(session.openingAmount) +
      toNumber(cashIn) +
      toNumber(adjustment) -
      cashOutTotal;
    return {
      openingAmount: toNumber(session.openingAmount),
      cashSalesTotal: 0,
      cashSalesCount: 0,
      cardSalesTotal: 0,
      transferSalesTotal: 0,
      creditSalesTotal: 0,
      nonCashSalesTotal: 0,
      cashInTotal: toNumber(cashIn),
      adjustmentTotal: toNumber(adjustment),
      supplierPaymentTotal: toNumber(supplierPayment),
      withdrawalTotal: toNumber(withdrawal),
      expenseTotal: toNumber(expense),
      cashOutTotal,
      expectedAmount,
    };
  }
}
