import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Role } from '../common/enums';
import { hashPassword } from '../common/utils';
import { getDatabaseOptions } from '../config/database-options';
import { UserEntity } from '../users';

config();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@abr.local';
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345';
const adminFullName = process.env.SEED_ADMIN_FULL_NAME ?? 'Administrador ABR';
const adminPhone = process.env.SEED_ADMIN_PHONE ?? '9990000000';
const adminUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin';

async function seedAdmin() {
  const dataSource = new DataSource({
    ...getDatabaseOptions(process.env),
    synchronize: false,
  });

  await dataSource.initialize();
  const users = dataSource.getRepository(UserEntity);
  const existing = await users.findOne({ where: { email: adminEmail } });

  await users.save({
    ...(existing ?? {}),
    fullName: adminFullName,
    email: adminEmail,
    username: adminUsername,
    phone: adminPhone,
    role: Role.SUPERADMIN,
    active: true,
    passwordHash: hashPassword(adminPassword),
  });

  await dataSource.destroy();
  console.log(`SUPERADMIN listo: ${adminEmail}`);
}

void seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
