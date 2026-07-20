import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Comma-separated FRONTEND_URL (e.g. "https://app.example.com,https://staging.example.com").
// Falls back to the local frontend dev server so `enableCors` never has to
// fall back to a wildcard origin, which is incompatible with credentials: true
// anyway and unsafe for a resource server that receives Supabase access tokens.
const DEFAULT_DEV_ORIGIN = 'http://localhost:3000';

function resolveAllowedOrigins(configService: ConfigService): string[] {
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  if (!frontendUrl) {
    return [DEFAULT_DEV_ORIGIN];
  }

  const origins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : [DEFAULT_DEV_ORIGIN];
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: resolveAllowedOrigins(configService),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  });

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task Manager API')
    .setDescription(
      'REST API for the Task Manager backend. Authentication is handled by Supabase; send the access token as a Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase access token (JWT)',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('PORT', 3001);

  await app.listen(port);
}

void bootstrap();
