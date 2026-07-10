import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SaleEntity, SaleItemEntity } from '../sales';
import { ReportsResolver } from './reports.resolver';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([SaleEntity, SaleItemEntity])],
  providers: [ReportsResolver, ReportsService],
})
export class ReportsModule {}
