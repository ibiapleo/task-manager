import { Profile, Role } from '@prisma/client';

export const MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';

// Mirrors the JSONB default declared on Profile.preferences in
// schema.prisma - used so e2e fixtures never drift from the real default.
export const DEFAULT_PREFERENCES_JSON = {
  theme: 'light',
  accessibility: { highContrast: false, fontSizeMultiplier: 1 },
  localization: { dateFormat: 'DD/MM/YYYY' },
};

// A fictitious, fully-shaped Profile - AuthenticatedUser IS the Profile
// entity (see authenticated-user.interface.ts), so every e2e fixture must
// provide every column, not just id/email/role.
export function buildMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: MOCK_USER_ID,
    email: 'e2e-user@example.com',
    name: null,
    avatarUrl: null,
    role: Role.COMMON,
    preferences: DEFAULT_PREFERENCES_JSON,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
