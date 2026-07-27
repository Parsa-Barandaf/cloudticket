import { Query, Mutation, Resolver, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { DepartmentsService } from './departments.service';
import { CustomRolesService } from './custom-roles.service';
import { User } from '../common/models/user.model';
import { Department } from '../common/models/department.model';
import { CustomRole } from '../common/models/custom-role.model';
import { CreateUserInput, UpdateUserInput } from '../common/dto/user.input';
import { CreateDepartmentInput, UpdateDepartmentInput } from '../common/dto/department.input';
import { CreateCustomRoleInput, UpdateCustomRoleInput, DeleteCustomRoleInput } from '../common/dto/custom-role.input';

@Resolver()
export class UsersResolver {
  constructor(
    private usersService: UsersService,
    private departmentsService: DepartmentsService,
    private customRolesService: CustomRolesService,
  ) {}

  @Query(() => [User])
  async users() {
    return this.usersService.findAll();
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.create(input);
  }

  @Mutation(() => User)
  async updateUser(@Args('input') input: UpdateUserInput) {
    return this.usersService.update(input);
  }

  @Mutation(() => Boolean)
  async deleteUser(@Args('id') id: string) {
    return this.usersService.delete(id);
  }

  @Query(() => [User])
  async usersByCompany(@Args('company') company: string) {
    return this.usersService.findByCompany(company);
  }

  @Query(() => [Department])
  async departments() {
    return this.departmentsService.findAll();
  }

  @Query(() => Department, { nullable: true })
  async department(@Args('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Mutation(() => Department)
  async createDepartment(@Args('input') input: CreateDepartmentInput) {
    return this.departmentsService.create(input);
  }

  @Mutation(() => Department)
  async updateDepartment(@Args('input') input: UpdateDepartmentInput) {
    return this.departmentsService.update(input);
  }

  @Mutation(() => Boolean)
  async deleteDepartment(@Args('id') id: string) {
    return this.departmentsService.delete(id);
  }

  @Query(() => [CustomRole])
  async customRoles() {
    return this.customRolesService.findAll();
  }

  @Query(() => CustomRole, { nullable: true })
  async customRole(@Args('id') id: string) {
    return this.customRolesService.findById(id);
  }

  @Mutation(() => CustomRole)
  async createCustomRole(@Args('input') input: CreateCustomRoleInput) {
    return this.customRolesService.create(input);
  }

  @Mutation(() => CustomRole)
  async updateCustomRole(@Args('input') input: UpdateCustomRoleInput) {
    return this.customRolesService.update(input);
  }

  @Mutation(() => Boolean)
  async deleteCustomRole(@Args('input') input: DeleteCustomRoleInput) {
    return this.customRolesService.delete(input);
  }
}
