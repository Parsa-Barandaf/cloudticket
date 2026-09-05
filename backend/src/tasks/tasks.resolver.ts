import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TasksService } from './tasks.service';
import { Task, TaskComment } from '../common/models/task.model';
import {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  ReorderTasksInput,
  MarkTaskSeenInput,
  AddTaskCommentInput,
  TaskFilterInput,
} from '../common/dto/task.input';

@Resolver(() => Task)
export class TasksResolver {
  constructor(private tasksService: TasksService) {}

  @Query(() => [Task])
  async tasks(@Args('filter', { nullable: true }) filter?: TaskFilterInput) {
    return this.tasksService.findAll(filter);
  }

  @Query(() => [Task])
  async myTasks(@Args('userId') userId: string) {
    return this.tasksService.findMine(userId);
  }

  @Query(() => Task, { nullable: true })
  async task(@Args('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Mutation(() => Task)
  async createTask(@Args('input') input: CreateTaskInput) {
    return this.tasksService.create(input);
  }

  @Mutation(() => Task)
  async updateTask(@Args('input') input: UpdateTaskInput) {
    return this.tasksService.update(input);
  }

  @Mutation(() => Task)
  async updateTaskStatus(@Args('input') input: UpdateTaskStatusInput) {
    return this.tasksService.updateStatus(input.id, input.status);
  }

  @Mutation(() => Boolean)
  async reorderTasks(@Args('input') input: ReorderTasksInput) {
    await this.tasksService.reorder(input.ids);
    return true;
  }

  @Mutation(() => Task)
  async markTaskSeen(@Args('input') input: MarkTaskSeenInput) {
    return this.tasksService.markSeen(input.id, input.userId);
  }

  @Mutation(() => Boolean)
  async deleteTask(@Args('id') id: string) {
    return this.tasksService.delete(id);
  }

  @Mutation(() => TaskComment)
  async addTaskComment(@Args('input') input: AddTaskCommentInput) {
    return this.tasksService.addComment(input);
  }
}
