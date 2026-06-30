import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CashRegisterSessionEntity } from '../cash-register';
import { ProductEntity } from '../products';
import { HeldTicketEntity } from './held-ticket.entity';
import { HeldTicketsResolver } from './held-tickets.resolver';
import { HeldTicketsService } from './held-tickets.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      HeldTicketEntity,
      ProductEntity,
      CashRegisterSessionEntity,
    ]),
  ],
  providers: [HeldTicketsResolver, HeldTicketsService],
})
export class HeldTicketsModule {}
