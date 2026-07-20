import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Attachment, Priority, Role, Task, TaskStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './tasks.service';

type MockPrismaService = {
  task: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
};

const OWNER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ADMIN_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

// AuthenticatedUser is the full Profile entity (see
// authenticated-user.interface.ts), so fixtures must include every column.
function buildAuthenticatedUser(
  overrides: Partial<AuthenticatedUser>,
): AuthenticatedUser {
  return {
    name: null,
    avatarUrl: null,
    preferences: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as AuthenticatedUser;
}

const ownerUser: AuthenticatedUser = buildAuthenticatedUser({
  id: OWNER_ID,
  email: 'owner@example.com',
  role: Role.COMMON,
});

const otherCommonUser: AuthenticatedUser = buildAuthenticatedUser({
  id: OTHER_USER_ID,
  email: 'other@example.com',
  role: Role.COMMON,
});

const adminUser: AuthenticatedUser = buildAuthenticatedUser({
  id: ADMIN_ID,
  email: 'admin@example.com',
  role: Role.ADMIN,
});

function buildTask(overrides: Partial<Task> = {}): Task & {
  attachments: Attachment[];
  profile: { id: string; name: string | null; avatarUrl: string | null };
} {
  const profileId = overrides.profileId ?? OWNER_ID;
  return {
    id: 'task-1',
    title: 'Sample task',
    description: null,
    dueDate: null,
    status: TaskStatus.PENDING,
    priority: Priority.MEDIUM,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    profileId,
    attachments: [],
    profile: {
      id: profileId,
      name: null,
      avatarUrl: null,
    },
    ...overrides,
  };
}

describe('TasksService', () => {
  let service: TasksService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('persists the profileId of the authenticated user, not a client-supplied value', async () => {
      const dto: CreateTaskDto = { title: 'New task' };
      const created = buildTask({ title: dto.title, profileId: ownerUser.id });
      prisma.task.create.mockResolvedValue(created);

      const result = await service.create(dto, ownerUser);

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ profileId: ownerUser.id }),
        }),
      );
      expect(result.profileId).toBe(ownerUser.id);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the task does not exist', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('missing-id', ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('prevents a COMMON user from deleting a task owned by someone else', async () => {
      const task = buildTask({ profileId: OTHER_USER_ID });
      prisma.task.findUnique.mockResolvedValue(task);

      await expect(service.remove(task.id, ownerUser)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('allows a COMMON user to delete their own task', async () => {
      const task = buildTask({ profileId: ownerUser.id });
      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.delete.mockResolvedValue(task);

      const result = await service.remove(task.id, ownerUser);

      expect(result).toEqual({ id: task.id });
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: task.id },
      });
    });

    it('allows an ADMIN to delete any task, regardless of owner', async () => {
      const task = buildTask({ profileId: OTHER_USER_ID });
      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.delete.mockResolvedValue(task);

      const result = await service.remove(task.id, adminUser);

      expect(result).toEqual({ id: task.id });
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: task.id },
      });
    });

    it('is consistent for two different COMMON users on the same foreign task', async () => {
      const task = buildTask({ profileId: OWNER_ID });
      prisma.task.findUnique.mockResolvedValue(task);

      await expect(
        service.remove(task.id, otherCommonUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('prevents a COMMON user from updating a task owned by someone else', async () => {
      const task = buildTask({ profileId: OTHER_USER_ID });
      prisma.task.findUnique.mockResolvedValue(task);

      await expect(
        service.update(task.id, { title: 'Hacked title' }, ownerUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('allows an ADMIN to update any task, regardless of owner', async () => {
      const task = buildTask({ profileId: OTHER_USER_ID });
      const updated = { ...task, title: 'Updated by admin' };
      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.update.mockResolvedValue(updated);

      const result = await service.update(
        task.id,
        { title: 'Updated by admin' },
        adminUser,
      );

      expect(result.title).toBe('Updated by admin');
      expect(prisma.task.update).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      prisma.$transaction.mockImplementation(
        (operations: Promise<unknown>[]) => Promise.all(operations),
      );
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);
    });

    it('filters COMMON users to their own tasks by default (scope=personal)', async () => {
      await service.findAll({}, ownerUser);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            profileId: OWNER_ID,
          }),
        }),
      );
    });

    it('rejects COMMON users requesting scope=all', async () => {
      await expect(
        service.findAll({ scope: 'all' }, ownerUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.task.findMany).not.toHaveBeenCalled();
    });

    it('filters ADMIN to their own tasks when scope=personal', async () => {
      await service.findAll({ scope: 'personal' }, adminUser);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            profileId: ADMIN_ID,
          }),
        }),
      );
    });

    it('lists every task for ADMIN when scope=all', async () => {
      await service.findAll({ scope: 'all' }, adminUser);

      const call = prisma.task.findMany.mock.calls[0][0] as {
        where: Record<string, unknown>;
      };
      expect(call.where).not.toHaveProperty('profileId');
    });

    it('filters unscheduled tasks when unscheduled=true (ignores dueAfter/dueBefore)', async () => {
      await service.findAll(
        {
          unscheduled: true,
          dueAfter: '2026-07-01',
          dueBefore: '2026-07-31',
        },
        ownerUser,
      );

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            profileId: OWNER_ID,
            dueDate: null,
          }),
        }),
      );
    });

    it('applies inclusive dueAfter/dueBefore day bounds on dueDate', async () => {
      await service.findAll(
        { dueAfter: '2026-07-01', dueBefore: '2026-07-31' },
        ownerUser,
      );

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: {
              gte: new Date(Date.UTC(2026, 6, 1, 0, 0, 0, 0)),
              lte: new Date(Date.UTC(2026, 6, 31, 23, 59, 59, 999)),
            },
          }),
        }),
      );
    });
  });
});
