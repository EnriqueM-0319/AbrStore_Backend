import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProductEntity } from '../products';
import { StockExitEntity } from './stock-exit.entity';
import { StockExitsResolver } from './stock-exits.resolver';
import { StockExitsService } from './stock-exits.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([StockExitEntity, ProductEntity]),
  ],
  providers: [StockExitsResolver, StockExitsService],
})
export class StockExitsModule {}
