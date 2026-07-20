import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Attachment,
  Priority,
  Prisma,
  Role,
  Task,
  TaskStatus,
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginatedResult } from './interfaces/paginated-result.interface';
import { TaskResponse } from './interfaces/task-response.interface';
import { TaskStatusSummary } from './interfaces/task-status-summary.interface';
import { resolveFileType } from './utils/resolve-file-type.util';

export type UpdateTasksBatchPatch = {
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
};

const TASK_INCLUDE = {
  attachments: true,
  profile: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.TaskInclude;

type TaskUserProfile = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

type TaskWithRelations = Task & {
  attachments: Attachment[];
  profile: TaskUserProfile;
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateTaskDto,
    user: AuthenticatedUser,
  ): Promise<TaskResponse> {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        priority: dto.priority,
        // The owner is always the authenticated caller, never a
        // client-supplied value - prevents creating tasks on someone else's
        // behalf.
        profileId: user.id,
        attachments: this.buildAttachmentsCreateInput(dto.attachments),
      },
      include: TASK_INCLUDE,
    });

    return this.toTaskResponse(task);
  }

  async findAll(
    filter: TaskFilterDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<TaskResponse>> {
    const {
      scope = 'personal',
      status,
      priority,
      search,
      dueAfter,
      dueBefore,
      unscheduled,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = filter;

    if (scope === 'all' && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can list all tasks.',
      );
    }

    const dueDateFilter = this.buildDueDateFilter(
      unscheduled,
      dueAfter,
      dueBefore,
    );

    const where: Prisma.TaskWhereInput = {
      // personal (default): only the caller's tasks. all: every task (ADMIN).
      ...(scope === 'all' ? {} : { profileId: user.id }),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...dueDateFilter,
    };

    const orderBy: Prisma.TaskOrderByWithRelationInput = { [sortBy]: order };

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map((task) => this.toTaskResponse(task)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<TaskResponse> {
    const task = await this.getTaskOrThrow(id);
    this.assertOwnership(task, user);

    return this.toTaskResponse(task);
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    user: AuthenticatedUser,
  ): Promise<TaskResponse> {
    const task = await this.getTaskOrThrow(id);
    this.assertOwnership(task, user);

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        priority: dto.priority,
        // Attachments are only touched when the client explicitly sends a
        // new list - omitting the field leaves existing attachments as-is;
        // sending it replaces them entirely.
        ...(dto.attachments
          ? {
              attachments: {
                deleteMany: {},
                create: dto.attachments.map((url) => ({
                  url,
                  fileType: resolveFileType(url),
                })),
              },
            }
          : {}),
      },
      include: TASK_INCLUDE,
    });

    return this.toTaskResponse(updated);
  }

  async updateMany(
    ids: string[],
    patch: UpdateTasksBatchPatch,
    user: AuthenticatedUser,
  ): Promise<{ updatedIds: string[] }> {
    const uniqueIds = [...new Set(ids)];

    const found = await this.prisma.task.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, profileId: true },
    });

    if (found.length !== uniqueIds.length) {
      throw new NotFoundException('One or more tasks were not found.');
    }

    if (user.role !== Role.ADMIN) {
      const forbidden = found.some((task) => task.profileId !== user.id);
      if (forbidden) {
        throw new ForbiddenException(
          'You do not have permission to update one or more of these tasks.',
        );
      }
    }

    const updatedIds = found.map((task) => task.id);

    const { count } = await this.prisma.task.updateMany({
      where: { id: { in: updatedIds } },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
        ...(patch.dueDate !== undefined
          ? { dueDate: new Date(patch.dueDate) }
          : {}),
      },
    });

    if (count !== updatedIds.length) {
      throw new NotFoundException('One or more tasks were not found.');
    }

    return { updatedIds };
  }

  async duplicate(id: string, user: AuthenticatedUser): Promise<TaskResponse> {
    const task = await this.getTaskOrThrow(id);
    this.assertOwnership(task, user);

    const created = await this.prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ?? undefined,
        priority: task.priority,
        status: TaskStatus.PENDING,
        profileId: user.id,
      },
      include: TASK_INCLUDE,
    });

    return this.toTaskResponse(created);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ id: string }> {
    const task = await this.getTaskOrThrow(id);
    this.assertOwnership(task, user);

    // Attachment rows cascade-delete via the Task -> Attachment relation.
    await this.prisma.task.delete({ where: { id } });

    return { id };
  }

  async removeMany(
    ids: string[],
    user: AuthenticatedUser,
  ): Promise<{ deletedIds: string[] }> {
    const uniqueIds = [...new Set(ids)];

    const found = await this.prisma.task.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, profileId: true },
    });

    if (found.length !== uniqueIds.length) {
      throw new NotFoundException(
        'One or more tasks were not found.',
      );
    }

    if (user.role !== Role.ADMIN) {
      const forbidden = found.some((task) => task.profileId !== user.id);
      if (forbidden) {
        throw new ForbiddenException(
          'You do not have permission to delete one or more of these tasks.',
        );
      }
    }

    const deletedIds = found.map((task) => task.id);

    const { count } = await this.prisma.task.deleteMany({
      where: { id: { in: deletedIds } },
    });

    if (count !== deletedIds.length) {
      throw new NotFoundException('One or more tasks were not found.');
    }

    return { deletedIds };
  }

  // Admin-only aggregate view (see TasksController's RolesGuard-protected route).
  async getStatusSummary(): Promise<TaskStatusSummary> {
    const groups = await this.prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const summary = Object.values(TaskStatus).reduce<TaskStatusSummary>(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as TaskStatusSummary,
    );

    for (const group of groups) {
      summary[group.status] = group._count._all;
    }

    return summary;
  }

  private async getTaskOrThrow(id: string): Promise<TaskWithRelations> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: TASK_INCLUDE,
    });

    if (!task) {
      throw new NotFoundException(`Task "${id}" not found.`);
    }

    return task;
  }

  // ADMIN has unrestricted access; COMMON may only act on tasks it owns.
  private assertOwnership(task: Task, user: AuthenticatedUser): void {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (task.profileId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this task.',
      );
    }
  }

  private buildDueDateFilter(
    unscheduled?: boolean,
    dueAfter?: string,
    dueBefore?: string,
  ): Pick<Prisma.TaskWhereInput, 'dueDate'> {
    if (unscheduled === true) {
      return { dueDate: null };
    }

    const range: Prisma.DateTimeNullableFilter = {};
    if (dueAfter) {
      range.gte = this.startOfDay(dueAfter);
    }
    if (dueBefore) {
      range.lte = this.endOfDay(dueBefore);
    }

    if (Object.keys(range).length === 0) {
      return {};
    }

    return { dueDate: range };
  }

  /** Start of the calendar day in UTC for a date/datetime string. */
  private startOfDay(iso: string): Date {
    const d = new Date(iso);
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
    );
  }

  /** End of the calendar day in UTC for a date/datetime string. */
  private endOfDay(iso: string): Date {
    const d = new Date(iso);
    return new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  }

  private buildAttachmentsCreateInput(
    urls: string[] | undefined,
  ): Prisma.AttachmentCreateNestedManyWithoutTaskInput | undefined {
    if (!urls || urls.length === 0) {
      return undefined;
    }

    return {
      create: urls.map((url) => ({ url, fileType: resolveFileType(url) })),
    };
  }

  private toTaskResponse(task: TaskWithRelations): TaskResponse {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      profileId: task.profileId,
      user: {
        id: task.profile.id,
        name: task.profile.name,
        avatarUrl: task.profile.avatarUrl,
      },
      attachments: task.attachments.map((attachment) => ({
        id: attachment.id,
        url: attachment.url,
        fileType: attachment.fileType,
        createdAt: attachment.createdAt,
      })),
    };
  }
}
