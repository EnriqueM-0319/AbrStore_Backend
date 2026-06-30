import { ProductEntity } from '../../../products';
import { toNumber } from '../number.util';

export function serializeProduct(product: ProductEntity) {
  return {
    ...product,
    costPrice: toNumber(product.costPrice),
    profitMargin: toNumber(product.profitMargin),
    price: toNumber(product.price),
    stock: toNumber(product.stock),
  };
}
