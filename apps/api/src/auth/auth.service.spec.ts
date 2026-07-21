import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

const mockSignUp = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: mockSignUp,
    },
  })),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    mockSignUp.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'SUPABASE_URL') return 'https://example.supabase.co';
              if (key === 'SUPABASE_ANON_KEY') return 'anon-key';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('returns session tokens when Supabase creates a session', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: {
          access_token: 'access',
          refresh_token: 'refresh',
        },
      },
      error: null,
    });

    const result = await service.register({
      email: 'voce@suaequipe.com',
      password: 'Senha@Forte1',
    });

    expect(result).toEqual({
      requiresEmailConfirmation: false,
      session: { accessToken: 'access', refreshToken: 'refresh' },
    });
  });

  it('flags e-mail confirmation when no session is returned', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: null,
      },
      error: null,
    });

    const result = await service.register({
      email: 'voce@suaequipe.com',
      password: 'Senha@Forte1',
    });

    expect(result).toEqual({
      requiresEmailConfirmation: true,
      session: null,
    });
  });

  it('maps Supabase errors to BadRequestException', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });

    await expect(
      service.register({
        email: 'voce@suaequipe.com',
        password: 'Senha@Forte1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
