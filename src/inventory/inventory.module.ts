import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProductEntity } from '../products';
import { InventoryResolver } from './inventory.resolver';
import { InventoryService } from './inventory.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ProductEntity])],
  providers: [InventoryResolver, InventoryService],
})
export class InventoryModule {}
