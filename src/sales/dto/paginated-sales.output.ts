import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfo } from '../../common/dto';
import { SaleTicket } from './sale-ticket.output';

@ObjectType()
export class PaginatedSales extends PageInfo {
  @Field(() => [SaleTicket])
  items!: SaleTicket[];
}
