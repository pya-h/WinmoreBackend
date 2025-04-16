import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserPopulated } from '../../user/types/user-populated.type';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPopulated;

    if (user && user.admin) {
      return true;
    }

    throw new ForbiddenException('Access denied.');
  }
}
