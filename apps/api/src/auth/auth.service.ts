import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { RegisterDto } from './dto/register.dto';
import { RegisterResult } from './interfaces/register-result.interface';

const USER_STORAGE_BUCKETS = ['profile-avatars', 'tasks'] as const;
const STORAGE_LIST_PAGE_SIZE = 100;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient | null = null;
  private adminSupabase: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getSupabase(): SupabaseClient {
    if (this.supabase) return this.supabase;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')?.trim();
    const supabaseAnonKey = this.configService
      .get<string>('SUPABASE_ANON_KEY')
      ?.trim();

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseAnonKey === 'your-anon-key-here'
    ) {
      this.logger.error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be configured for registration.',
      );
      throw new ServiceUnavailableException(
        'Não foi possível criar a conta. Tente novamente mais tarde.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
    return this.supabase;
  }

  private getAdminSupabase(): SupabaseClient {
    if (this.adminSupabase) return this.adminSupabase;

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

    this.adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return this.adminSupabase;
  }

  async register(dto: RegisterDto): Promise<RegisterResult> {
    const { data, error } = await this.getSupabase().auth.signUp({
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
    });

    if (error) {
      throw new BadRequestException(
        error.message || 'Não foi possível criar a conta.',
      );
    }

    if (!data.user) {
      this.logger.error('Supabase signUp returned no user.');
      throw new ServiceUnavailableException(
        'Não foi possível criar a conta. Tente novamente mais tarde.',
      );
    }

    if (!data.session) {
      return { requiresEmailConfirmation: true, session: null };
    }

    return {
      requiresEmailConfirmation: false,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    };
  }

  /**
   * Removes every object under `{userId}/` in the avatar and task-attachment
   * buckets (matches the client upload pathPrefix).
   */
  async purgeUserStorage(userId: string): Promise<void> {
    const admin = this.getAdminSupabase();

    for (const bucket of USER_STORAGE_BUCKETS) {
      await this.removeAllInFolder(admin, bucket, userId);
    }
  }

  async deleteAuthUser(userId: string): Promise<void> {
    const admin = this.getAdminSupabase();
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (!error) {
      return;
    }

    const message = error.message?.toLowerCase() ?? '';
    const status =
      typeof (error as { status?: number }).status === 'number'
        ? (error as { status: number }).status
        : undefined;

    // Already gone in Auth — Profile delete can still proceed.
    if (status === 404 || message.includes('not found') || message.includes('user not found')) {
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

      // Folders often have a null id; only remove file objects.
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
