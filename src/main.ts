import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppLoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use custom winston logger
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  app.flushLogs();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('MyFuel API')
    .setDescription('Digital fleet management platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({
      type: 'apiKey',
      name: 'X-API-KEY',
      in: 'header',
      description: 'Fuel Station API Key'
    }, 'api-key')
    .addTag('Health', 'Health check endpoints')
    .addTag('Authentication', 'Login and authentication')
    .addTag('Users', 'User management')
    .addTag('Organizations', 'Organization management')
    .addTag('Cards', 'Fuel card management')
    .addTag('Transactions', 'Transaction processing and history')
    .build();
  
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    extraModels: [],
  });
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showCommonExtensions: true,
      showExtensions: true,
    },
    customSiteTitle: 'MyFuel API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // Use structured logging for startup
  logger.log(`MyFuel API started successfully`, 'Bootstrap');
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`API Documentation: http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});