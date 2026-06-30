import { Module } from '@nestjs/common';
import { appConfigModule } from './config/app.config';
import { databaseModule } from './config/database.config';
import { graphqlModule } from './config/graphql.config';
import { AuthModule } from './auth/auth.module';
import { CashMovementsModule } from './cash-movements/cash-movements.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { HeldTicketsModule } from './held-tickets/held-tickets.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { ReportsModule } from './reports/reports.module';
import { SalesModule } from './sales/sales.module';
import { StockExitsModule } from './stock-exits/stock-exits.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    appConfigModule,
    graphqlModule,
    databaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    InventoryModule,
    CashRegisterModule,
    CashMovementsModule,
    SalesModule,
    HeldTicketsModule,
    ReceivablesModule,
    StockExitsModule,
    ReportsModule,
  ],
  providers: [],
})
export class AppModule {}
