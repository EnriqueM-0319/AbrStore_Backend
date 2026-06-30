import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfo } from '../../common/dto';
import { Product } from './product.output';

@ObjectType()
export class PaginatedProducts extends PageInfo {
  @Field(() => [Product])
  items!: Product[];
}
