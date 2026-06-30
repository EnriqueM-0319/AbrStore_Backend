import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { GraphqlContext } from '../common/interfaces';
import { getPagination } from '../common/utils';
import { serializeProduct } from '../common/utils';
import { operationalRoles } from '../common/utils';
import { ProductEntity } from '../products';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
    private readonly authService: AuthService,
  ) {}

  async inventory(
    context: GraphqlContext,
    input: {
      search?: string;
      lowStock?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    await this.authService.requireRole(context, operationalRoles);
    const search = input.search?.trim().slice(0, 80) ?? '';
    const { page, limit, skip } = getPagination(input.page, input.limit);
    const query = this.productsRepository.createQueryBuilder('product');

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('product.name ILIKE :search', { search: `%${search}%` })
            .orWhere('product.sku ILIKE :search', { search: `%${search}%` })
            .orWhere('product.description ILIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }
    if (input.lowStock)
      query.andWhere('product.active = true AND product.stock <= 5');

    const [items, total] = await query
      .orderBy('product.sku', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map(serializeProduct),
      total,
      page,
      limit,
      pageCount: Math.max(Math.ceil(total / limit), 1),
    };
  }
}
