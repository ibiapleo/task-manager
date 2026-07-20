import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UsersService } from './users.service';

const USER_ID_PARAM = {
  name: 'id',
  description: 'User (profile) UUID.',
  example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
};

// Every route requires a valid Supabase access token; ADMIN-only routes are
// additionally protected by RolesGuard.
@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Reading the authenticated profile lives at GET /auth/me
  // (AuthController) - @CurrentUser() already injects the full, up-to-date
  // Profile entity, so a second identical read-only route here would just
  // duplicate it.

  @Patch('me')
  @ApiOperation({
    summary: 'Update the authenticated profile',
    description:
      'Partial update of name, avatarUrl (the public Supabase Storage URL ' +
      'uploaded client-side) and preferences. Preferences are merged: only ' +
      'the provided fields are changed.',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Validation error in the request body.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  updateMe(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List users',
    description:
      'Paginated list of every profile (query: page, limit). Restricted to ADMIN. ' +
      'Response includes meta: page, limit, total, totalPages.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of users.' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters.' })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is authenticated but is not an ADMIN.',
  })
  findAll(@Query() filterDto: UserFilterDto) {
    return this.usersService.findAll(filterDto);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiParam(USER_ID_PARAM)
  @ApiOperation({
    summary: 'Change a user role',
    description:
      'Switches a user between COMMON and ADMIN. Restricted to ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Validation error in the request body, or invalid UUID.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is authenticated but is not an ADMIN.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, updateRoleDto);
  }
}
