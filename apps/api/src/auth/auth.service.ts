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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient | null = null;

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
}
