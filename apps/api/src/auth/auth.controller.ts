import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { RegisterResultDto } from './dto/register-result.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { ProfileResponseDto } from '../users/dto/profile-response.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

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
    description:
      'Account created (session may be null if e-mail confirmation is required).',
    type: RegisterResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or Supabase rejected the sign-up.',
  })
  @ApiResponse({
    status: 503,
    description: 'Supabase Auth is not configured or sign-up returned no user.',
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
      'avatarUrl, role, preferences, ...). Preferences are normalized the ' +
      'same way as PATCH /users/me. The JWT strategy resolves the Profile ' +
      'fresh on every request (creating it on first login).',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated profile.',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }
}
