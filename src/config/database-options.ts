import type { DataSourceOptions } from 'typeorm';
import {
  CashMovementEntity,
  CashRegisterSessionEntity,
  HeldTicketEntity,
  HeldTicketItemEntity,
  ProductEntity,
  SaleEntity,
  SaleItemEntity,
  StockExitEntity,
  UserEntity,
} from '../database/entities';

export const databaseEntities = [
  UserEntity,
  ProductEntity,
  CashRegisterSessionEntity,
  CashMovementEntity,
  SaleEntity,
  SaleItemEntity,
  HeldTicketEntity,
  HeldTicketItemEntity,
  StockExitEntity,
];

interface DatabaseEnv {
  DB_HOST?: string;
  DB_PORT?: string | number;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_DATABASE?: string;
  DB_SYNC?: string;
  DB_SSL?: string;
  DB_SSL_REJECT_UNAUTHORIZED?: string;
}

function isEnabled(value: string | undefined) {
  return value === 'true' || value === '1';
}

function getSslOptions(env: DatabaseEnv) {
  if (!isEnabled(env.DB_SSL)) return false;

  return {
    rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

export function getDatabaseOptions(env: DatabaseEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? '127.0.0.1',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USERNAME ?? 'abr_user',
    password: env.DB_PASSWORD ?? 'abr_password',
    database: env.DB_DATABASE ?? 'abr_local',
    entities: databaseEntities,
    synchronize: env.DB_SYNC === 'true',
    ssl: getSslOptions(env),
  };
}
