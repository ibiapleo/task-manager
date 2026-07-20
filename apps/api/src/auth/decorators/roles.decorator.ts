import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Marks a route/controller as restricted to the given roles. ADMIN always
// bypasses this check (see RolesGuard); COMMON is the implicit default when
// no @Roles() is applied at all.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
