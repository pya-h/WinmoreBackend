import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './configs';
import { ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupSwagger(app);

  const configService = app.get(ConfigService);
  const appPort = configService.getOrThrow<number>('general.appPort'),
    appIsInDebugMode = configService.get<boolean>('general.debug');

  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      transform: true,
      enableDebugMessages: appIsInDebugMode,
      exceptionFactory: (validationErrors: ValidationError[]) => {
        // TODO: Complete this validation exception manager
      },
    }),
  );

  // app.useGlobalInterceptors(new StandardResponseTransformInterceptor()); // TODO: Write this server response transformer to setup a global format in the server.

  await app.listen(appPort);
}
bootstrap();
