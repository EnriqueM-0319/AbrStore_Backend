import 'reflect-metadata';
import { DataSource, In } from 'typeorm';
import { config } from 'dotenv';
import {
  CashMovementType,
  CashRegisterStatus,
  PaymentMethod,
  Role,
  StockExitReason,
  UnitType,
} from '../common/enums';
import { getDatabaseOptions } from '../config/database-options';
import { CashMovementEntity } from '../cash-movements';
import { CashRegisterSessionEntity } from '../cash-register';
import { HeldTicketEntity, HeldTicketItemEntity } from '../held-tickets';
import { ProductEntity } from '../products';
import { SaleEntity, SaleItemEntity } from '../sales';
import { StockExitEntity } from '../stock-exits';
import { UserEntity } from '../users';

config();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@abr.local';
const productSeeds = [
  {
    sku: 'SEED-001',
    name: 'Café molido 500g',
    description: 'Producto demo por pieza',
    costPrice: '65.00',
    profitMargin: '35.00',
    price: '99.00',
    unit: UnitType.PIECE,
    stock: '24.000',
  },
  {
    sku: 'SEED-002',
    name: 'Azúcar estándar',
    description: 'Producto demo por kilogramo',
    costPrice: '18.00',
    profitMargin: '25.00',
    price: '24.00',
    unit: UnitType.KILOGRAM,
    stock: '18.500',
  },
  {
    sku: 'SEED-003',
    name: 'Galletas surtidas',
    description: 'Producto demo con bajo stock',
    costPrice: '28.00',
    profitMargin: '40.00',
    price: '42.00',
    unit: UnitType.PIECE,
    stock: '4.000',
  },
  {
    sku: 'SEED-004',
    name: 'Arroz a granel',
    description: 'Producto demo para inventario',
    costPrice: '22.00',
    profitMargin: '20.00',
    price: '28.00',
    unit: UnitType.KILOGRAM,
    stock: '32.250',
  },
];

async function seedDemo() {
  const dataSource = new DataSource({
    ...getDatabaseOptions(process.env),
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    const users = dataSource.getRepository(UserEntity);
    const admin = await users.findOne({
      where: [{ email: adminEmail }, { role: Role.SUPERADMIN }],
      order: { email: 'ASC' },
    });

    if (!admin) {
      throw new Error(
        `No existe usuario admin. Ejecuta primero: npm run seed:admin`,
      );
    }

    const products = await seedProducts(dataSource);
    const openSession = await seedCashRegister(dataSource, admin);
    await seedCashMovements(dataSource, admin, openSession);
    await seedSales(dataSource, admin, openSession, products);
    await seedHeldTickets(dataSource, admin, openSession, products);
    await seedStockExits(dataSource, admin, products);

    console.log('Seed demo listo: productos, caja, ventas, reportes y stock.');
  } finally {
    await dataSource.destroy();
  }
}

async function seedProducts(dataSource: DataSource) {
  const products = dataSource.getRepository(ProductEntity);

  for (const seed of productSeeds) {
    const existing = await products.findOne({ where: { sku: seed.sku } });
    await products.save({
      ...(existing ?? {}),
      ...seed,
      active: true,
    });
  }

  return products.find({
    where: { sku: In(productSeeds.map((product) => product.sku)) },
  });
}

async function seedCashRegister(dataSource: DataSource, admin: UserEntity) {
  const sessions = dataSource.getRepository(CashRegisterSessionEntity);
  const existing = await sessions.findOne({
    where: { notes: 'Seed demo - caja abierta' },
  });

  if (existing) return existing;

  return sessions.save({
    status: CashRegisterStatus.OPEN,
    openingAmount: '500.00',
    notes: 'Seed demo - caja abierta',
    openedById: admin.id,
    openedBy: admin,
  });
}

async function seedCashMovements(
  dataSource: DataSource,
  admin: UserEntity,
  session: CashRegisterSessionEntity,
) {
  const movements = dataSource.getRepository(CashMovementEntity);
  const existing = await movements.count({
    where: { cashSessionId: session.id },
  });
  if (existing > 0) return;

  await movements.save([
    {
      cashSessionId: session.id,
      cashSession: session,
      createdById: admin.id,
      createdBy: admin,
      type: CashMovementType.CASH_IN,
      amount: '250.00',
      description: 'Seed demo - ingreso inicial adicional',
    },
    {
      cashSessionId: session.id,
      cashSession: session,
      createdById: admin.id,
      createdBy: admin,
      type: CashMovementType.EXPENSE,
      amount: '75.00',
      description: 'Seed demo - compra de bolsas',
    },
    {
      cashSessionId: session.id,
      cashSession: session,
      createdById: admin.id,
      createdBy: admin,
      type: CashMovementType.WITHDRAWAL,
      amount: '120.00',
      description: 'Seed demo - retiro parcial',
    },
  ]);
}

async function seedSales(
  dataSource: DataSource,
  admin: UserEntity,
  session: CashRegisterSessionEntity,
  products: ProductEntity[],
) {
  const sales = dataSource.getRepository(SaleEntity);
  const existing = await sales.count({ where: { cashSessionId: session.id } });
  if (existing > 0) return;

  const bySku = new Map(products.map((product) => [product.sku, product]));
  const coffee = bySku.get('SEED-001')!;
  const sugar = bySku.get('SEED-002')!;
  const cookies = bySku.get('SEED-003')!;

  await sales.save([
    buildSale(
      admin,
      session,
      PaymentMethod.CASH,
      '198.00',
      '198.00',
      '200.00',
      [buildSaleItem(coffee, '2.000', '198.00')],
    ),
    buildSale(admin, session, PaymentMethod.CARD, '66.00', '66.00', null, [
      buildSaleItem(sugar, '2.750', '66.00'),
    ]),
    {
      ...buildSale(
        admin,
        session,
        PaymentMethod.CREDIT,
        '126.00',
        '126.00',
        null,
        [buildSaleItem(cookies, '3.000', '126.00')],
      ),
      creditCustomerName: 'Cliente Demo Pendiente',
      creditNote: 'Cuenta por cobrar sembrada',
    },
    {
      ...buildSale(
        admin,
        session,
        PaymentMethod.CREDIT,
        '99.00',
        '100.00',
        null,
        [buildSaleItem(coffee, '1.000', '99.00')],
      ),
      creditCustomerName: 'Cliente Demo Pagado',
      creditNote: 'Cuenta cobrada en efectivo',
      creditPaidAt: new Date(),
      creditPaidById: admin.id,
      creditPaidBy: admin,
      creditPaymentMethod: PaymentMethod.CASH,
    },
  ]);
}

function buildSale(
  admin: UserEntity,
  session: CashRegisterSessionEntity,
  paymentMethod: PaymentMethod,
  total: string,
  paymentTotal: string,
  cashReceived: string | null,
  items: SaleItemEntity[],
) {
  const itemCount = items
    .reduce((sum, item) => sum + Number(item.quantity), 0)
    .toFixed(3);
  const received = cashReceived == null ? null : Number(cashReceived);
  const changeDue =
    received == null ? null : (received - Number(paymentTotal)).toFixed(2);

  return {
    seller: admin,
    sellerId: admin.id,
    cashSession: session,
    cashSessionId: session.id,
    paymentMethod,
    total,
    paymentTotal,
    cashReceived,
    changeDue,
    itemCount,
    items,
  };
}

function buildSaleItem(
  product: ProductEntity,
  quantity: string,
  lineTotal: string,
) {
  const item = new SaleItemEntity();
  item.productId = product.id;
  item.product = product;
  item.sku = product.sku;
  item.name = product.name;
  item.description = product.description;
  item.unit = product.unit;
  item.quantity = quantity;
  item.unitPrice = product.price;
  item.lineTotal = lineTotal;
  return item;
}

async function seedHeldTickets(
  dataSource: DataSource,
  admin: UserEntity,
  session: CashRegisterSessionEntity,
  products: ProductEntity[],
) {
  const tickets = dataSource.getRepository(HeldTicketEntity);
  const existing = await tickets.findOne({
    where: { note: 'Seed demo - ticket guardado' },
  });
  if (existing) return;

  const rice = products.find((product) => product.sku === 'SEED-004')!;
  const item = new HeldTicketItemEntity();
  item.productId = rice.id;
  item.product = rice;
  item.sku = rice.sku;
  item.name = rice.name;
  item.description = rice.description;
  item.unit = rice.unit;
  item.quantity = '1.500';
  item.unitPrice = rice.price;
  item.lineTotal = '42.00';

  await tickets.save({
    note: 'Seed demo - ticket guardado',
    itemCount: '1.500',
    total: '42.00',
    paymentMethod: PaymentMethod.CASH,
    cashSessionId: session.id,
    createdById: admin.id,
    createdBy: admin,
    items: [item],
  });
}

async function seedStockExits(
  dataSource: DataSource,
  admin: UserEntity,
  products: ProductEntity[],
) {
  const exits = dataSource.getRepository(StockExitEntity);
  const existing = await exits.findOne({
    where: { note: 'Seed demo - merma por caducidad' },
  });
  if (existing) return;

  const cookies = products.find((product) => product.sku === 'SEED-003')!;
  await exits.save({
    productId: cookies.id,
    userId: admin.id,
    user: admin,
    reason: StockExitReason.EXPIRED,
    sku: cookies.sku,
    name: cookies.name,
    description: cookies.description,
    unit: cookies.unit,
    quantity: '1.000',
    note: 'Seed demo - merma por caducidad',
  });
}

void seedDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});
