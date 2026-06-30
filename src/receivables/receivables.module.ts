import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CashMovementEntity } from '../cash-movements';
import { CashRegisterSessionEntity } from '../cash-register';
import { SaleEntity } from '../sales';
import { ReceivablesResolver } from './receivables.resolver';
import { ReceivablesService } from './receivables.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      SaleEntity,
      CashRegisterSessionEntity,
      CashMovementEntity,
    ]),
  ],
  providers: [ReceivablesResolver, ReceivablesService],
})
export class ReceivablesModule {}
