import { ConfigModule } from '@nestjs/config';

export const appConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
});
