import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from './user.model';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

registerEnumType(TaskPriority, { name: 'TaskPriority' });
registerEnumType(TaskStatus, { name: 'TaskStatus' });

@ObjectType()
export class Task {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => TaskPriority)
  priority: TaskPriority;

  @Field(() => TaskStatus)
  status: TaskStatus;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  createdById: string;

  @Field(() => User)
  createdBy: User;

  @Field({ nullable: true })
  assigneeId?: string;

  @Field(() => User, { nullable: true })
  assignee?: User;

  @Field(() => [TaskComment])
  comments: TaskComment[];
}

@ObjectType()
export class TaskComment {
  @Field()
  id: string;

  @Field()
  taskId: string;

  @Field()
  text: string;

  @Field()
  type: string;

  @Field()
  authorId: string;

  @Field(() => User)
  author: User;

  @Field()
  createdAt: Date;
}
