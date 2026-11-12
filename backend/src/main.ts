import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('[DB Config]', {
    host: process.env.DB_HOST || '(unset)',
    port: process.env.DB_PORT || '(unset)',
    username: process.env.DB_USERNAME || '(unset)',
    database: process.env.DB_NAME || '(unset)',
    ssl: process.env.DB_SSL || '(unset)',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
  });

  const app = await NestFactory.create(AppModule);

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger (개발 환경)
  if (process.env.NODE_ENV === 'development') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const swaggerUiExpress = require('swagger-ui-express');

    const config = new DocumentBuilder()
      .setTitle('IEUM API')
      .setDescription('IEUM 백엔드 API 문서')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    app.use('/api-docs', swaggerUiExpress.serve, swaggerUiExpress.setup(document));
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
