import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class RoleUserCount {
  @Field()
  userRoles: number;
}

@ObjectType()
export class PermissionInfoEntity {
  @Field()
  id: string;

  @Field()
  key: string;

  @Field()
  module: string;

  @Field()
  portalId: string;
}

@ObjectType()
export class RolePermissionEntity {
  @Field()
  permissionId: string;

  @Field(() => PermissionInfoEntity)
  permission: PermissionInfoEntity;
}

@ObjectType()
export class PortalInfoEntity {
  @Field()
  id: string;

  @Field()
  key: string;

  @Field()
  name: string;
}

@ObjectType()
export class RolePortalEntity {
  @Field()
  portalId: string;

  @Field(() => PortalInfoEntity)
  portal: PortalInfoEntity;
}

@ObjectType()
export class RoleEntity {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isEditable: boolean;

  @Field()
  isSystem: boolean;

  @Field()
  scope: string;

  @Field({ nullable: true })
  orgId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => RoleUserCount, { nullable: true })
  _count?: RoleUserCount;

  @Field(() => [RolePermissionEntity], { nullable: true })
  rolePermissions?: RolePermissionEntity[];

  @Field(() => [RolePortalEntity], { nullable: true })
  portals?: RolePortalEntity[];
}
