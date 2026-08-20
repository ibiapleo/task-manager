import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseAuthGuard } from '../src/auth/guards/supabase-auth.guard';
import { SupabaseAdminService } from '../src/auth/supabase-admin.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { applyGlobalPipes } from './utils/apply-global-pipes';
import { buildMockAuthGuard } from './utils/mock-auth-guard';
import { buildMockProfile, MOCK_USER_ID } from './utils/mock-profile';

// PrismaService is fully mocked (see prismaMock below) instead of hitting a
// real database - this keeps every test isolated by construction (no shared
// state to reset/clean between runs) and hermetic (no network dependency on
// Supabase's Postgres or JWKS endpoint). Auth is simulated by overriding
// SupabaseAuthGuard (see test/utils/mock-auth-guard.ts) instead of forging a
// real Supabase-signed JWT.
describe('Users (e2e)', () => {
  const mockProfile = buildMockProfile();
  const targetUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  const prismaMock = {
    profile: {
      findUnique: jest.fn().mockResolvedValue(mockProfile),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const supabaseAdminMock = {
    purgeUserStorage: jest.fn().mockResolvedValue(undefined),
    deleteAuthUser: jest.fn().mockResolvedValue(undefined),
  };

  describe('without a valid token', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(prismaMock)
        .overrideProvider(SupabaseAdminService)
        .useValue(supabaseAdminMock)
        .compile();

      app = moduleFixture.createNestApplication();
      applyGlobalPipes(app);
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /auth/me returns 401 when no access token is sent', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('PATCH /users/me returns 401 when no access token is sent', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .send({ name: 'Ada Lovelace' })
        .expect(401);
    });

    it('DELETE /users/:id returns 401 when no access token is sent', () => {
      return request(app.getHttpServer())
        .delete(`/users/${targetUserId}`)
        .expect(401);
    });
  });

  describe('with a valid (mocked) COMMON token', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(prismaMock)
        .overrideProvider(SupabaseAdminService)
        .useValue(supabaseAdminMock)
        .overrideGuard(SupabaseAuthGuard)
        .useValue(buildMockAuthGuard(mockProfile))
        .compile();

      app = moduleFixture.createNestApplication();
      applyGlobalPipes(app);
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    // GET /users/me was intentionally removed - @CurrentUser() already
    // injects the full, up-to-date Profile resolved by SupabaseJwtStrategy,
    // so GET /auth/me is the single canonical route to read it.
    describe('GET /auth/me', () => {
      it('returns 200 with the authenticated profile', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', 'Bearer valid-mocked-token')
          .expect(200);

        expect(response.body).toEqual(
          expect.objectContaining({
            id: mockProfile.id,
            email: mockProfile.email,
            role: 'COMMON',
            preferences: mockProfile.preferences,
          }),
        );
      });
    });

    describe('PATCH /users/me', () => {
      it('updates avatarUrl and merges only the provided preference fields', async () => {
        prismaMock.profile.update.mockImplementation(
          ({ data }: { data: Prisma.ProfileUpdateInput }) =>
            Promise.resolve({ ...mockProfile, ...data }),
        );

        const response = await request(app.getHttpServer())
          .patch('/users/me')
          .set('Authorization', 'Bearer valid-mocked-token')
          .send({
            avatarUrl:
              'https://vvwszzshoauxnvsgkden.supabase.co/storage/v1/object/public/avatars/11111111-1111-1111-1111-111111111111.png',
            preferences: { theme: 'dark' },
          })
          .expect(200);

        expect(response.body.avatarUrl).toBe(
          'https://vvwszzshoauxnvsgkden.supabase.co/storage/v1/object/public/avatars/11111111-1111-1111-1111-111111111111.png',
        );
        expect(response.body.preferences).toEqual(
          expect.objectContaining({
            theme: 'dark',
            // Untouched fields must be preserved from the current profile.
            accessibility: { highContrast: false, fontSizeMultiplier: 1 },
            localization: {
              dateFormat: 'DD/MM/YYYY',
            },
          }),
        );
        expect(prismaMock.profile.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: mockProfile.id } }),
        );
      });

      it('returns 400 when avatarUrl is not a valid URL', async () => {
        await request(app.getHttpServer())
          .patch('/users/me')
          .set('Authorization', 'Bearer valid-mocked-token')
          .send({ avatarUrl: 'not-a-url' })
          .expect(400);

        expect(prismaMock.profile.update).not.toHaveBeenCalled();
      });

      it('returns 400 when theme is not one of the accepted literal values', async () => {
        await request(app.getHttpServer())
          .patch('/users/me')
          .set('Authorization', 'Bearer valid-mocked-token')
          .send({ preferences: { theme: 'neon' } })
          .expect(400);

        expect(prismaMock.profile.update).not.toHaveBeenCalled();
      });
    });

    describe('DELETE /users/:id', () => {
      it('returns 403 for COMMON users', async () => {
        await request(app.getHttpServer())
          .delete(`/users/${targetUserId}`)
          .set('Authorization', 'Bearer valid-mocked-token')
          .expect(403);

        expect(supabaseAdminMock.purgeUserStorage).not.toHaveBeenCalled();
        expect(supabaseAdminMock.deleteAuthUser).not.toHaveBeenCalled();
        expect(prismaMock.profile.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('with a valid (mocked) ADMIN token', () => {
    let app: INestApplication;
    const adminProfile = buildMockProfile({
      id: MOCK_USER_ID,
      role: Role.ADMIN,
      email: 'admin@example.com',
    });

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(prismaMock)
        .overrideProvider(SupabaseAdminService)
        .useValue(supabaseAdminMock)
        .overrideGuard(SupabaseAuthGuard)
        .useValue(buildMockAuthGuard(adminProfile))
        .compile();

      app = moduleFixture.createNestApplication();
      applyGlobalPipes(app);
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('DELETE /users/:id', () => {
      it('returns 403 when an admin tries to delete themselves', async () => {
        await request(app.getHttpServer())
          .delete(`/users/${adminProfile.id}`)
          .set('Authorization', 'Bearer valid-mocked-token')
          .expect(403);

        expect(supabaseAdminMock.purgeUserStorage).not.toHaveBeenCalled();
        expect(prismaMock.profile.delete).not.toHaveBeenCalled();
      });

      it('returns 400 when the id is not a valid UUID', async () => {
        await request(app.getHttpServer())
          .delete('/users/not-a-uuid')
          .set('Authorization', 'Bearer valid-mocked-token')
          .expect(400);

        expect(supabaseAdminMock.purgeUserStorage).not.toHaveBeenCalled();
        expect(prismaMock.profile.delete).not.toHaveBeenCalled();
      });

      it('returns 404 when the target user does not exist', async () => {
        prismaMock.profile.findUnique.mockResolvedValue(null);

        await request(app.getHttpServer())
          .delete(`/users/${targetUserId}`)
          .set('Authorization', 'Bearer valid-mocked-token')
          .expect(404);

        expect(supabaseAdminMock.purgeUserStorage).not.toHaveBeenCalled();
        expect(supabaseAdminMock.deleteAuthUser).not.toHaveBeenCalled();
        expect(prismaMock.profile.delete).not.toHaveBeenCalled();
      });

      it('returns 200 and purges storage, auth, and profile', async () => {
        const target = buildMockProfile({
          id: targetUserId,
          email: 'victim@example.com',
        });
        prismaMock.profile.findUnique.mockResolvedValue(target);
        prismaMock.profile.delete.mockResolvedValue(target);

        const response = await request(app.getHttpServer())
          .delete(`/users/${targetUserId}`)
          .set('Authorization', 'Bearer valid-mocked-token')
          .expect(200);

        expect(response.body).toEqual({ id: targetUserId });
        expect(supabaseAdminMock.purgeUserStorage).toHaveBeenCalledWith(
          targetUserId,
        );
        expect(supabaseAdminMock.deleteAuthUser).toHaveBeenCalledWith(
          targetUserId,
        );
        expect(prismaMock.profile.delete).toHaveBeenCalledWith({
          where: { id: targetUserId },
        });
      });
    });
  });
});
