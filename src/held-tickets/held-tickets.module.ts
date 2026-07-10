import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CashRegisterSessionEntity } from '../cash-register';
import { ProductsModule } from '../products/products.module';
import { HeldTicketEntity } from './held-ticket.entity';
import { HeldTicketsResolver } from './held-tickets.resolver';
import { HeldTicketsService } from './held-tickets.service';

@Module({
  imports: [
    AuthModule,
    ProductsModule,
    TypeOrmModule.forFeature([
      HeldTicketEntity,
      CashRegisterSessionEntity,
    ]),
  ],
  providers: [HeldTicketsResolver, HeldTicketsService],
})
export class HeldTicketsModule {}
