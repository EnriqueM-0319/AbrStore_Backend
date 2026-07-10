import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { AppError } from '../common/app-error';
import { GraphqlContext } from '../common/interfaces';
import { getPagination } from '../common/utils';
import {
  money,
  quantity,
  roundPayableTotal,
  serializeSale,
  shouldRoundPaymentMethod,
  toNumber,
} from '../common/utils';
import { operationalRoles } from '../common/utils';
import { CashRegisterSessionEntity } from '../cash-register';
import { ProductEntity, ProductStockService } from '../products';
import { SaleEntity, SaleItemEntity } from './index';
import { CashRegisterStatus, PaymentMethod, UnitType } from '../common/enums';
import { CreateSaleInput, SaleRequestItemInput } from './sales.inputs';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SaleEntity)
    private readonly salesRepository: Repository<SaleEntity>,
    @InjectRepository(CashRegisterSessionEntity)
    private readonly sessions: Repository<CashRegisterSessionEntity>,
    private readonly productStockService: ProductStockService,
    private readonly authService: AuthService,
  ) {}

  async findSales(
    context: GraphqlContext,
    input: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      folio?: number;
    },
  ) {
    await this.authService.requireRole(context, operationalRoles);
    const { page, limit, skip } = getPagination(input.page, input.limit);
    const where: Record<string, unknown> = {};
    if (input.folio) where.folio = input.folio;
    if (input.startDate || input.endDate) {
      where.createdAt = Between(
        input.startDate
          ? new Date(`${input.startDate}T00:00:00.000`)
          : new Date(0),
        input.endDate ? new Date(`${input.endDate}T23:59:59.999`) : new Date(),
      );
    }
    const open = await this.sessions.findOne({
      where: { status: CashRegisterStatus.OPEN },
    });
    const [items, total] = await this.salesRepository.findAndCount({
      where,
      relations: {
        seller: true,
        canceledBy: true,
        creditPaidBy: true,
        cashSession: true,
        items: true,
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      items: items.map((sale) => serializeSale(sale, open?.id)),
      total,
      page,
      limit,
      pageCount: Math.max(Math.ceil(total / limit), 1),
    };
  }

  async createSale(context: GraphqlContext, input: CreateSaleInput) {
    const seller = await this.authService.requireRole(
      context,
      operationalRoles,
    );
    const session = await this.sessions.findOne({
      where: { status: CashRegisterStatus.OPEN },
    });
    if (!session)
      throw new AppError(
        'Debes abrir caja antes de cobrar ventas.',
        HttpStatus.CONFLICT,
      );
    if (!input.items?.length)
      throw new AppError('Agrega al menos un producto para cobrar la venta.');

    const paymentMethod = input.paymentMethod ?? PaymentMethod.CASH;
    const { saleItems, total, itemCount, productsToUpdate } =
      await this.buildSaleItems(input.items);

    if (
      paymentMethod === PaymentMethod.CREDIT &&
      (input.creditCustomerName ?? '').trim().length < 2
    ) {
      throw new AppError('Indica a quién pertenece la cuenta por cobrar.');
    }
    const paymentTotal = shouldRoundPaymentMethod(paymentMethod)
      ? roundPayableTotal(total)
      : total;
    const received =
      paymentMethod === PaymentMethod.CASH ? Number(input.cashReceived) : null;
    if (
      paymentMethod === PaymentMethod.CASH &&
      (!Number.isFinite(received) || Number(received) < paymentTotal)
    ) {
      throw new AppError(
        'El efectivo recibido debe cubrir el total de la venta.',
      );
    }

    const sale = this.salesRepository.create({
      seller,
      sellerId: seller.id,
      cashSession: session,
      cashSessionId: session.id,
      paymentMethod,
      total: money(total),
      paymentTotal: money(paymentTotal),
      cashReceived: received == null ? null : money(received),
      changeDue: received == null ? null : money(received - paymentTotal),
      itemCount: quantity(itemCount, 'KILOGRAM'),
      creditCustomerName:
        paymentMethod === PaymentMethod.CREDIT
          ? (input.creditCustomerName?.trim().slice(0, 100) ?? null)
          : null,
      creditNote:
        paymentMethod === PaymentMethod.CREDIT
          ? input.creditNote?.trim().slice(0, 180) || null
          : null,
      items: saleItems,
    });

    await this.productStockService.saveProducts(productsToUpdate);
    return serializeSale(await this.salesRepository.save(sale));
  }

  private async buildSaleItems(requestItems: SaleRequestItemInput[]) {
    const productIds = requestItems
      .filter((item) => !item.manual && item.productId)
      .map((item) => item.productId as string);
    const products = await this.productStockService.getActiveProductsByIds(
      productIds,
    );
    const saleItems: SaleItemEntity[] = [];
    const productsToUpdate: ProductEntity[] = [];
    let total = 0;
    let itemCount = 0;

    for (const requestItem of requestItems) {
      if (requestItem.manual) {
        const item = this.createManualSaleItem(requestItem);
        saleItems.push(item);
        total += toNumber(item.lineTotal);
        itemCount += 1;
        continue;
      }

      const product = requestItem.productId
        ? products.get(requestItem.productId)
        : null;
      if (!product) throw new AppError('Revisa las cantidades de la venta.');

      const quantityValue = Number(requestItem.quantity);
      this.productStockService.ensureSellableQuantity(product, quantityValue);
      this.productStockService.decreaseStock(product, quantityValue);
      productsToUpdate.push(product);

      const lineTotal = toNumber(product.price) * quantityValue;
      saleItems.push(
        this.createProductSaleItem(product, quantityValue, lineTotal),
      );
      total += lineTotal;
      itemCount += quantityValue;
    }

    return { saleItems, total, itemCount, productsToUpdate };
  }

  private createManualSaleItem(requestItem: SaleRequestItemInput) {
    const price = Number(requestItem.price);
    if (!requestItem.name || !Number.isFinite(price) || price <= 0)
      throw new AppError('Revisa las cantidades de la venta.');

    const item = new SaleItemEntity();
    item.productId = null;
    item.sku = 'SIN-CODIGO';
    item.name = requestItem.name.trim().slice(0, 80);
    item.description = 'Venta sin código';
    item.unit = requestItem.unit ?? UnitType.PIECE;
    item.quantity = '1';
    item.unitPrice = money(price);
    item.lineTotal = money(price);
    return item;
  }

  private createProductSaleItem(
    product: ProductEntity,
    quantityValue: number,
    lineTotal: number,
  ) {
    const item = new SaleItemEntity();
    item.productId = product.id;
    item.product = product;
    item.sku = product.sku;
    item.name = product.name;
    item.description = product.description;
    item.unit = product.unit;
    item.quantity = quantity(quantityValue, product.unit);
    item.unitPrice = product.price;
    item.lineTotal = money(lineTotal);
    return item;
  }

  async cancelSale(context: GraphqlContext, id: string, reasonInput: string) {
    const user = await this.authService.requireRole(context, operationalRoles);
    const reason = reasonInput.trim();
    if (reason.length < 3)
      throw new AppError('Agrega un motivo de cancelación.');

    const currentCashSession = await this.sessions.findOne({
      where: { status: CashRegisterStatus.OPEN },
    });
    if (!currentCashSession)
      throw new AppError(
        'Solo puedes cancelar tickets con una caja abierta.',
        HttpStatus.CONFLICT,
      );

    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: {
        seller: true,
        canceledBy: true,
        cashSession: true,
        items: { product: true },
      },
    });
    if (!sale) throw new AppError('No encontramos el ticket.');
    if (sale.canceledAt)
      throw new AppError('Este ticket ya fue cancelado.', HttpStatus.CONFLICT);
    if (
      !sale.cashSession ||
      sale.cashSession.id !== currentCashSession.id ||
      sale.cashSession.status !== CashRegisterStatus.OPEN
    ) {
      throw new AppError(
        'Solo puedes cancelar tickets de la caja abierta actual.',
        HttpStatus.CONFLICT,
      );
    }

    for (const item of sale.items ?? []) {
      if (item.canceledAt || !item.product) continue;
      this.productStockService.increaseStock(
        item.product,
        toNumber(item.quantity),
      );
    }

    sale.canceledAt = new Date();
    sale.canceledById = user.id;
    sale.canceledBy = user;
    sale.cancelReason = reason;

    await this.productStockService.saveProducts(
      (sale.items ?? [])
        .map((item) => item.product)
        .filter((product): product is ProductEntity => Boolean(product)),
    );
    return serializeSale(await this.salesRepository.save(sale));
  }

  async cancelSaleItem(
    context: GraphqlContext,
    id: string,
    itemId: string,
    reasonInput: string,
  ) {
    await this.authService.requireRole(context, operationalRoles);
    const reason = reasonInput.trim();
    if (reason.length < 3)
      throw new AppError('Agrega un motivo de cancelación.');

    const currentCashSession = await this.sessions.findOne({
      where: { status: CashRegisterStatus.OPEN },
    });
    if (!currentCashSession)
      throw new AppError(
        'Solo puedes cancelar partidas con una caja abierta.',
        HttpStatus.CONFLICT,
      );

    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: {
        seller: true,
        canceledBy: true,
        cashSession: true,
        items: { product: true },
      },
    });
    if (!sale) throw new AppError('No encontramos el ticket.');
    if (sale.canceledAt)
      throw new AppError('Este ticket ya fue cancelado.', HttpStatus.CONFLICT);
    if (
      !sale.cashSession ||
      sale.cashSession.id !== currentCashSession.id ||
      sale.cashSession.status !== CashRegisterStatus.OPEN
    ) {
      throw new AppError(
        'Solo puedes cancelar partidas de tickets de la caja abierta actual.',
        HttpStatus.CONFLICT,
      );
    }

    const itemToCancel = sale.items.find((item) => item.id === itemId);
    if (!itemToCancel) throw new AppError('No encontramos la partida.');
    if (itemToCancel.canceledAt)
      throw new AppError('Esta partida ya fue cancelada.', HttpStatus.CONFLICT);

    const activeItemsAfterCancel = sale.items.filter(
      (item) => item.id !== itemId && !item.canceledAt,
    );
    if (!activeItemsAfterCancel.length) {
      throw new AppError(
        'No puedes cancelar la última partida de forma parcial. Cancela el ticket completo.',
        HttpStatus.CONFLICT,
      );
    }

    if (itemToCancel.product) {
      this.productStockService.increaseStock(
        itemToCancel.product,
        toNumber(itemToCancel.quantity),
      );
      await this.productStockService.saveProducts([itemToCancel.product]);
    }

    itemToCancel.canceledAt = new Date();
    itemToCancel.cancelReason = reason;

    const total = activeItemsAfterCancel.reduce(
      (sum, item) => sum + toNumber(item.lineTotal),
      0,
    );
    const itemCount = activeItemsAfterCancel.reduce(
      (sum, item) => sum + toNumber(item.quantity),
      0,
    );
    const paymentTotal = shouldRoundPaymentMethod(sale.paymentMethod)
      ? roundPayableTotal(total)
      : total;
    const cashReceived =
      sale.cashReceived == null ? null : toNumber(sale.cashReceived);

    sale.total = money(total);
    sale.itemCount = quantity(itemCount, UnitType.KILOGRAM);
    sale.paymentTotal = money(paymentTotal);
    sale.changeDue =
      cashReceived == null ? null : money(cashReceived - paymentTotal);

    return serializeSale(await this.salesRepository.save(sale));
  }
}
