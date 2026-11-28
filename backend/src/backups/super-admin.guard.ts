import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface AuthenticatedUser {
  active?: boolean;
  role?: string;
  userRoles?: Array<{ id?: string; name?: string }>;
}

/**
 * Allows access only for users that hold the system "Super Admin" role.
 * The JWT strategy attaches the full user (including userRoles) to req.user.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request?.user;

    if (!user || user.active === false) {
      throw new ForbiddenException('دسترسی فقط برای مدیر کل مجاز است.');
    }

    const roles = Array.isArray(user.userRoles) ? user.userRoles : [];

    const hasSuperAdminRole = roles.some(
      (role) => role.id === 'role-super-admin' || role.name === 'Super Admin',
    );

    // Legacy admins created before the RBAC tables existed do not have any
    // role assignment, so keep them working as well.
    const isLegacyAdmin = user.role === 'ADMIN' && roles.length === 0;

    if (!hasSuperAdminRole && !isLegacyAdmin) {
      throw new ForbiddenException('دسترسی فقط برای مدیر کل مجاز است.');
    }

    return true;
  }
}
