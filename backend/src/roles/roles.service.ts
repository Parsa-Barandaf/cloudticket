import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateRoleInput, UpdateRoleInput } from '../common/dto/role.input';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  private roleInclude() {
    return {
      rolePermissions: { include: { permission: true } },
      portals: { include: { portal: true } },
      _count: { select: { userRoles: true } },
    };
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: this.roleInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: this.roleInclude(),
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async findAllPortals() {
    return this.prisma.portal.findMany({ orderBy: { name: 'asc' } });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { key: 'asc' }] });
  }

  async findPermissionsByPortal(portalId: string) {
    return this.prisma.permission.findMany({
      where: { portalId },
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });
  }

  async createRole(input: CreateRoleInput) {
    const role = await this.prisma.role.create({
      data: {
        name: input.name,
        description: input.description,
        scope: input.scope ?? 'internal',
      },
    });

    await this.syncRoleAccess(role.id, input.portalIds, input.permissionIds);

    return this.findRoleById(role.id);
  }

  async updateRole(input: UpdateRoleInput) {
    const existing = await this.prisma.role.findUnique({ where: { id: input.id } });
    if (!existing) throw new NotFoundException('Role not found');
    if (!existing.isEditable) throw new BadRequestException('This role cannot be edited');

    await this.prisma.role.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });

    if (input.portalIds !== undefined || input.permissionIds !== undefined) {
      await this.syncRoleAccess(input.id, input.portalIds, input.permissionIds);
    }

    return this.findRoleById(input.id);
  }

  /**
   * Keeps Role<->Portal and Role<->Permission consistent.
   * Rule 1: explicit portals always win; permissions whose portal is not selected are dropped.
   * Rule 2: if only permissions are provided (no explicit portals), their portals are auto-added.
   */
  private async syncRoleAccess(roleId: string, portalIds?: string[], permissionIds?: string[]) {
    const portalSet = new Set<string>();
    if (portalIds?.length) portalIds.forEach(p => portalSet.add(p));

    let permissionPortalMap = new Map<string, string>();
    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const perms = await this.prisma.permission.findMany({ where: { id: { in: permissionIds } } });
        for (const p of perms) permissionPortalMap.set(p.id, p.portalId);
      }
      if (portalSet.size === 0) {
        for (const portalId of permissionPortalMap.values()) portalSet.add(portalId);
      }
    }

    await this.prisma.rolePortal.deleteMany({ where: { roleId } });
    if (portalSet.size > 0) {
      await this.prisma.rolePortal.createMany({
        data: Array.from(portalSet).map(portalId => ({ roleId, portalId })),
      });
    }

    if (permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId } });
      const kept = Array.from(permissionPortalMap.entries())
        .filter(([, pid]) => portalSet.has(pid))
        .map(([permissionId]) => permissionId);
      if (kept.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: kept.map(permissionId => ({ roleId, permissionId })),
        });
      }
    }
  }

  async deleteRole(id: string, reassignRoleId?: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (!role.isEditable) throw new BadRequestException('This role cannot be deleted');

    if (reassignRoleId) {
      const target = await this.prisma.role.findUnique({ where: { id: reassignRoleId } });
      if (!target) throw new NotFoundException('Replacement role not found');
      const affected = await this.prisma.userRoleAssignment.findMany({ where: { roleId: id } });
      for (const a of affected) {
        await this.prisma.userRoleAssignment.upsert({
          where: { roleId_userId: { roleId: reassignRoleId, userId: a.userId } },
          update: {},
          create: { roleId: reassignRoleId, userId: a.userId },
        });
      }
      await this.prisma.userRoleAssignment.deleteMany({ where: { roleId: id } });
    }

    await this.prisma.role.delete({ where: { id } });
    return true;
  }

  async assignRoleToUser(userId: string, roleId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    if (role.scope === 'customer' && !user.isCustomer) {
      throw new BadRequestException('Customer roles can only be assigned to customer users');
    }

    await this.prisma.userRoleAssignment.upsert({
      where: { roleId_userId: { roleId, userId } },
      update: {},
      create: { roleId, userId },
    });

    return this.getUserRoles(userId);
  }

  async unassignRoleFromUser(userId: string, roleId: string) {
    await this.prisma.userRoleAssignment.deleteMany({
      where: { roleId, userId },
    });
    return this.getUserRoles(userId);
  }

  async getUserRoles(userId: string) {
    return this.prisma.role.findMany({
      where: { userRoles: { some: { userId } } },
      include: this.roleInclude(),
    });
  }

  async getUserAccessiblePortals(userId: string) {
    const userRoles = await this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: { include: { portals: { include: { portal: true } } } } },
    });

    const portalSet = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.portals) {
        portalSet.add(rp.portal.key);
      }
    }
    return Array.from(portalSet);
  }

  async getUserEffectivePermissions(userId: string) {
    const userRoles = await this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: { include: { portal: true } } },
            },
          },
        },
      },
    });

    const permissionsMap = new Map<string, { key: string; module: string; portalKey: string }>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionsMap.set(rp.permission.key, {
          key: rp.permission.key,
          module: rp.permission.module,
          portalKey: rp.permission.portal.key,
        });
      }
    }

    return {
      permissions: Array.from(permissionsMap.values()),
      accessiblePortals: await this.getUserAccessiblePortals(userId),
    };
  }
}
