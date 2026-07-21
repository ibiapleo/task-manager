import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Validates password complexity (OWASP-aligned) then creates the user ' +
      'via Supabase Auth. Returns session tokens when e-mail confirmation is ' +
      'disabled; otherwise requiresEmailConfirmation is true.',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created (session may be null if e-mail confirmation is required).',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or Supabase rejected the sign-up.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

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
