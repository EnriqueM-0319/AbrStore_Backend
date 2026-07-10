import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AppError } from '../common/app-error';
import { UnitType } from '../common/enums';
import { quantity, toNumber } from '../common/utils';
import { ProductEntity } from './product.entity';

@Injectable()
export class ProductStockService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
  ) {}

  async getActiveProductsByIds(productIds: string[]) {
    return this.getProductsByIds(productIds, true);
  }

  async getProductsByIds(productIds: string[], activeOnly = false) {
    const uniqueProductIds = [...new Set(productIds.filter(Boolean))];
    if (!uniqueProductIds.length) return new Map<string, ProductEntity>();

    const products = await this.productsRepository.find({
      where: activeOnly
        ? { id: In(uniqueProductIds), active: true }
        : { id: In(uniqueProductIds) },
    });

    return new Map(products.map((product) => [product.id, product]));
  }

  ensureSellableQuantity(product: ProductEntity, quantityValue: number) {
    if (!Number.isFinite(quantityValue) || quantityValue <= 0)
      throw new AppError('Revisa las cantidades de la venta.');
    if (product.unit === UnitType.PIECE && !Number.isInteger(quantityValue))
      throw new AppError(`${product.name} solo se puede vender por pieza.`);
    if (toNumber(product.stock) < quantityValue)
      throw new AppError(
        `${product.name} no tiene existencias suficientes.`,
        HttpStatus.CONFLICT,
      );
  }

  decreaseStock(product: ProductEntity, quantityValue: number) {
    product.stock = quantity(
      toNumber(product.stock) - quantityValue,
      product.unit,
    );
  }

  increaseStock(product: ProductEntity, quantityValue: number) {
    product.stock = quantity(
      toNumber(product.stock) + quantityValue,
      product.unit,
    );
  }

  async saveProducts(products: ProductEntity[]) {
    const uniqueProducts = [
      ...new Map(products.map((product) => [product.id, product])).values(),
    ];
    if (!uniqueProducts.length) return [];
    return this.productsRepository.save(uniqueProducts);
  }
}
