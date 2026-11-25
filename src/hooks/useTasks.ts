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
  ADD_TASK_COMMENT,
} from '../api/queries';
import type { ApiTask, TaskPriority, TaskStatus } from '../api/types';
import type { TaskItem } from '../types';
import { mapTask } from '../api/transform';

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

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks, createTask, updateTask, updateStatus, deleteTask, addComment, reorderTasks, markSeen };
}
