import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { CashRegisterSessionEntity } from '../cash-register';
import { AppError } from '../common/app-error';
import { CashRegisterStatus, PaymentMethod, UnitType } from '../common/enums';
import { GraphqlContext } from '../common/interfaces';
import {
  money,
  operationalRoles,
  quantity,
  serializeHeldTicket,
  toNumber,
} from '../common/utils';
import { ProductEntity, ProductStockService } from '../products';
import { CreateSaleInput } from '../sales/sales.inputs';
import { HeldTicketEntity, HeldTicketItemEntity } from './index';

@Injectable()
export class HeldTicketsService {
  constructor(
    @InjectRepository(HeldTicketEntity)
    private readonly tickets: Repository<HeldTicketEntity>,
    @InjectRepository(CashRegisterSessionEntity)
    private readonly sessions: Repository<CashRegisterSessionEntity>,
    private readonly productStockService: ProductStockService,
    private readonly authService: AuthService,
  ) {}

  async heldTickets(context: GraphqlContext) {
    await this.authService.requireRole(context, operationalRoles);
    const session = await this.findOpenSession();
    if (!session) return [];

    const tickets = await this.tickets.find({
      where: { cashSessionId: session.id },
      relations: { createdBy: true, items: { product: true } },
      order: { updatedAt: 'DESC' },
      take: 20,
    });

    return tickets.map(serializeHeldTicket);
  }

  async createHeldTicket(
    context: GraphqlContext,
    input: CreateSaleInput,
    note?: string,
  ) {
    const user = await this.authService.requireRole(context, operationalRoles);
    const session = await this.findOpenSession();

    if (!session)
      throw new AppError('Debes iniciar caja antes de guardar tickets.');
    if (!input.items?.length)
      throw new AppError('Agrega productos antes de guardar el ticket.');

    const { items, total, itemCount, productsToUpdate } =
      await this.buildTicketItems(input);
    const ticket = this.tickets.create({
      note: note?.trim().slice(0, 120) || null,
      paymentMethod: this.resolvePaymentMethod(input.paymentMethod),
      total: money(total),
      itemCount: quantity(itemCount, UnitType.KILOGRAM),
      cashSessionId: session.id,
      createdById: user.id,
      createdBy: user,
      items,
    });

    await this.productStockService.saveProducts(productsToUpdate);
    return serializeHeldTicket(await this.tickets.save(ticket));
  }

  async deleteHeldTicket(context: GraphqlContext, id: string) {
    await this.authService.requireRole(context, operationalRoles);
    const ticket = await this.tickets.findOne({
      where: { id },
      relations: { items: true },
    });

    if (!ticket) throw new AppError('No encontramos el ticket guardado.');

    const productIds = (ticket.items ?? [])
      .map((item) => item.productId)
      .filter((id): id is string => Boolean(id));
    const products = await this.productStockService.getProductsByIds(productIds);
    for (const item of ticket.items ?? []) {
      if (!item.productId) continue;
      const product = products.get(item.productId);
      if (!product) continue;
      this.productStockService.increaseStock(product, toNumber(item.quantity));
    }

    await this.productStockService.saveProducts([...products.values()]);
    await this.tickets.remove(ticket);
    return { ok: true };
  }

  private async findOpenSession() {
    return this.sessions.findOne({
      where: { status: CashRegisterStatus.OPEN },
    });
  }

  private async buildTicketItems(input: CreateSaleInput) {
    const productIds = input.items
      .filter((item) => !item.manual && item.productId)
      .map((item) => item.productId as string);
    const products = await this.productStockService.getActiveProductsByIds(
      productIds,
    );
    const items: HeldTicketItemEntity[] = [];
    const productsToUpdate: ProductEntity[] = [];
    let total = 0;
    let itemCount = 0;

    for (const requestItem of input.items) {
      if (requestItem.manual) {
        const item = this.createManualItem(requestItem);
        items.push(item);
        total += toNumber(item.lineTotal);
        itemCount += 1;
        continue;
      }

      const product = requestItem.productId
        ? products.get(requestItem.productId)
        : null;
      if (!product) throw new AppError('Revisa las cantidades del ticket.');
      const productItem = this.createProductItem(requestItem, product);
      items.push(productItem.item);
      productsToUpdate.push(product);
      total += productItem.lineTotal;
      itemCount += productItem.quantity;
    }

    return { items, total, itemCount, productsToUpdate };
  }

  private createManualItem(requestItem: CreateSaleInput['items'][number]) {
    const price = Number(requestItem.price);
    if (!requestItem.name || !Number.isFinite(price) || price <= 0)
      throw new AppError('Revisa las cantidades del ticket.');

    const item = new HeldTicketItemEntity();
    item.productId = null;
    item.sku = 'SIN-CODIGO';
    item.name = requestItem.name.trim();
    item.description = 'Venta sin código';
    item.unit = requestItem.unit ?? UnitType.PIECE;
    item.quantity = '1';
    item.unitPrice = money(price);
    item.lineTotal = money(price);
    return item;
  }

  private createProductItem(
    requestItem: CreateSaleInput['items'][number],
    product: ProductEntity,
  ) {
    const quantityValue = Number(requestItem.quantity);

    this.productStockService.ensureSellableQuantity(product, quantityValue);
    this.productStockService.decreaseStock(product, quantityValue);

    const lineTotal = toNumber(product.price) * quantityValue;
    const item = new HeldTicketItemEntity();
    item.productId = product.id;
    item.product = product;
    item.sku = product.sku;
    item.name = product.name;
    item.description = product.description;
    item.unit = product.unit;
    item.quantity = quantity(quantityValue, product.unit);
    item.unitPrice = product.price;
    item.lineTotal = money(lineTotal);

    return { item, lineTotal, quantity: quantityValue };
  }

  private resolvePaymentMethod(paymentMethod?: PaymentMethod) {
    if (
      paymentMethod === PaymentMethod.CARD ||
      paymentMethod === PaymentMethod.TRANSFER
    )
      return paymentMethod;
    return PaymentMethod.CASH;
  }
}
