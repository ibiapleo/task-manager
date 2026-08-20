import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Workspace } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceResponse } from './interfaces/workspace-response.interface';
import {
  DEFAULT_WORKSPACE_NAME,
  MAX_WORKSPACES_PER_PROFILE,
} from './workspace.constants';

const WORKSPACE_INCLUDE = {
  _count: { select: { tasks: true } },
} satisfies Prisma.WorkspaceInclude;

type WorkspaceWithCount = Workspace & {
  _count: { tasks: number };
};

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser): Promise<WorkspaceResponse[]> {
    const existing = await this.listByProfile(user.id);
    if (existing.length > 0) {
      return existing.map((workspace) => this.toWorkspaceResponse(workspace));
    }

    return this.prisma.$transaction(async (tx) => {
      const inside = await this.listByProfile(user.id, tx);
      if (inside.length > 0) {
        return inside.map((workspace) => this.toWorkspaceResponse(workspace));
      }

      try {
        await tx.workspace.create({
          data: { name: DEFAULT_WORKSPACE_NAME, profileId: user.id },
        });
      } catch (error) {
        if (!(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )) {
          throw error;
        }
      }

      const after = await this.listByProfile(user.id, tx);
      return after.map((workspace) => this.toWorkspaceResponse(workspace));
    });
  }

  async create(
    dto: CreateWorkspaceDto,
    user: AuthenticatedUser,
  ): Promise<WorkspaceResponse> {
    const name = dto.name.trim();

    const count = await this.prisma.workspace.count({
      where: { profileId: user.id },
    });
    if (count >= MAX_WORKSPACES_PER_PROFILE) {
      throw new BadRequestException(
        `Você pode ter no máximo ${MAX_WORKSPACES_PER_PROFILE} espaços.`,
      );
    }

    await this.assertUniqueName(user.id, name);

    try {
      const workspace = await this.prisma.workspace.create({
        data: { name, profileId: user.id },
        include: WORKSPACE_INCLUDE,
      });
      return this.toWorkspaceResponse(workspace);
    } catch (error) {
      return this.rethrowUniqueConflict(error);
    }
  }

  async update(
    id: string,
    dto: UpdateWorkspaceDto,
    user: AuthenticatedUser,
  ): Promise<WorkspaceResponse> {
    await this.getOwnedOrThrow(id, user.id);

    if (dto.name === undefined) {
      const current = await this.prisma.workspace.findUniqueOrThrow({
        where: { id },
        include: WORKSPACE_INCLUDE,
      });
      return this.toWorkspaceResponse(current);
    }

    const name = dto.name.trim();
    await this.assertUniqueName(user.id, name, id);

    try {
      const updated = await this.prisma.workspace.update({
        where: { id },
        data: { name },
        include: WORKSPACE_INCLUDE,
      });
      return this.toWorkspaceResponse(updated);
    } catch (error) {
      return this.rethrowUniqueConflict(error);
    }
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ id: string }> {
    await this.getOwnedOrThrow(id, user.id);

    const count = await this.prisma.workspace.count({
      where: { profileId: user.id },
    });
    if (count <= 1) {
      throw new ConflictException('Você precisa manter pelo menos um espaço.');
    }

    await this.prisma.workspace.delete({ where: { id } });
    return { id };
  }

  async assertOwnedWorkspace(
    workspaceId: string,
    profileId: string,
  ): Promise<void> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace "${workspaceId}" not found.`);
    }

    if (workspace.profileId !== profileId) {
      throw new ForbiddenException(
        'You do not have permission to access this workspace.',
      );
    }
  }

  private async getOwnedOrThrow(
    id: string,
    profileId: string,
  ): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace "${id}" not found.`);
    }

    if (workspace.profileId !== profileId) {
      throw new ForbiddenException(
        'You do not have permission to access this workspace.',
      );
    }

    return workspace;
  }

  private async assertUniqueName(
    profileId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.prisma.workspace.findFirst({
      where: {
        profileId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (duplicate) {
      throw new ConflictException('Você já tem um espaço com esse nome.');
    }
  }

  private listByProfile(
    profileId: string,
    client: DbClient = this.prisma,
  ): Promise<WorkspaceWithCount[]> {
    return client.workspace.findMany({
      where: { profileId },
      include: WORKSPACE_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  private rethrowUniqueConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Você já tem um espaço com esse nome.');
    }
    throw error;
  }

  private toWorkspaceResponse(
    workspace: WorkspaceWithCount,
  ): WorkspaceResponse {
    return {
      id: workspace.id,
      name: workspace.name,
      taskCount: workspace._count.tasks,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }
}
