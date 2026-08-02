import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { RoleEntity } from './role.model';

export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  CUSTOMER = 'CUSTOMER',
}

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field({ nullable: true })
  avatar?: string;

  @Field()
  active: boolean;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  company?: string;

  @Field({ defaultValue: false })
  isCustomer: boolean;

  @Field({ nullable: true })
  customerId?: string;

  @Field({ nullable: true })
  departmentId?: string;

  @Field(() => [RoleEntity], { nullable: true })
  userRoles?: RoleEntity[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
