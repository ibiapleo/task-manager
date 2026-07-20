import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

// Use after SupabaseAuthGuard, e.g.:
//   @CurrentUser() user: AuthenticatedUser
//   @CurrentUser('id') userId: string
//   @CurrentUser('role') role: Role
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return field ? user?.[field] : user;
  },
);
