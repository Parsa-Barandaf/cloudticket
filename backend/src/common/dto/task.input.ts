import { Field, InputType } from '@nestjs/graphql';
import { TaskPriority, TaskStatus } from '../models/task.model';

@InputType()
export class CreateTaskInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => TaskPriority, { nullable: true })
  priority?: TaskPriority;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field()
  assigneeId: string;

  @Field()
  createdById: string;
}

@InputType()
export class UpdateTaskInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => TaskPriority, { nullable: true })
  priority?: TaskPriority;

  @Field(() => TaskStatus, { nullable: true })
  status?: TaskStatus;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field({ nullable: true })
  assigneeId?: string;
}

@InputType()
export class UpdateTaskStatusInput {
  @Field()
  id: string;

  @Field(() => TaskStatus)
  status: TaskStatus;
}

@InputType()
export class ReorderTasksInput {
  @Field(() => [String])
  ids: string[];
}

@InputType()
export class MarkTaskSeenInput {
  @Field()
  id: string;

  @Field()
  userId: string;
}

@InputType()
export class AddTaskCommentInput {
  @Field()
  taskId: string;

  @Field()
  text: string;

  @Field({ nullable: true, defaultValue: 'note' })
  type?: string;

  @Field()
  authorId: string;
}

@InputType()
export class TaskFilterInput {
  @Field(() => TaskStatus, { nullable: true })
  status?: TaskStatus;

  @Field(() => TaskPriority, { nullable: true })
  priority?: TaskPriority;

  @Field({ nullable: true })
  assigneeId?: string;
}
