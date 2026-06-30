import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfo } from '../../common/dto';
import { StockExit } from './stock-exit.output';

@ObjectType()
export class PaginatedStockExits extends PageInfo {
  @Field(() => [StockExit])
  items!: StockExit[];
}
