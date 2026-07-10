import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ProductEntity } from './product.entity';
import { ProductStockService } from './product-stock.service';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ProductEntity])],
  providers: [ProductsResolver, ProductsService, ProductStockService],
  exports: [ProductStockService],
})
export class ProductsModule {}
