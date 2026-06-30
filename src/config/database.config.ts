import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseOptions } from './database-options';

export const databaseModule = TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) =>
    getDatabaseOptions({
      DB_HOST: configService.get<string>('DB_HOST'),
      DB_PORT: configService.get<string>('DB_PORT'),
      DB_USERNAME: configService.get<string>('DB_USERNAME'),
      DB_PASSWORD: configService.get<string>('DB_PASSWORD'),
      DB_DATABASE: configService.get<string>('DB_DATABASE'),
      DB_SYNC: configService.get<string>('DB_SYNC'),
      DB_SSL: configService.get<string>('DB_SSL'),
      DB_SSL_REJECT_UNAUTHORIZED: configService.get<string>(
        'DB_SSL_REJECT_UNAUTHORIZED',
      ),
    }),
});
