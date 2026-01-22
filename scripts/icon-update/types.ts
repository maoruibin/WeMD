/**
 * Icon 更新任务队列 - 类型定义
 */

/** 任务状态 */
export enum TaskStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Skipped = 'skipped',
}

/** 图标尺寸 */
export interface IconSize {
  width: number;
  height: number;
  name: string;
}

/** 导出的图标类型 */
export interface ExportedIcon {
  type: 'svg' | 'png' | 'ico';
  size?: IconSize;
  path: string;
  content?: string;
}

/** 上传结果 */
export interface UploadResult {
  localPath: string;
  remoteUrl: string;
  size: number;
}

/** 更新结果 */
export interface UpdateResult {
  file: string;
  oldUrl: string;
  newUrl: string;
  updated: boolean;
}

/** 任务接口 */
export interface Task {
  id: string;
  name: string;
  description?: string;
  dependencies?: string[];  // 依赖的任务 ID
  execute(context: TaskContext): Promise<TaskResult>;
  rollback?(context: TaskContext): Promise<void>;
}

/** 任务执行上下文 */
export interface TaskContext {
  workspaceRoot: string;
  config: IconUpdateConfig;
  sharedData: Map<string, unknown>;  // 任务间共享数据
  backupFiles: Map<string, string>;   // 备份的文件内容
}

/** 任务结果 */
export interface TaskResult {
  success: boolean;
  data?: unknown;
  error?: Error;
  message?: string;
}

/** 任务队列事件 */
export interface QueueEvents {
  onTaskStart?: (task: Task) => void;
  onTaskComplete?: (task: Task, result: TaskResult) => void;
  onTaskError?: (task: Task, error: Error) => void;
  onProgress?: (progress: number) => void;
}

/** Icon 更新配置 */
export interface IconUpdateConfig {
  // 源文件
  sourceHtml: string;
  svgSelector?: string;  // 选择器，用于提取 SVG

  // 输出目录
  outputDirs: {
    web: string;
    electron: string;
    exports: string;
  };

  // PNG 尺寸
  pngSizes: IconSize[];

  // 图床上传配置
  upload: {
    enabled: boolean;
    provider: 'official' | 'qiniu' | 'aliyun' | 'tencent' | 's3';
    cdnUrl: string;
    config?: Record<string, unknown>;
  };

  // 需要更新的文件
  updateFiles: {
    path: string;
    replacements: Array<{
      pattern: RegExp;
      replacement: string | ((url: string) => string);
    }>;
  }[];

  // 备份配置
  backup: {
    enabled: boolean;
    dir: string;
  };

  // 执行选项
  options: {
    dryRun?: boolean;     // 预览模式
    exportOnly?: boolean; // 仅导出
    verbose?: boolean;    // 详细日志
  };
}

/** SVG 源定义 */
export interface SVGSource {
  name: string;        // 如 'main', 'variant-1'
  selector?: string;   // HTML 中的选择器
  content?: string;    // 直接指定的 SVG 内容
}

export interface IconVariant {
  name: string;        // 'dark', 'light', 'green'
  svgSource: SVGSource;
  outputPath: string;
}
