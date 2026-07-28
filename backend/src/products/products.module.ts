import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { ProductsService } from './products.service';
import { ProductsResolver } from './products.resolver';

@Module({
  imports: [ActivitiesModule],
  providers: [ProductsService, ProductsResolver],
})
export class ProductsModule {}
