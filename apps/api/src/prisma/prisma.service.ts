import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Wraps Prisma's connection lifecycle with retry/backoff on startup.
 *
 * Supabase's pooled connection can be momentarily unreachable (cold pooler,
 * transient network blip). Without this, a single failed `$connect()` call
 * throws out of `onModuleInit`, which NestJS treats as fatal and kills the
 * whole process - taking down every route, not just the database calls.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private static readonly MAX_CONNECT_ATTEMPTS = 5;
  private static readonly BASE_RETRY_DELAY_MS = 2000;

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      await this.$connect();
      if (attempt > 1) {
        this.logger.log(`Database connection established on attempt ${attempt}.`);
      }
    } catch (error) {
      if (attempt >= PrismaService.MAX_CONNECT_ATTEMPTS) {
        this.logger.error(
          `Could not reach the database after ${attempt} attempts. Giving up.`,
        );
        throw error;
      }

      const delayMs = PrismaService.BASE_RETRY_DELAY_MS * attempt;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Database connection attempt ${attempt} failed (${message}). Retrying in ${delayMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await this.connectWithRetry(attempt + 1);
    }
  }
}
