import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseAuthGuard } from '../src/auth/guards/supabase-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import { DEFAULT_WORKSPACE_NAME } from '../src/workspaces/workspace.constants';
import { applyGlobalPipes } from './utils/apply-global-pipes';
import { buildMockAuthGuard } from './utils/mock-auth-guard';
import { buildMockProfile } from './utils/mock-profile';

describe('Workspaces (e2e)', () => {
  const mockProfile = buildMockProfile();
  const workspaceId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const now = new Date('2026-01-01T00:00:00.000Z');

  const ownedWorkspace = {
    id: workspaceId,
    name: DEFAULT_WORKSPACE_NAME,
    createdAt: now,
    updatedAt: now,
    profileId: mockProfile.id,
    _count: { tasks: 0 },
  };

  const prismaMock = {
    profile: {
      findUnique: jest.fn().mockResolvedValue(mockProfile),
      create: jest.fn().mockResolvedValue(mockProfile),
    },
    workspace: {
      findMany: jest.fn().mockResolvedValue([ownedWorkspace]),
      findUnique: jest.fn().mockResolvedValue(ownedWorkspace),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn(),
  };

  prismaMock.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: typeof prismaMock) => unknown)(prismaMock);
    }
    return Promise.all(arg as Promise<unknown>[]);
  });

  describe('without a valid token', () => {
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
      return request(app.getHttpServer()).get('/workspaces').expect(401);
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
      prismaMock.workspace.findMany.mockResolvedValue([ownedWorkspace]);
      prismaMock.workspace.findUnique.mockResolvedValue(ownedWorkspace);
      prismaMock.workspace.findFirst.mockResolvedValue(null);
      prismaMock.workspace.count.mockResolvedValue(1);
      prismaMock.$transaction.mockImplementation((arg: unknown) => {
        if (typeof arg === 'function') {
          return (arg as (tx: typeof prismaMock) => unknown)(prismaMock);
        }
        return Promise.all(arg as Promise<unknown>[]);
      });
    });

    it('GET /workspaces returns 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/workspaces')
        .set('Authorization', 'Bearer valid-mocked-token')
        .expect(200);

      expect(response.body).toEqual([
        expect.objectContaining({
          id: workspaceId,
          name: DEFAULT_WORKSPACE_NAME,
          taskCount: 0,
        }),
      ]);
    });

    it('POST /workspaces creates a workspace', async () => {
      const created = {
        ...ownedWorkspace,
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        name: 'Trabalho',
      };
      prismaMock.workspace.create.mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/workspaces')
        .set('Authorization', 'Bearer valid-mocked-token')
        .send({ name: 'Trabalho' })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({ name: 'Trabalho', taskCount: 0 }),
      );
    });

    it('POST /workspaces returns 400 when the name is empty', async () => {
      await request(app.getHttpServer())
        .post('/workspaces')
        .set('Authorization', 'Bearer valid-mocked-token')
        .send({ name: '' })
        .expect(400);

      expect(prismaMock.workspace.create).not.toHaveBeenCalled();
    });

    it('DELETE /workspaces/:id returns 409 when it is the last workspace', async () => {
      prismaMock.workspace.count.mockResolvedValue(1);

      await request(app.getHttpServer())
        .delete(`/workspaces/${workspaceId}`)
        .set('Authorization', 'Bearer valid-mocked-token')
        .expect(409);

      expect(prismaMock.workspace.delete).not.toHaveBeenCalled();
    });
  });
});
