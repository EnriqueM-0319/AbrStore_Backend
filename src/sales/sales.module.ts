import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CashRegisterSessionEntity } from '../cash-register';
import { ProductEntity } from '../products';
import { SaleEntity } from './sale.entity';
import { SalesResolver } from './sales.resolver';
import { SalesService } from './sales.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      SaleEntity,
      ProductEntity,
      CashRegisterSessionEntity,
    ]),
  ],
  providers: [SalesResolver, SalesService],
})
export class SalesModule {}
