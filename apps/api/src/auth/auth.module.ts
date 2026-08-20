import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { SupabaseAdminService } from './supabase-admin.service';
import { SupabaseJwtStrategy } from './strategies/supabase-jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseAdminService,
    SupabaseJwtStrategy,
    SupabaseAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, SupabaseAdminService, SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
