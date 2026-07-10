import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CashRegisterSessionEntity } from '../cash-register';
import { ProductsModule } from '../products/products.module';
import { SaleEntity } from './sale.entity';
import { SalesResolver } from './sales.resolver';
import { SalesService } from './sales.service';

@Module({
  imports: [
    AuthModule,
    ProductsModule,
    TypeOrmModule.forFeature([
      SaleEntity,
      CashRegisterSessionEntity,
    ]),
  ],
  providers: [SalesResolver, SalesService],
})
export class SalesModule {}
