import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PixKeyAlreadyExistsErrorFilter } from './pix-keys/filters/pix-key-already-exists.error';
import { PixKeyGrpcUnknownErrorFilter } from './pix-keys/filters/pix-key-grpc-unknown-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(
    new PixKeyGrpcUnknownErrorFilter(),
    new PixKeyAlreadyExistsErrorFilter(),
  );

  await app.listen(3000);
}
bootstrap();
