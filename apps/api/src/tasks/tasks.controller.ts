import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CreateTaskDto } from './dto/create-task.dto';
import { DeleteTasksBatchDto } from './dto/delete-tasks-batch.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTasksBatchDto } from './dto/update-tasks-batch.dto';
import { TasksService } from './tasks.service';

const TASK_ID_PARAM = {
  name: 'id',
  description: 'Task UUID.',
  example: 'b3f4c2b0-6f2e-4c8a-8a3e-6d2a9e4d8f11',
};

// Every route requires a valid Supabase access token; ownership (COMMON vs
// ADMIN) is enforced inside TasksService.
@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@UseGuards(SupabaseAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a task',
    description:
      'Creates a task owned by the authenticated user. The profile id is ' +
      'always taken from the access token, never from the request body. ' +
      'Optionally accepts attachment URLs already uploaded to Supabase Storage.',
  })
  @ApiResponse({ status: 201, description: 'Task created successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Validation error in the request body.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List tasks',
    description:
      'Defaults to scope=personal (caller\'s tasks only). ADMIN may pass ' +
      'scope=all to list every task; COMMON requesting scope=all gets 403. ' +
      'Supports filtering by status/priority, free-text search over ' +
      'title/description, sorting and pagination.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of tasks.' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters.' })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'COMMON caller requested scope=all.',
  })
  findAll(
    @Query() filterDto: TaskFilterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findAll(filterDto, user);
  }

  @Get('admin/summary')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Task count grouped by status',
    description:
      'Aggregate view across every task in the system, regardless of owner. Restricted to ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Task counts grouped by status.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is authenticated but is not an ADMIN.',
  })
  getStatusSummary() {
    return this.tasksService.getStatusSummary();
  }

  @Get(':id')
  @ApiParam(TASK_ID_PARAM)
  @ApiOperation({
    summary: 'Get a task by id',
    description:
      'COMMON users may only fetch tasks they own; ADMIN can fetch any task.',
  })
  @ApiResponse({ status: 200, description: 'Task found.' })
  @ApiResponse({ status: 400, description: 'The id is not a valid UUID.' })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'COMMON user attempting to access a task they do not own.',
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findOne(id, user);
  }

  @Post(':id/duplicate')
  @ApiParam(TASK_ID_PARAM)
  @ApiOperation({
    summary: 'Duplicate a task',
    description:
      'Clones title, description, priority and dueDate into a new task owned ' +
      'by the authenticated user with status PENDING. Attachments are not copied. ' +
      'COMMON users may only duplicate tasks they own; ADMIN may duplicate any task.',
  })
  @ApiResponse({ status: 201, description: 'Task duplicated successfully.' })
  @ApiResponse({ status: 400, description: 'The id is not a valid UUID.' })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'COMMON user attempting to duplicate a task they do not own.',
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.duplicate(id, user);
  }

  @Patch('batch')
  @ApiOperation({
    summary: 'Update multiple tasks',
    description:
      'Applies the same status, priority and/or dueDate patch to up to 100 ' +
      'tasks. COMMON users may only update tasks they own; ADMIN may update ' +
      'any of the given tasks. Fails entirely if any id is missing or forbidden.',
  })
  @ApiResponse({ status: 200, description: 'Tasks updated successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Validation error in the request body.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'COMMON user attempting to update a task they do not own.',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more task ids were not found.',
  })
  updateMany(
    @Body() dto: UpdateTasksBatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { ids, status, priority, dueDate } = dto;
    return this.tasksService.updateMany(ids, { status, priority, dueDate }, user);
  }

  @Patch(':id')
  @ApiParam(TASK_ID_PARAM)
  @ApiOperation({
    summary: 'Update a task',
    description:
      'Partial update. COMMON users may only update tasks they own; ADMIN ' +
      'can update any task. Sending "attachments" replaces the existing set entirely.',
  })
  @ApiResponse({ status: 200, description: 'Task updated successfully.' })
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
    description: 'COMMON user attempting to update a task they do not own.',
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete('batch')
  @ApiOperation({
    summary: 'Delete multiple tasks',
    description:
      'Deletes up to 100 tasks by id in one request. COMMON users may only ' +
      'delete tasks they own; ADMIN may delete any of the given tasks. ' +
      'Fails entirely if any id is missing or forbidden.',
  })
  @ApiResponse({ status: 200, description: 'Tasks deleted successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Validation error in the request body.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'COMMON user attempting to delete a task they do not own.',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more task ids were not found.',
  })
  removeMany(
    @Body() dto: DeleteTasksBatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.removeMany(dto.ids, user);
  }

  @Delete(':id')
  @ApiParam(TASK_ID_PARAM)
  @ApiOperation({
    summary: 'Delete a task',
    description:
      'COMMON users may only delete tasks they own; ADMIN can delete any ' +
      'task. Attachments are removed automatically (cascade).',
  })
  @ApiResponse({ status: 200, description: 'Task deleted successfully.' })
  @ApiResponse({ status: 400, description: 'The id is not a valid UUID.' })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired access token.',
  })
  @ApiResponse({
    status: 403,
    description: 'COMMON user attempting to delete a task they do not own.',
  })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.remove(id, user);
  }
}
