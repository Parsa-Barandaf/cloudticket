import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
registerEnumType(AccessRequestStatus, { name: 'AccessRequestStatus' });

@ObjectType()
export class AccessRequest {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  companyName: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field({ nullable: true })
  industry?: string;

  @Field(() => AccessRequestStatus)
  status: AccessRequestStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
