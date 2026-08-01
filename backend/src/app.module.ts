import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { AccessRequestsModule } from './access-requests/access-requests.module';
import { ActivitiesModule } from './activities/activities.module';
import { DatabaseModule } from './common/database.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    ProductsModule,
    CustomersModule,
    AccessRequestsModule,
    ActivitiesModule,
    RolesModule,
  ],
})
export class AppModule {}
