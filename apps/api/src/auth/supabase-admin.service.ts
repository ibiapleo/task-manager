import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const USER_STORAGE_BUCKETS = ['profile-avatars', 'tasks'] as const;
const STORAGE_LIST_PAGE_SIZE = 100;

@Injectable()
export class SupabaseAdminService {
  private readonly logger = new Logger(SupabaseAdminService.name);
  private adminClient: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  async purgeUserStorage(userId: string): Promise<void> {
    const admin = this.getAdminClient();

    for (const bucket of USER_STORAGE_BUCKETS) {
      await this.removeAllInFolder(admin, bucket, userId);
    }
  }

  async deleteAuthUser(userId: string): Promise<void> {
    const { error } = await this.getAdminClient().auth.admin.deleteUser(userId);

    if (!error) {
      return;
    }

    const message = error.message?.toLowerCase() ?? '';
    const status =
      typeof (error as { status?: number }).status === 'number'
        ? (error as { status: number }).status
        : undefined;

    if (
      status === 404 ||
      message.includes('not found') ||
      message.includes('user not found')
    ) {
      this.logger.warn(
        `Auth user "${userId}" was already missing; continuing with profile delete.`,
      );
      return;
    }

    this.logger.error(
      `Failed to delete Auth user "${userId}": ${error.message}`,
    );
    throw new ServiceUnavailableException(
      'Não foi possível excluir o usuário. Tente novamente mais tarde.',
    );
  }

  private getAdminClient(): SupabaseClient {
    if (this.adminClient) return this.adminClient;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')?.trim();
    const serviceRoleKey = this.configService
      .get<string>('SUPABASE_SERVICE_ROLE_KEY')
      ?.trim();

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      serviceRoleKey === 'your-service-role-key-here'
    ) {
      this.logger.error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for admin user deletion.',
      );
      throw new ServiceUnavailableException(
        'Não foi possível excluir o usuário. Tente novamente mais tarde.',
      );
    }

    this.adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return this.adminClient;
  }

  private async removeAllInFolder(
    admin: SupabaseClient,
    bucket: string,
    folder: string,
  ): Promise<void> {
    let offset = 0;

    for (;;) {
      const { data, error } = await admin.storage.from(bucket).list(folder, {
        limit: STORAGE_LIST_PAGE_SIZE,
        offset,
      });

      if (error) {
        this.logger.error(
          `Failed to list storage folder "${bucket}/${folder}": ${error.message}`,
        );
        throw new ServiceUnavailableException(
          'Não foi possível excluir os arquivos do usuário. Tente novamente mais tarde.',
        );
      }

      if (!data || data.length === 0) {
        return;
      }

      const paths = data
        .filter((item) => item.id != null)
        .map((item) => `${folder}/${item.name}`);

      if (paths.length > 0) {
        const { error: removeError } = await admin.storage
          .from(bucket)
          .remove(paths);

        if (removeError) {
          this.logger.error(
            `Failed to remove storage objects in "${bucket}/${folder}": ${removeError.message}`,
          );
          throw new ServiceUnavailableException(
            'Não foi possível excluir os arquivos do usuário. Tente novamente mais tarde.',
          );
        }
      }

      if (data.length < STORAGE_LIST_PAGE_SIZE) {
        return;
      }

      offset += STORAGE_LIST_PAGE_SIZE;
    }
  }
}
