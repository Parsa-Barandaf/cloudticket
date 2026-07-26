import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { Product } from '../common/models/product.model';
import { CreateProductInput, UpdateProductInput } from '../common/dto/product.input';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query(() => [Product])
  async products() {
    return this.productsService.findAll();
  }

  @Query(() => Product, { nullable: true })
  async product(@Args('id') id: string) {
    return this.productsService.findById(id);
  }

  @Mutation(() => Product)
  async createProduct(@Args('input') input: CreateProductInput) {
    return this.productsService.create(input);
  }

  @Mutation(() => Product)
  async updateProduct(@Args('input') input: UpdateProductInput) {
    const { id, ...data } = input;
    return this.productsService.update(id, data);
  }

  @Mutation(() => Boolean)
  async deleteProduct(@Args('id') id: string) {
    await this.productsService.delete(id);
    return true;
  }
}
