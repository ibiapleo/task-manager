import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { DeleteWorkspaceResultDto } from './dto/delete-workspace-result.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { WorkspacesService } from './workspaces.service';

const WORKSPACE_ID_PARAM = {
  name: 'id',
  description: 'Workspace UUID.',
  example: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
};

@ApiTags('Workspaces')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({
    summary: 'List workspaces',
    description:
      "Returns the caller's workspaces ordered by creation time. If the " +
      'user has none, a default "Geral" workspace is created in the same ' +
      "request. Never returns another user's workspaces.",
  })
  @ApiResponse({
    status: 200,
    description: 'List of workspaces owned by the caller.',
    type: [WorkspaceResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.findAll(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a workspace',
    description:
      'Creates a workspace owned by the authenticated user. Names are ' +
      'trimmed, unique per user (case-insensitive), and capped at 40 ' +
      'characters. Each user may have at most 20 workspaces.',
  })
  @ApiResponse({
    status: 201,
    description: 'Workspace created successfully.',
    type: WorkspaceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validation error in the request body, or the caller already has 20 workspaces.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 409,
    description: 'The caller already has a workspace with this name.',
  })
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.create(createWorkspaceDto, user);
  }

  @Patch(':id')
  @ApiParam(WORKSPACE_ID_PARAM)
  @ApiOperation({
    summary: 'Rename a workspace',
    description:
      'Partial update of the workspace name. COMMON and ADMIN may only ' +
      'rename workspaces they own.',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace updated successfully.',
    type: WorkspaceResponseDto,
  })
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
    description: 'Caller attempting to update a workspace they do not own.',
  })
  @ApiResponse({ status: 404, description: 'Workspace not found.' })
  @ApiResponse({
    status: 409,
    description: 'The caller already has a workspace with this name.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.update(id, updateWorkspaceDto, user);
  }

  @Delete(':id')
  @ApiParam(WORKSPACE_ID_PARAM)
  @ApiOperation({
    summary: 'Delete a workspace',
    description:
      'Deletes a workspace owned by the caller. Tasks in that workspace are ' +
      'removed by cascade. The last remaining workspace cannot be deleted.',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace deleted successfully.',
    type: DeleteWorkspaceResultDto,
  })
  @ApiResponse({ status: 400, description: 'The id is not a valid UUID.' })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller attempting to delete a workspace they do not own.',
  })
  @ApiResponse({ status: 404, description: 'Workspace not found.' })
  @ApiResponse({
    status: 409,
    description: 'Caller attempted to delete their last remaining workspace.',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspacesService.remove(id, user);
  }
}
