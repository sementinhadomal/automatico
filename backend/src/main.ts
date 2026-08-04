import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  // Winston Logger configurado
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            return `${timestamp} [${level}] [${context || 'App'}] ${message}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/omnimedia-error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/omnimedia-combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, { logger });

  // Prefix global da API
  app.setGlobalPrefix('api/v1');

  // Pipes de validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS para o frontend Next.js
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Swagger/OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('OmniMedia SaaS — API REST')
    .setDescription(
      'API privada de gerenciamento de contas, navegadores anti-detect, edição de mídias (Sharp/FFmpeg), agendamento (BullMQ) e publicação automatizada em redes sociais.',
    )
    .setVersion('2.4')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .addTag('auth', 'Autenticação e Autorização (JWT + Refresh Token + 2FA)')
    .addTag('accounts', 'Gerenciamento de Contas Multirregiões e Proxies')
    .addTag('browser', 'Controle de Navegadores Anti-Detect (Puppeteer Stealth)')
    .addTag('library', 'Biblioteca Central de Mídias, Copys, Hashtags e CTAs')
    .addTag('scheduler', 'Agendamento Automático (50 Dias / BullMQ)')
    .addTag('publisher', 'Motor de Publicação Automatizada')
    .addTag('campaigns', 'Campanhas Multirregiões')
    .addTag('reports', 'Relatórios e Métricas')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 OmniMedia API rodando na porta ${port}`, 'Bootstrap');
  logger.log(`📚 Documentação Swagger: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
