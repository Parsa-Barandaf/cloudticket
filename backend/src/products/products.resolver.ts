import { Query, Resolver } from '@nestjs/graphql';
import { ProductsService } from './products.service';

@Resolver()
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query(() => String)
  async products() {
    return 'products placeholder';
  }
}
