/**
 * 任务队列实现
 */

import type { Task, TaskContext, TaskResult, TaskStatus, QueueEvents } from './types';

/** 任务包装器 */
class TaskWrapper {
  public readonly task: Task;
  public status: TaskStatus = 'pending';
  public result?: TaskResult;
  public error?: Error;

  constructor(task: Task) {
    this.task = task;
  }
}

/** 任务队列 */
export class TaskQueue {
  private tasks: Map<string, TaskWrapper> = new Map();
  private events: QueueEvents = {};
  private isPaused = false;
  private isCancelled = false;
  private context: TaskContext;

  constructor(context: TaskContext) {
    this.context = context;
  }

  /** 设置事件监听 */
  on(events: QueueEvents): void {
    this.events = { ...this.events, ...events };
  }

  /** 添加任务 */
  add(task: Task): void {
    this.tasks.set(task.id, new TaskWrapper(task));
  }

  /** 批量添加任务 */
  addAll(tasks: Task[]): void {
    tasks.forEach(task => this.add(task));
  }

  /** 暂停 */
  pause(): void {
    this.isPaused = true;
  }

  /** 恢复 */
  resume(): void {
    this.isPaused = false;
  }

  /** 取消 */
  cancel(): void {
    this.isCancelled = true;
  }

  /** 获取任务 */
  getTask(id: string): TaskWrapper | undefined {
    return this.tasks.get(id);
  }

  /** 获取所有任务 */
  getAllTasks(): TaskWrapper[] {
    return Array.from(this.tasks.values());
  }

  /** 获取按依赖排序的任务 */
  private getSortedTasks(): TaskWrapper[] {
    const sorted: TaskWrapper[] = [];
    const visited = new Set<string>();

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const wrapper = this.tasks.get(taskId);
      if (!wrapper) return;

      // 先访问依赖
      if (wrapper.task.dependencies) {
        for (const depId of wrapper.task.dependencies) {
          visit(depId);
        }
      }

      sorted.push(wrapper);
    };

    for (const taskId of this.tasks.keys()) {
      visit(taskId);
    }

    return sorted;
  }

  /** 运行队列 */
  async run(): Promise<TaskResult[]> {
    const results: TaskResult[] = [];
    const sorted = this.getSortedTasks();

    for (const wrapper of sorted) {
      if (this.isCancelled) {
        wrapper.status = 'skipped';
        continue;
      }

      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 检查依赖是否成功
      if (wrapper.task.dependencies) {
        const depsFailed = wrapper.task.dependencies.some(depId => {
          const dep = this.tasks.get(depId);
          return dep && dep.status === 'failed';
        });
        if (depsFailed) {
          wrapper.status = 'skipped';
          continue;
        }
      }

      // 执行任务
      wrapper.status = 'running';
      this.events.onTaskStart?.(wrapper.task);

      try {
        const result = await wrapper.task.execute(this.context);
        wrapper.result = result;
        wrapper.status = result.success ? 'completed' : 'failed';
        this.events.onTaskComplete?.(wrapper.task, result);
        results.push(result);

        // 更新进度
        const completed = Array.from(this.tasks.values()).filter(
          t => t.status === 'completed' || t.status === 'failed' || t.status === 'skipped'
        ).length;
        const progress = completed / this.tasks.size;
        this.events.onProgress?.(progress);

      } catch (error) {
        wrapper.error = error as Error;
        wrapper.status = 'failed';
        this.events.onTaskError?.(wrapper.task, error as Error);
        results.push({
          success: false,
          error: error as Error,
          message: `Task ${wrapper.task.name} failed: ${(error as Error).message}`,
        });
      }
    }

    return results;
  }

  /** 回滚所有已执行的任务 */
  async rollback(): Promise<void> {
    const sorted = this.getSortedTasks();
    const executed = sorted.filter(t => t.status === 'completed').reverse();

    for (const wrapper of executed) {
      if (wrapper.task.rollback) {
        try {
          await wrapper.task.rollback(this.context);
          wrapper.status = 'pending';
        } catch (error) {
          console.error(`Rollback failed for ${wrapper.task.name}:`, error);
        }
      }
    }
  }

  /** 获取统计信息 */
  getStats() {
    const all = this.getAllTasks();
    return {
      total: all.length,
      pending: all.filter(t => t.status === 'pending').length,
      running: all.filter(t => t.status === 'running').length,
      completed: all.filter(t => t.status === 'completed').length,
      failed: all.filter(t => t.status === 'failed').length,
      skipped: all.filter(t => t.status === 'skipped').length,
    };
  }
}
