import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Raw, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { CashMovementEntity } from '../cash-movements';
import { CashRegisterSessionEntity } from '../cash-register';
import { AppError } from '../common/app-error';
import {
  CashMovementType,
  CashRegisterStatus,
  PaymentMethod,
} from '../common/enums';
import { GraphqlContext } from '../common/interfaces';
import {
  getPagination,
  money,
  operationalRoles,
  roundPayableTotal,
  serializeSale,
  shouldRoundPaymentMethod,
  toNumber,
} from '../common/utils';
import { SaleEntity } from '../sales';

@Injectable()
export class ReceivablesService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly sales: Repository<SaleEntity>,
    @InjectRepository(CashRegisterSessionEntity)
    private readonly sessions: Repository<CashRegisterSessionEntity>,
    @InjectRepository(CashMovementEntity)
    private readonly movements: Repository<CashMovementEntity>,
    private readonly authService: AuthService,
  ) {}

  async receivables(
    context: GraphqlContext,
    statusInput?: string,
    page?: number,
    limit?: number,
    search?: string,
  ) {
    await this.authService.requireRole(context, operationalRoles);
    const pagination = getPagination(page, limit);
    const open = await this.findOpenSession();
    const [items, total] = await this.sales.findAndCount({
      where: this.getReceivablesWhere(statusInput, search),
      relations: {
        seller: true,
        canceledBy: true,
        creditPaidBy: true,
        cashSession: true,
        items: true,
      },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return {
      items: items.map((sale) => serializeSale(sale, open?.id)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      pageCount: Math.max(Math.ceil(total / pagination.limit), 1),
    };
  }

  async payReceivable(
    context: GraphqlContext,
    id: string,
    paymentMethod: PaymentMethod = PaymentMethod.CASH,
    cashReceived?: number,
  ) {
    const user = await this.authService.requireRole(context, operationalRoles);
    const sale = await this.sales.findOne({
      where: { id, paymentMethod: PaymentMethod.CREDIT, canceledAt: IsNull() },
      relations: {
        seller: true,
        canceledBy: true,
        creditPaidBy: true,
        cashSession: true,
        items: true,
      },
    });

    if (!sale) throw new AppError('No encontramos esta cuenta por cobrar.');
    if (sale.creditPaidAt)
      throw new AppError('Esta cuenta ya fue marcada como pagada.');

    const paymentTotal = shouldRoundPaymentMethod(paymentMethod)
      ? roundPayableTotal(toNumber(sale.total))
      : toNumber(sale.total);
    const session = await this.findOpenSession();

    if (paymentMethod === PaymentMethod.CASH) {
      if (!session)
        throw new AppError('Abre caja antes de registrar un pago en efectivo.');
      if (!Number.isFinite(cashReceived) || Number(cashReceived) < paymentTotal)
        throw new AppError(
          'El efectivo recibido debe cubrir el total redondeado de la cuenta.',
        );
      await this.registerCashPayment(session, user, sale.folio, paymentTotal);
    }

    sale.creditPaidAt = new Date();
    sale.creditPaidById = user.id;
    sale.creditPaidBy = user;
    sale.creditPaymentMethod = paymentMethod;
    sale.paymentTotal = money(paymentTotal);
    return serializeSale(await this.sales.save(sale), session?.id);
  }

  private findOpenSession() {
    return this.sessions.findOne({
      where: { status: CashRegisterStatus.OPEN },
    });
  }

  private getReceivablesWhere(statusInput?: string, search?: string) {
    const trimmedSearch = search?.trim().slice(0, 80);

    return {
      paymentMethod: PaymentMethod.CREDIT,
      canceledAt: IsNull(),
      ...(trimmedSearch
        ? {
            creditCustomerName: Raw((alias) => `LOWER(${alias}) LIKE :search`, {
              search: `%${trimmedSearch.toLowerCase()}%`,
            }),
          }
        : {}),
      ...(statusInput === 'paid'
        ? { creditPaidAt: Not(IsNull()) }
        : statusInput === 'all'
          ? {}
          : { creditPaidAt: IsNull() }),
    };
  }

  private async registerCashPayment(
    session: CashRegisterSessionEntity,
    user: Awaited<ReturnType<AuthService['requireRole']>>,
    folio: number,
    paymentTotal: number,
  ) {
    await this.movements.save(
      this.movements.create({
        cashSessionId: session.id,
        cashSession: session,
        createdById: user.id,
        createdBy: user,
        type: CashMovementType.CASH_IN,
        amount: money(paymentTotal),
        description: `Pago de cuenta por cobrar · Ticket #${folio}`,
      }),
    );
  }
}
