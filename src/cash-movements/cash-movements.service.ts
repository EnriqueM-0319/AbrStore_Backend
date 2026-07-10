import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { AppError } from '../common/app-error';
import { GraphqlContext } from '../common/interfaces';
import { getPagination } from '../common/utils';
import { money, serializeCashMovement } from '../common/utils';
import { operationalRoles } from '../common/utils';
import { CashMovementEntity } from './cash-movement.entity';
import { CashRegisterSessionEntity } from '../cash-register';
import { CashRegisterStatus } from '../common/enums';
import {
  CreateCashMovementInput,
  UpdateCashMovementInput,
} from './cash-movements.inputs';

const receivablePaymentDescriptionPrefix = 'Pago de cuenta por cobrar';

@Injectable()
export class CashMovementsService {
  constructor(
    @InjectRepository(CashMovementEntity)
    private readonly movements: Repository<CashMovementEntity>,
    @InjectRepository(CashRegisterSessionEntity)
    private readonly sessions: Repository<CashRegisterSessionEntity>,
    private readonly authService: AuthService,
  ) {}

  async cashMovements(
    context: GraphqlContext,
    currentOnly = true,
    page?: number,
    limit?: number,
  ) {
    await this.authService.requireRole(context, operationalRoles);
    const pagination = getPagination(page, limit);
    const openSession = currentOnly
      ? await this.sessions.findOne({
          where: { status: CashRegisterStatus.OPEN },
        })
      : null;

    if (currentOnly && !openSession) {
      return {
        items: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        pageCount: 1,
      };
    }

    const where =
      currentOnly && openSession ? { cashSessionId: openSession.id } : {};
    const [items, total] = await this.movements.findAndCount({
      where,
      relations: { createdBy: true },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return {
      items: items.map(serializeCashMovement),
      total,
      page: pagination.page,
      limit: pagination.limit,
      pageCount: Math.max(Math.ceil(total / pagination.limit), 1),
    };
  }

  async create(context: GraphqlContext, input: CreateCashMovementInput) {
    const user = await this.authService.requireRole(context, operationalRoles);
    if (
      !input.type ||
      !Number.isFinite(input.amount) ||
      input.amount <= 0 ||
      input.description.trim().length < 3
    ) {
      throw new AppError('Ingresa tipo, monto y descripción válida.');
    }
    const session = await this.sessions.findOne({
      where: { status: CashRegisterStatus.OPEN },
    });
    if (!session)
      throw new AppError(
        'Debes abrir caja antes de registrar movimientos.',
        HttpStatus.CONFLICT,
      );
    const movement = this.movements.create({
      cashSessionId: session.id,
      cashSession: session,
      createdById: user.id,
      createdBy: user,
      type: input.type,
      amount: money(input.amount),
      description: input.description.trim(),
    });
    return serializeCashMovement(await this.movements.save(movement));
  }

  async update(
    context: GraphqlContext,
    id: string,
    input: UpdateCashMovementInput,
  ) {
    await this.authService.requireRole(context, operationalRoles);
    if (!id || !Number.isFinite(input.amount) || input.amount <= 0) {
      throw new AppError('Ingresa un monto válido.');
    }

    const openSession = await this.sessions.findOne({
      where: { status: CashRegisterStatus.OPEN },
    });
    if (!openSession) {
      throw new AppError(
        'Debes tener una caja abierta para editar movimientos.',
        HttpStatus.CONFLICT,
      );
    }

    const movement = await this.movements.findOne({
      where: { id, cashSessionId: openSession.id },
      relations: { createdBy: true },
    });
    if (!movement) {
      throw new AppError('No encontramos este movimiento en la caja actual.');
    }
    if (this.isReceivablePaymentMovement(movement)) {
      throw new AppError(
        'No puedes editar cobros de cuentas pagadas desde movimientos de caja.',
      );
    }

    movement.amount = money(input.amount);
    return serializeCashMovement(await this.movements.save(movement));
  }

  private isReceivablePaymentMovement(movement: CashMovementEntity) {
    return movement.description.startsWith(receivablePaymentDescriptionPrefix);
  }
}
