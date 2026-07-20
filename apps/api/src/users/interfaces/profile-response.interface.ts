import { Role } from '@prisma/client';
import { Preferences } from './preferences.interface';

// Explicit, hand-picked shape returned to clients - never spread a raw
// Prisma model, so nothing beyond these fields can leak accidentally.
export interface ProfileResponse {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  preferences: Preferences;
  createdAt: Date;
  updatedAt: Date;
}
