import { INestApplication, ValidationPipe } from '@nestjs/common';

// Mirrors the global pipe registered in main.ts (bootstrap), so e2e tests
// exercise the exact same validation/transformation behavior as production.
export function applyGlobalPipes(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
}
