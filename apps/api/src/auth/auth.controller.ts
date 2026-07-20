import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get the authenticated profile',
    description:
      'Canonical endpoint to fetch the current Profile (id, email, name, ' +
      'avatarUrl, role, preferences, ...). SupabaseJwtStrategy resolves it ' +
      'fresh on every request (creating it on first login), so ' +
      '@CurrentUser() always reflects the latest data - no extra lookup ' +
      'needed.',
  })
  @ApiResponse({ status: 200, description: 'Authenticated profile.' })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
