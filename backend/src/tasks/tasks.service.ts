import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TaskPriority, TaskStatus } from '@prisma/client';

const ASSIGNEE_REQUIRED_MESSAGE = 'انتخاب مسئول وظیفه الزامی است.';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService,
    private notificationsService: NotificationsService,
  ) {}

  private include() {
    return {
      createdBy: true,
      assignee: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: 'asc' } as const,
      },
    };
  }

  async findAll(filter?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
  }) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.priority) where.priority = filter.priority;
    if (filter?.assigneeId) where.assigneeId = filter.assigneeId;

    return this.prisma.task.findMany({
      where,
      include: this.include(),
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async findMine(userId: string) {
    return this.prisma.task.findMany({
      where: {
        OR: [{ assigneeId: userId }, { createdById: userId }],
      },
      include: this.include(),
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: this.include(),
    });
  }

  private async validateAssignee(assigneeId?: string) {
    if (!assigneeId?.trim()) {
      throw new BadRequestException(ASSIGNEE_REQUIRED_MESSAGE);
    }
    const user = await this.prisma.user.findUnique({
      where: { id: assigneeId },
    });
    if (!user) throw new BadRequestException('Assignee not found');
    if (user.isCustomer) {
      throw new BadRequestException(
        'وظایف فقط به کاربران داخلی سازمان اختصاص می‌یابد',
      );
    }
  }

  async create(data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date;
    assigneeId: string;
    createdById: string;
  }) {
    const creator = await this.prisma.user.findUnique({
      where: { id: data.createdById },
    });
    if (!creator) throw new BadRequestException('Creator not found');

    await this.validateAssignee(data.assigneeId);

    const maxOrder = await this.prisma.task.aggregate({
      _max: { sortOrder: true },
    });
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority ?? 'MEDIUM',
        dueDate: data.dueDate,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        createdById: data.createdById,
        assigneeId: data.assigneeId,
      },
      include: this.include(),
    });

    await this.activitiesService.create({
      type: 'task',
      title: 'وظیفه جدید ایجاد شد',
      subtitle: `وظیفه «${data.title}» توسط ${creator.name} ثبت شد.`,
    });

    if (task.assigneeId) {
      await this.notificationsService.create({
        title: 'وظیفه جدید به شما محول شد',
        description: `${creator.name} وظیفه «${task.title}» را به ${task.assignee?.name || 'کاربر مسئول'} محول کرد.`,
        type: 'tasks',
        priority: this.notificationPriority(task.priority),
        authorName: creator.name,
        authorAvatarBg: 'bg-brand-600',
        linkedType: 'وظیفه',
        linkedId: task.id,
        linkedName: task.title,
      });
    }

    return task;
  }

  private notificationPriority(priority: TaskPriority): string {
    if (priority === 'CRITICAL') return 'critical';
    if (priority === 'HIGH') return 'important';
    return 'normal';
  }

  async update(data: {
    id: string;
    title?: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: Date;
    assigneeId?: string;
  }) {
    const existing = await this.prisma.task.findUnique({
      where: { id: data.id },
    });
    if (!existing) throw new NotFoundException('Task not found');

    if (data.assigneeId !== undefined)
      await this.validateAssignee(data.assigneeId);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.assigneeId !== undefined) {
      updateData.assignee = { connect: { id: data.assigneeId } };
      if (data.assigneeId !== existing.assigneeId) updateData.seenAt = null;
    }
    if (data.status === 'DONE') updateData.completedAt = new Date();
    if (data.status === 'PENDING' || data.status === 'IN_PROGRESS')
      updateData.completedAt = null;

    const updated = await this.prisma.task.update({
      where: { id: data.id },
      data: updateData,
      include: this.include(),
    });

    const assignedUser =
      data.assigneeId !== undefined && data.assigneeId
        ? await this.prisma.user.findUnique({ where: { id: data.assigneeId } })
        : null;

    if (assignedUser) {
      const assigner =
        updated.createdBy ||
        (await this.prisma.user.findUnique({
          where: { id: updated.createdById },
        }));
      await this.activitiesService.create({
        type: 'task',
        title: 'محول شدن وظیفه',
        subtitle: `وظیفه «${updated.title}» به ${assignedUser.name} محول شد.`,
      });
      await this.notificationsService.create({
        title: 'وظیفه جدید به شما محول شد',
        description: `${assigner?.name || 'مدیر سامانه'} وظیفه «${updated.title}» را به ${assignedUser.name} محول کرد.`,
        type: 'tasks',
        priority: this.notificationPriority(updated.priority),
        authorName: assigner?.name || 'مدیر سامانه',
        authorAvatarBg: 'bg-brand-600',
        linkedType: 'وظیفه',
        linkedId: updated.id,
        linkedName: updated.title,
      });
    }

    return updated;
  }

  async updateStatus(id: string, status: TaskStatus) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');

    const updateData: any = { status };
    if (status === 'DONE') updateData.completedAt = new Date();
    if (status === 'PENDING' || status === 'IN_PROGRESS')
      updateData.completedAt = null;

    const updated = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: this.include(),
    });

    const statusLabels: Record<string, string> = {
      PENDING: 'در انتظار',
      IN_PROGRESS: 'در حال انجام',
      DONE: 'انجام شده',
      CANCELLED: 'لغو شده',
    };
    await this.activitiesService.create({
      type: 'task',
      title: 'وضعیت وظیفه تغییر کرد',
      subtitle: `وضعیت وظیفه «${updated.title}» به «${statusLabels[status] || status}» تغییر یافت.`,
    });

    return updated;
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.task.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );
  }

  async archive(id: string) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');
    if (existing.archivedAt) return this.findById(id);

    return this.prisma.task.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        // آرشیو وظایف باز، آن‌ها را به وضعیت «لغو شده» می‌برد
        ...(existing.status !== 'DONE'
          ? { status: 'CANCELLED' as TaskStatus, completedAt: null }
          : {}),
      },
      include: this.include(),
    });
  }

  async unarchive(id: string) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');

    return this.prisma.task.update({
      where: { id },
      data: { archivedAt: null },
      include: this.include(),
    });
  }

  async markSeen(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.assigneeId !== userId) return this.findById(id);

    // مشاهده وظیفه تغییر محتوایی نیست؛ مقدار updatedAt حفظ می‌شود تا «آخرین تغییر» جابه‌جا نشود
    return this.prisma.task.update({
      where: { id },
      data: { seenAt: task.seenAt ?? new Date(), updatedAt: task.updatedAt },
      include: this.include(),
    });
  }

  async addComment(data: {
    taskId: string;
    text: string;
    type?: string;
    authorId: string;
  }) {
    const task = await this.prisma.task.findUnique({
      where: { id: data.taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const author = await this.prisma.user.findUnique({
      where: { id: data.authorId },
    });
    if (!author) throw new BadRequestException('Author not found');

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId: data.taskId,
        text: data.text,
        type: data.type ?? 'note',
        authorId: data.authorId,
      },
      include: { author: true },
    });

    const typeLabel =
      data.type === 'timeline' ? 'پیشرفت ثبت شد' : 'یادداشت جدید ثبت شد';
    await this.activitiesService.create({
      type: 'task',
      title: typeLabel,
      subtitle: `${author.name} روی وظیفه «${task.title}» فعالیت کرد.`,
    });

    if (task.assigneeId && task.assigneeId !== data.authorId) {
      await this.notificationsService.create({
        title: 'یادداشت جدید روی وظیفه',
        description: `${author.name}: «${data.text}»`,
        type: 'tasks',
        priority: 'normal',
        authorName: author.name,
        authorAvatarBg: 'bg-brand-600',
        linkedType: 'وظیفه',
        linkedId: task.id,
        linkedName: task.title,
      });
    }

    return comment;
  }

  async delete(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.task.delete({ where: { id } });
    return true;
  }
}
