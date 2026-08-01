import { Query, Mutation, Resolver, Args } from '@nestjs/graphql';
import { RolesService } from './roles.service';
import { RoleEntity } from '../common/models/role.model';
import { Portal } from '../common/models/portal.model';
import { Permission } from '../common/models/permission.model';
import { CreateRoleInput, UpdateRoleInput, AssignRoleInput, UnassignRoleInput } from '../common/dto/role.input';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
class UserEffectivePermissions {
  @Field(() => [String])
  accessiblePortals: string[];

  @Field(() => [PermissionInfo])
  permissions: PermissionInfo[];
}

@ObjectType()
class PermissionInfo {
  @Field()
  key: string;

  @Field()
  module: string;

  @Field()
  portalKey: string;
}

@Resolver()
export class RolesResolver {
  constructor(private rolesService: RolesService) {}

  @Query(() => [Portal])
  async portals() {
    return this.rolesService.findAllPortals();
  }

  @Query(() => [Permission])
  async permissions() {
    return this.rolesService.findAllPermissions();
  }

  @Query(() => [Permission])
  async permissionsByPortal(@Args('portalId') portalId: string) {
    return this.rolesService.findPermissionsByPortal(portalId);
  }

  @Query(() => [RoleEntity])
  async roles() {
    return this.rolesService.findAllRoles();
  }

  @Query(() => RoleEntity)
  async role(@Args('id') id: string) {
    return this.rolesService.findRoleById(id);
  }

  @Query(() => [RoleEntity])
  async userRoles(@Args('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }

  @Query(() => UserEffectivePermissions)
  async userEffectivePermissions(@Args('userId') userId: string) {
    return this.rolesService.getUserEffectivePermissions(userId);
  }

  @Mutation(() => RoleEntity)
  async createRole(@Args('input') input: CreateRoleInput) {
    return this.rolesService.createRole(input);
  }

  @Mutation(() => RoleEntity)
  async updateRole(@Args('input') input: UpdateRoleInput) {
    return this.rolesService.updateRole(input);
  }

  @Mutation(() => Boolean)
  async deleteRole(@Args('id') id: string, @Args('reassignRoleId', { nullable: true }) reassignRoleId?: string) {
    return this.rolesService.deleteRole(id, reassignRoleId);
  }

  @Mutation(() => [RoleEntity])
  async assignRoleToUser(@Args('input') input: AssignRoleInput) {
    return this.rolesService.assignRoleToUser(input.userId, input.roleId);
  }

  @Mutation(() => [RoleEntity])
  async unassignRoleFromUser(@Args('input') input: UnassignRoleInput) {
    return this.rolesService.unassignRoleFromUser(input.userId, input.roleId);
  }
}
