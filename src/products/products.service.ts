import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, MoreThan, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { AppError } from '../common/app-error';
import { GraphqlContext } from '../common/interfaces';
import { money, quantity, serializeProduct } from '../common/utils';
import { operationalRoles } from '../common/utils';
import { UnitType } from '../common/enums';
import { ProductEntity } from './product.entity';
import { ProductInput } from './products.inputs';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
    private readonly authService: AuthService,
  ) {}

  async searchProducts(context: GraphqlContext, searchInput?: string) {
    await this.authService.requireRole(context, operationalRoles);
    const search = searchInput?.trim().slice(0, 80) ?? '';
    if (!search) return [];

    const products = await this.productsRepository.find({
      where: [
        { active: true, stock: MoreThan('0'), name: ILike(`%${search}%`) },
        { active: true, stock: MoreThan('0'), sku: ILike(`%${search}%`) },
      ],
      order: { name: 'ASC' },
      take: 12,
    });
    return products.map(serializeProduct);
  }

  async manageProducts(context: GraphqlContext) {
    await this.authService.requireRole(context, operationalRoles);
    const products = await this.productsRepository.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return products.map(serializeProduct);
  }

  async createProduct(context: GraphqlContext, input: ProductInput) {
    await this.authService.requireRole(context, operationalRoles);
    const product = this.productsRepository.create(
      this.validateProductInput(input),
    );
    try {
      return serializeProduct(await this.productsRepository.save(product));
    } catch {
      throw new AppError(
        'Ya existe un producto con ese SKU.',
        HttpStatus.CONFLICT,
      );
    }
  }

  async updateProduct(
    context: GraphqlContext,
    id: string,
    input: ProductInput,
  ) {
    await this.authService.requireRole(context, operationalRoles);
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product)
      throw new AppError('El producto ya no existe.', HttpStatus.NOT_FOUND);
    Object.assign(product, this.validateProductInput(input));
    if (typeof input.active === 'boolean') product.active = input.active;
    try {
      return serializeProduct(await this.productsRepository.save(product));
    } catch {
      throw new AppError(
        'Ya existe otro producto con ese SKU.',
        HttpStatus.CONFLICT,
      );
    }
  }

  async deleteProduct(context: GraphqlContext, id: string, permanent = false) {
    await this.authService.requireRole(context, operationalRoles);
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product)
      throw new AppError('El producto ya no existe.', HttpStatus.NOT_FOUND);
    if (permanent) await this.productsRepository.remove(product);
    else {
      product.active = false;
      await this.productsRepository.save(product);
    }
    return { ok: true };
  }

  private validateProductInput(input: ProductInput) {
    const sku = input.sku.trim().toUpperCase();
    const name = input.name.trim();
    const description = input.description?.trim() || null;
    const { costPrice, profitMargin, price, stock, unit } = input;

    if (
      sku.length < 2 ||
      name.length < 2 ||
      !unit ||
      !Number.isFinite(costPrice) ||
      costPrice < 0 ||
      !Number.isFinite(profitMargin) ||
      profitMargin < 0 ||
      profitMargin >= 100 ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      (unit === UnitType.PIECE && !Number.isInteger(stock))
    ) {
      throw new AppError(
        'Revisa los precios, el porcentaje de ganancia menor a 100% y las existencias.',
      );
    }

    return {
      sku,
      name,
      description,
      costPrice: money(costPrice),
      profitMargin: profitMargin.toFixed(2),
      price: money(price),
      unit,
      stock: quantity(stock, unit),
    };
  }
}
