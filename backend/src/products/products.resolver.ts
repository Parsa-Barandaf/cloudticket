import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { Product } from '../common/models/product.model';
import { ProductCustomerConnection } from '../common/models/product-customer-connection.model';
import {
  CreateProductInput,
  UpdateProductInput,
} from '../common/dto/product.input';
import {
  CreateConnectionInput,
  UpdateConnectionInput,
} from '../common/dto/connection.input';

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

  @Mutation(() => ProductCustomerConnection)
  async createConnection(@Args('input') input: CreateConnectionInput) {
    return this.productsService.createConnection(input);
  }

  @Mutation(() => Boolean)
  async deleteConnection(@Args('id') id: string) {
    await this.productsService.deleteConnection(id);
    return true;
  }

  @Mutation(() => ProductCustomerConnection)
  async updateConnection(@Args('input') input: UpdateConnectionInput) {
    const { id, ...data } = input;
    return this.productsService.updateConnection(id, data);
  }

  @Query(() => [ProductCustomerConnection])
  async customerConnections(@Args('customerId') customerId: string) {
    return this.productsService.findByCustomer(customerId);
  }

  @Mutation(() => Boolean)
  async deleteProduct(@Args('id') id: string) {
    await this.productsService.delete(id);
    return true;
  }
}
