import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './configs';
import { ValidationPipe } from '@nestjs/common';
import { ResponseTemplateInterceptor } from './common/interceptors/response-template.interceptor';
import { ExceptionTemplateFilter } from './common/filters/exception-template.filter';
// TODO: import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // TODO: Temp
  setupSwagger(app);

  const configService = app.get(ConfigService);
  const appPort = configService.getOrThrow<number>('general.appPort'),
    appIsInDebugMode = configService.get<boolean>('general.debug');

  app.useGlobalFilters(new ExceptionTemplateFilter());

  app.useGlobalInterceptors(new ResponseTemplateInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      transform: true,
      enableDebugMessages: appIsInDebugMode,
    }),
  );

  await app.listen(appPort);
}
bootstrap();
