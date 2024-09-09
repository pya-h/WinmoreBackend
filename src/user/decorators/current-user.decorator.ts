import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPopulated } from '../types/user-populated.type';

export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext) =>
    context.switchToHttp().getRequest().user as UserPopulated,
);
