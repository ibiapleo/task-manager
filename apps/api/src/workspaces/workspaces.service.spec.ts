import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, Workspace } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_WORKSPACE_NAME } from './workspace.constants';
import { WorkspacesService } from './workspaces.service';

type MockPrismaService = {
  workspace: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
};

const OWNER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const WORKSPACE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const OTHER_WORKSPACE_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

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

function buildWorkspace(
  overrides: Partial<Workspace> & { taskCount?: number } = {},
): Workspace & { _count: { tasks: number } } {
  const { taskCount = 0, ...rest } = overrides;
  return {
    id: WORKSPACE_ID,
    name: DEFAULT_WORKSPACE_NAME,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    profileId: OWNER_ID,
    ...rest,
    _count: { tasks: taskCount },
  };
}

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = {
      workspace: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (arg: unknown) => {
        if (typeof arg === 'function') {
          return (arg as (tx: MockPrismaService) => unknown)(prisma);
        }
        return Promise.all(arg as Promise<unknown>[]);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('trims the name before persisting', async () => {
      prisma.workspace.count.mockResolvedValue(1);
      prisma.workspace.findFirst.mockResolvedValue(null);
      const created = buildWorkspace({ name: 'Trabalho' });
      prisma.workspace.create.mockResolvedValue(created);

      const result = await service.create({ name: '  Trabalho  ' }, ownerUser);

      expect(prisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Trabalho',
            profileId: OWNER_ID,
          }),
        }),
      );
      expect(result.name).toBe('Trabalho');
    });

    it('rejects a duplicate name case-insensitively', async () => {
      prisma.workspace.count.mockResolvedValue(1);
      prisma.workspace.findFirst.mockResolvedValue(
        buildWorkspace({ name: 'Trabalho' }),
      );

      await expect(
        service.create({ name: 'trabalho' }, ownerUser),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.workspace.create).not.toHaveBeenCalled();
    });

    it('rejects creating more than 20 workspaces', async () => {
      prisma.workspace.count.mockResolvedValue(20);

      await expect(
        service.create({ name: 'Extra' }, ownerUser),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.workspace.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('creates a default Geral workspace when the user has none', async () => {
      const created = buildWorkspace({ name: DEFAULT_WORKSPACE_NAME });
      prisma.workspace.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([created]);
      prisma.workspace.create.mockResolvedValue(created);

      const result = await service.findAll(ownerUser);

      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: { name: DEFAULT_WORKSPACE_NAME, profileId: OWNER_ID },
      });
      expect(result).toEqual([
        expect.objectContaining({ name: DEFAULT_WORKSPACE_NAME, taskCount: 0 }),
      ]);
    });

    it('returns existing workspaces without creating another default', async () => {
      const existing = buildWorkspace({ name: 'Trabalho', taskCount: 3 });
      prisma.workspace.findMany.mockResolvedValue([existing]);

      const result = await service.findAll(ownerUser);

      expect(prisma.workspace.create).not.toHaveBeenCalled();
      expect(result[0]).toEqual(
        expect.objectContaining({ name: 'Trabalho', taskCount: 3 }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the workspace does not exist', async () => {
      prisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.update(WORKSPACE_ID, { name: 'Novo' }, ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });

    it('prevents renaming a workspace owned by someone else', async () => {
      prisma.workspace.findUnique.mockResolvedValue(
        buildWorkspace({ profileId: OTHER_USER_ID }),
      );

      await expect(
        service.update(WORKSPACE_ID, { name: 'Novo' }, ownerUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });

    it('rejects a duplicate name on rename', async () => {
      prisma.workspace.findUnique.mockResolvedValue(buildWorkspace());
      prisma.workspace.findFirst.mockResolvedValue(
        buildWorkspace({ id: OTHER_WORKSPACE_ID, name: 'Trabalho' }),
      );

      await expect(
        service.update(WORKSPACE_ID, { name: 'Trabalho' }, ownerUser),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('rejects deleting the last remaining workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(buildWorkspace());
      prisma.workspace.count.mockResolvedValue(1);

      await expect(
        service.remove(WORKSPACE_ID, ownerUser),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.workspace.delete).not.toHaveBeenCalled();
    });

    it('prevents deleting a workspace owned by someone else', async () => {
      prisma.workspace.findUnique.mockResolvedValue(
        buildWorkspace({ profileId: OTHER_USER_ID }),
      );

      await expect(
        service.remove(WORKSPACE_ID, ownerUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.workspace.delete).not.toHaveBeenCalled();
    });

    it('deletes an owned workspace when more than one remains', async () => {
      prisma.workspace.findUnique.mockResolvedValue(buildWorkspace());
      prisma.workspace.count.mockResolvedValue(2);
      prisma.workspace.delete.mockResolvedValue(buildWorkspace());

      const result = await service.remove(WORKSPACE_ID, ownerUser);

      expect(result).toEqual({ id: WORKSPACE_ID });
      expect(prisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: WORKSPACE_ID },
      });
    });
  });

  describe('assertOwnedWorkspace', () => {
    it('allows a caller to use their own workspace', async () => {
      prisma.workspace.findUnique.mockResolvedValue(buildWorkspace());

      await expect(
        service.assertOwnedWorkspace(WORKSPACE_ID, OWNER_ID),
      ).resolves.toBeUndefined();
    });

    it('rejects a workspace owned by someone else', async () => {
      prisma.workspace.findUnique.mockResolvedValue(
        buildWorkspace({ profileId: OTHER_USER_ID }),
      );

      await expect(
        service.assertOwnedWorkspace(WORKSPACE_ID, OWNER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  it('does not leak another user workspace to a COMMON caller via findAll', async () => {
    prisma.workspace.findMany.mockResolvedValue([buildWorkspace()]);

    await service.findAll(otherCommonUser);

    expect(prisma.workspace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profileId: OTHER_USER_ID },
      }),
    );
  });
});
