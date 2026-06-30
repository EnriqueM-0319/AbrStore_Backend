import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createCorsOriginResolver } from './config/cors-origin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: createCorsOriginResolver(),
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
