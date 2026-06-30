import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { AppError } from '../common/app-error';
import { StockExitReason, UnitType } from '../common/enums';
import { GraphqlContext } from '../common/interfaces';
import {
  getPagination,
  operationalRoles,
  quantity,
  serializeStockExit,
  toNumber,
} from '../common/utils';
import { ProductEntity } from '../products';
import { StockExitEntity } from './stock-exit.entity';

@Injectable()
export class StockExitsService {
  constructor(
    @InjectRepository(StockExitEntity)
    private readonly exits: Repository<StockExitEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    private readonly authService: AuthService,
  ) {}

  async stockExits(context: GraphqlContext, page?: number, limit?: number) {
    await this.authService.requireRole(context, operationalRoles);
    const pagination = getPagination(page, limit);
    const [items, total] = await this.exits.findAndCount({
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return {
      items: items.map(serializeStockExit),
      total,
      page: pagination.page,
      limit: pagination.limit,
      pageCount: Math.max(Math.ceil(total / pagination.limit), 1),
    };
  }

  async createStockExit(
    context: GraphqlContext,
    productId: string,
    quantityValue: number,
    reason: StockExitReason,
    note?: string,
  ) {
    const user = await this.authService.requireRole(context, operationalRoles);
    const product = await this.products.findOne({
      where: { id: productId, active: true },
    });

    if (!product || !Number.isFinite(quantityValue) || quantityValue <= 0)
      throw new AppError('Selecciona producto, motivo y cantidad válida.');
    if (product.unit === UnitType.PIECE && !Number.isInteger(quantityValue))
      throw new AppError(
        `${product.name} solo puede darse de baja por piezas completas.`,
      );
    if (toNumber(product.stock) < quantityValue)
      throw new AppError(`${product.name} no tiene existencias suficientes.`);

    product.stock = quantity(
      toNumber(product.stock) - quantityValue,
      product.unit,
    );
    await this.products.save(product);

    const exit = this.exits.create({
      productId: product.id,
      userId: user.id,
      user,
      reason,
      sku: product.sku,
      name: product.name,
      description: product.description,
      unit: product.unit,
      quantity: quantity(quantityValue, product.unit),
      note: note?.trim() || null,
    });

    return serializeStockExit(await this.exits.save(exit));
  }
}
