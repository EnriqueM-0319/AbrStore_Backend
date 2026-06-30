import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CashMovementEntity } from '../cash-movements';
import { CashRegisterSessionEntity } from './cash-register-session.entity';
import { CashRegisterResolver } from './cash-register.resolver';
import { CashRegisterService } from './cash-register.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([CashRegisterSessionEntity, CashMovementEntity]),
  ],
  providers: [CashRegisterResolver, CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}
