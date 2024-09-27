import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './configs';
import { ValidationPipe } from '@nestjs/common';
import { StandardResponseInterceptor } from './common/interceptors/standard-response.interceptor';
// import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors(); // TODO: Temp
  setupSwagger(app);

  const configService = app.get(ConfigService);
  const appPort = configService.getOrThrow<number>('general.appPort'),
    appIsInDebugMode = configService.get<boolean>('general.debug');

  app.useGlobalInterceptors(new StandardResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      transform: true,
      enableDebugMessages: appIsInDebugMode,
      // exceptionFactory: (validationErrors: ValidationError[]) => {
      //   // TODO: Complete this validation exception manager
      // },
    }),
  );

  // app.useGlobalInterceptors(new StandardResponseTransformInterceptor()); // TODO: Write this server response transformer to setup a global format in the server.

  await app.listen(appPort);
}
bootstrap();
