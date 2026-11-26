import { useState, useEffect, useCallback } from 'react';
import { gql } from '../api/graphql';
import {
  GET_TASKS,
  GET_MY_TASKS,
  CREATE_TASK,
  UPDATE_TASK,
  UPDATE_TASK_STATUS,
  DELETE_TASK,
  REORDER_TASKS,
  MARK_TASK_SEEN,
  ARCHIVE_TASK,
  UNARCHIVE_TASK,
  ADD_TASK_COMMENT,
} from '../api/queries';
import type { ApiTask, TaskPriority, TaskStatus } from '../api/types';
import type { TaskItem } from '../types';
import { mapTask } from '../api/transform';

// اجرای محدود و کنترل‌شده درخواست‌های گروهی تا سرور با موج درخواست مواجه نشود
async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<unknown>) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift() as T;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

const BULK_CONCURRENCY = 5;

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId: string;
  createdById: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assigneeId?: string;
}

export interface AddTaskCommentInput {
  taskId: string;
  text: string;
  type?: 'note' | 'timeline';
  authorId: string;
}

export function useTasks(scope: 'all' | 'mine' = 'all', userId = '') {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: { tasks?: ApiTask[]; myTasks?: ApiTask[] };
      if (scope === 'mine' && userId) {
        data = await gql<{ myTasks: ApiTask[] }>(GET_MY_TASKS, { userId });
      } else {
        data = await gql<{ tasks: ApiTask[] }>(GET_TASKS);
      }
      const list = data.tasks || data.myTasks || [];
      if (Array.isArray(list)) {
        setTasks(list.map(mapTask));
      }
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, userId]);

  const createTask = useCallback(async (input: CreateTaskInput) => {
    const data = await gql<{ createTask: ApiTask }>(CREATE_TASK, { input });
    await fetchTasks();
    return data.createTask;
  }, [fetchTasks]);

  const updateTask = useCallback(async (input: UpdateTaskInput) => {
    try {
      await gql(UPDATE_TASK, { input });
      await fetchTasks();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [fetchTasks]);

  const updateStatus = useCallback(async (id: string, status: TaskStatus) => {
    try {
      await gql(UPDATE_TASK_STATUS, { input: { id, status } });
      await fetchTasks();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await gql(DELETE_TASK, { id });
      await fetchTasks();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [fetchTasks]);

  const addComment = useCallback(async (input: AddTaskCommentInput) => {
    const data = await gql<{ addTaskComment: ApiTask['comments'][0] }>(ADD_TASK_COMMENT, { input });
    await fetchTasks();
    return data.addTaskComment;
  }, [fetchTasks]);

  const reorderTasks = useCallback(async (ids: string[]) => {
    setTasks(prev => {
      const byId = new Map(prev.map(task => [task.id, task]));
      const ordered = ids.map(id => byId.get(id)).filter((task): task is TaskItem => Boolean(task));
      const rest = prev.filter(task => !ids.includes(task.id));
      return [...ordered, ...rest];
    });

    try {
      await gql(REORDER_TASKS, { input: { ids } });
      await fetchTasks();
    } catch (e) {
      setError((e as Error).message);
      await fetchTasks();
    }
  }, [fetchTasks]);

  const bulkUpdateStatus = useCallback(async (ids: string[], status: TaskStatus) => {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) return;
    setError(null);
    try {
      await runWithConcurrency(
        uniqueIds,
        BULK_CONCURRENCY,
        id => gql(UPDATE_TASK_STATUS, { input: { id, status } }),
      );
      await fetchTasks();
    } catch (e) {
      setError((e as Error).message);
      await fetchTasks();
      throw e;
    }
  }, [fetchTasks]);

  const bulkDelete = useCallback(async (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) return;
    setError(null);
    try {
      await runWithConcurrency(
        uniqueIds,
        BULK_CONCURRENCY,
        id => gql(DELETE_TASK, { id }),
      );
      await fetchTasks();
    } catch (e) {
      setError((e as Error).message);
      await fetchTasks();
      throw e;
    }
  }, [fetchTasks]);

  const markSeen = useCallback(async (id: string, userId: string) => {
    try {
      const data = await gql<{ markTaskSeen: ApiTask }>(MARK_TASK_SEEN, { input: { id, userId } });
      const task = mapTask(data.markTaskSeen);
      setTasks(prev => prev.map(item => item.id === id ? task : item));
      return task;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, []);

  const applyTaskUpdate = useCallback((id: string, task: ApiTask) => {
    const mapped = mapTask(task);
    setTasks(prev => prev.map(item => (item.id === id ? mapped : item)));
    return mapped;
  }, []);

  const archiveTask = useCallback(async (id: string) => {
    try {
      const data = await gql<{ archiveTask: ApiTask }>(ARCHIVE_TASK, { id });
      return applyTaskUpdate(id, data.archiveTask);
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [applyTaskUpdate]);

  const unarchiveTask = useCallback(async (id: string) => {
    try {
      const data = await gql<{ unarchiveTask: ApiTask }>(UNARCHIVE_TASK, { id });
      return applyTaskUpdate(id, data.unarchiveTask);
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [applyTaskUpdate]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks, createTask, updateTask, updateStatus, deleteTask, addComment, reorderTasks, markSeen, archiveTask, unarchiveTask, bulkUpdateStatus, bulkDelete };
}
