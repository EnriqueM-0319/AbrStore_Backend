import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CashRegisterSessionEntity } from '../cash-register';
import { CashMovementEntity } from './cash-movement.entity';
import { CashMovementsResolver } from './cash-movements.resolver';
import { CashMovementsService } from './cash-movements.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([CashMovementEntity, CashRegisterSessionEntity]),
  ],
  providers: [CashMovementsResolver, CashMovementsService],
})
export class CashMovementsModule {}
