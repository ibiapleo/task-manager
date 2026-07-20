import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseAuthGuard } from '../src/auth/guards/supabase-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import { applyGlobalPipes } from './utils/apply-global-pipes';
import { buildMockAuthGuard } from './utils/mock-auth-guard';
import { buildMockProfile } from './utils/mock-profile';

// PrismaService is fully mocked (see prismaMock below) instead of hitting a
// real database - this keeps every test isolated by construction (no shared
// state to reset/clean between runs) and hermetic (no network dependency on
// Supabase's Postgres or JWKS endpoint). Auth is simulated by overriding
// SupabaseAuthGuard (see test/utils/mock-auth-guard.ts) instead of forging a
// real Supabase-signed JWT.
describe('Tasks (e2e)', () => {
  const mockProfile = buildMockProfile();

  const prismaMock = {
    profile: {
      findUnique: jest.fn().mockResolvedValue(mockProfile),
      create: jest.fn().mockResolvedValue(mockProfile),
    },
    task: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  describe('GET /tasks - without a valid token', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(prismaMock)
        .compile();

      app = moduleFixture.createNestApplication();
      applyGlobalPipes(app);
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 401 when no access token is sent', () => {
      return request(app.getHttpServer()).get('/tasks').expect(401);
    });

    it('returns 401 when the token is malformed', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });

  describe('with a valid (mocked) token', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(prismaMock)
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

    describe('GET /tasks', () => {
      it('returns 200 with a paginated list', async () => {
        const response = await request(app.getHttpServer())
          .get('/tasks')
          .set('Authorization', 'Bearer valid-mocked-token')
          .expect(200);

        expect(response.body).toEqual(
          expect.objectContaining({
            data: [],
            meta: expect.objectContaining({ page: 1, limit: 20, total: 0 }),
          }),
        );
      });

      it('accepts dueAfter/dueBefore and unscheduled query filters', async () => {
        await request(app.getHttpServer())
          .get('/tasks')
          .query({ dueAfter: '2026-07-01', dueBefore: '2026-07-31' })
          .set('Authorization', 'Bearer valid-mocked-token')
          .expect(200);

        expect(prismaMock.task.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              dueDate: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date),
              }),
            }),
          }),
        );

        jest.clearAllMocks();
        prismaMock.task.findMany.mockResolvedValue([]);
        prismaMock.task.count.mockResolvedValue(0);
        prismaMock.$transaction.mockImplementation(
          (operations: Promise<unknown>[]) => Promise.all(operations),
        );

        await request(app.getHttpServer())
          .get('/tasks')
          .query({ unscheduled: 'true' })
          .set('Authorization', 'Bearer valid-mocked-token')
          .expect(200);

        expect(prismaMock.task.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ dueDate: null }),
          }),
        );
      });
    });

    describe('POST /tasks', () => {
      it('creates a task owned by the authenticated user', async () => {
        const createdTask = {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'Write the E2E tests',
          description: null,
          dueDate: null,
          status: 'PENDING',
          priority: 'MEDIUM',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          profileId: mockProfile.id,
          attachments: [],
          profile: {
            id: mockProfile.id,
            name: mockProfile.name,
            email: mockProfile.email,
          },
        };
        prismaMock.task.create.mockResolvedValue(createdTask);

        const response = await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', 'Bearer valid-mocked-token')
          .send({ title: 'Write the E2E tests' })
          .expect(201);

        expect(response.body).toEqual(
          expect.objectContaining({
            title: 'Write the E2E tests',
            profileId: mockProfile.id,
          }),
        );
        expect(prismaMock.task.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ profileId: mockProfile.id }),
          }),
        );
      });

      it('returns 400 when the body fails validation', async () => {
        await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', 'Bearer valid-mocked-token')
          .send({ title: '' })
          .expect(400);

        expect(prismaMock.task.create).not.toHaveBeenCalled();
      });
    });
  });
});
