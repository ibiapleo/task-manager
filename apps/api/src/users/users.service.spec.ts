import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Profile, Role } from '@prisma/client';
import { SupabaseAdminService } from '../auth/supabase-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { Theme } from './dto/theme.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

type MockPrismaService = {
  profile: {
    findUnique: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
  };
  $transaction: jest.Mock;
};

type MockSupabaseAdminService = {
  purgeUserStorage: jest.Mock;
  deleteAuthUser: jest.Mock;
};

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ACTOR_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: USER_ID,
    email: 'user@example.com',
    name: null,
    avatarUrl: null,
    role: Role.COMMON,
    preferences: {
      theme: 'light',
      accessibility: { highContrast: false, fontSizeMultiplier: 1 },
      localization: { dateFormat: 'DD/MM/YYYY' },
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrismaService;
  let supabaseAdmin: MockSupabaseAdminService;

  beforeEach(async () => {
    prisma = {
      profile: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    supabaseAdmin = {
      purgeUserStorage: jest.fn().mockResolvedValue(undefined),
      deleteAuthUser: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: SupabaseAdminService, useValue: supabaseAdmin },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('throws NotFoundException when the profile does not exist', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the mapped profile, falling back to default preferences when null', async () => {
      const profile = buildProfile({ preferences: null });
      prisma.profile.findUnique.mockResolvedValue(profile);

      const result = await service.findById(USER_ID);

      expect(result.id).toBe(USER_ID);
      expect(result.preferences.theme).toBe(Theme.LIGHT);
      expect(result.preferences.accessibility.fontSizeMultiplier).toBe(1);
    });
  });

  describe('updateProfile', () => {
    it('merges only the provided preference fields, keeping the rest untouched', async () => {
      const profile = buildProfile({
        preferences: {
          theme: 'dark',
          accessibility: { highContrast: true, fontSizeMultiplier: 1.5 },
          localization: {
            dateFormat: 'DD/MM/YYYY',
          },
        },
      });
      prisma.profile.findUnique.mockResolvedValue(profile);
      prisma.profile.update.mockImplementation(({ data }) =>
        Promise.resolve({ ...profile, ...data }),
      );

      const dto: UpdateProfileDto = {
        preferences: { theme: Theme.RETRO },
      };

      const result = await service.updateProfile(USER_ID, dto);

      expect(result.preferences.theme).toBe(Theme.RETRO);
      expect(result.preferences.accessibility.highContrast).toBe(true);
      expect(result.preferences.accessibility.fontSizeMultiplier).toBe(1.5);
      expect(prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: USER_ID } }),
      );
    });

    it('does not overwrite name/avatarUrl when not sent', async () => {
      const profile = buildProfile({ name: 'Ada Lovelace' });
      prisma.profile.findUnique.mockResolvedValue(profile);
      prisma.profile.update.mockImplementation(({ data }) =>
        Promise.resolve({ ...profile, ...data }),
      );

      await service.updateProfile(USER_ID, {});

      expect(prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: undefined,
            avatarUrl: undefined,
          }),
        }),
      );
    });
  });

  describe('updateRole', () => {
    it('throws NotFoundException when the target user does not exist', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole('missing-id', { role: Role.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.profile.update).not.toHaveBeenCalled();
    });

    it('updates the role when the user exists', async () => {
      const profile = buildProfile();
      prisma.profile.findUnique.mockResolvedValue(profile);
      prisma.profile.update.mockResolvedValue({
        ...profile,
        role: Role.ADMIN,
      });

      const result = await service.updateRole(USER_ID, { role: Role.ADMIN });

      expect(result.role).toBe(Role.ADMIN);
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { role: Role.ADMIN },
      });
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException when the actor tries to delete themselves', async () => {
      await expect(service.remove(ACTOR_ID, ACTOR_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(supabaseAdmin.purgeUserStorage).not.toHaveBeenCalled();
      expect(supabaseAdmin.deleteAuthUser).not.toHaveBeenCalled();
      expect(prisma.profile.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the target user does not exist', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('missing-id', ACTOR_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(supabaseAdmin.purgeUserStorage).not.toHaveBeenCalled();
      expect(supabaseAdmin.deleteAuthUser).not.toHaveBeenCalled();
      expect(prisma.profile.delete).not.toHaveBeenCalled();
    });

    it('purges storage, deletes auth user, then deletes the profile', async () => {
      const profile = buildProfile();
      prisma.profile.findUnique.mockResolvedValue(profile);
      prisma.profile.delete.mockResolvedValue(profile);

      const result = await service.remove(USER_ID, ACTOR_ID);

      expect(result).toEqual({ id: USER_ID });
      expect(supabaseAdmin.purgeUserStorage).toHaveBeenCalledWith(USER_ID);
      expect(supabaseAdmin.deleteAuthUser).toHaveBeenCalledWith(USER_ID);
      expect(prisma.profile.delete).toHaveBeenCalledWith({
        where: { id: USER_ID },
      });
      expect(
        supabaseAdmin.purgeUserStorage.mock.invocationCallOrder[0],
      ).toBeLessThan(supabaseAdmin.deleteAuthUser.mock.invocationCallOrder[0]);
      expect(
        supabaseAdmin.deleteAuthUser.mock.invocationCallOrder[0],
      ).toBeLessThan(prisma.profile.delete.mock.invocationCallOrder[0]);
    });

    it('does not delete auth or profile when storage purge fails', async () => {
      const profile = buildProfile();
      prisma.profile.findUnique.mockResolvedValue(profile);
      supabaseAdmin.purgeUserStorage.mockRejectedValue(
        new Error('storage down'),
      );

      await expect(service.remove(USER_ID, ACTOR_ID)).rejects.toThrow(
        'storage down',
      );
      expect(supabaseAdmin.deleteAuthUser).not.toHaveBeenCalled();
      expect(prisma.profile.delete).not.toHaveBeenCalled();
    });

    it('does not delete the profile when auth delete fails', async () => {
      const profile = buildProfile();
      prisma.profile.findUnique.mockResolvedValue(profile);
      supabaseAdmin.deleteAuthUser.mockRejectedValue(new Error('auth down'));

      await expect(service.remove(USER_ID, ACTOR_ID)).rejects.toThrow(
        'auth down',
      );
      expect(supabaseAdmin.purgeUserStorage).toHaveBeenCalledWith(USER_ID);
      expect(prisma.profile.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns a paginated result', async () => {
      const profiles = [buildProfile()];
      prisma.$transaction.mockResolvedValue([profiles, 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('applies a case-insensitive search on name and email', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, search: 'ana' });

      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'ana', mode: 'insensitive' } },
              { email: { contains: 'ana', mode: 'insensitive' } },
            ],
          },
        }),
      );
      expect(prisma.profile.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'ana', mode: 'insensitive' } },
            { email: { contains: 'ana', mode: 'insensitive' } },
          ],
        },
      });
    });
  });
});
