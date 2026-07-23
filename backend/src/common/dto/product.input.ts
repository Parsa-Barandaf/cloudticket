import { Field, InputType } from '@nestjs/graphql';

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
}
