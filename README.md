# ABR Backend

Backend independiente para ABR, separado de la app Nuxt `AbrStore`.

## Stack inicial

- NestJS
- GraphQL con Apollo
- PostgreSQL
- TypeORM
- Docker Compose para pruebas locales

## Configuracion

```bash
cp .env.example .env
npm install
```

## Base de datos local

```bash
npm run db:up
```

PostgreSQL queda disponible en `localhost:5432` con las credenciales del archivo `.env.example`.

Para detener la base:

```bash
npm run db:down
```

Los datos se guardan en el volumen nombrado `abr_backend_postgres_data`, por lo que se conservan aunque borres o recrees el contenedor.

Para borrar contenedor y datos de desarrollo:

```bash
npm run db:reset
```

## Ejecutar API

```bash
npm run start:dev
```

La API corre por defecto en `http://localhost:4000/graphql`.

Query de prueba:

```graphql
query {
  health
}
```

## Modulos migrados desde Nuxt

- Auth: `login`, `logout`, `me`, `registerUser`
- Usuarios: `users`, `updateUser`, `deactivateUser`
- Productos e inventario: `products`, `manageProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `inventory`
- Caja: `currentCashRegister`, `cashRegisterSummary`, `openCashRegister`, `closeCashRegister`
- Movimientos de caja: `cashMovements`, `createCashMovement`
- Ventas: `sales`, `createSale`
- Tickets guardados: `heldTickets`, `createHeldTicket`, `deleteHeldTicket`
- Cuentas por cobrar: `receivables`, `payReceivable`
- Bajas de inventario: `stockExits`, `createStockExit`
- Reportes: `salesReport`

## Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```
