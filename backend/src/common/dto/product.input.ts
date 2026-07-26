import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { ProductStatus } from '../models/product.model';

@InputType()
export class CreateProductInput {
  @Field()
  name: string;

  @Field()
  category: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  version?: string;

  @Field({ nullable: true })
  logoColor?: string;

  @Field({ nullable: true })
  logoInitials?: string;
}

@InputType()
export class UpdateProductInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  version?: string;

  @Field(() => ProductStatus, { nullable: true })
  status?: ProductStatus;

  @Field({ nullable: true })
  logoColor?: string;

  @Field({ nullable: true })
  logoInitials?: string;
}
