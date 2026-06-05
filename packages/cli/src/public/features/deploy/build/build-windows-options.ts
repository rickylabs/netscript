export interface WindowsBuildOptions {
  deployDir: string;
  parallel?: boolean;
  maxConcurrency?: number;
  verbose?: boolean;
  skipCompile?: boolean;
  forceRuntimeConfig?: boolean;
  skipServices?: string[];
  generateEnvFile?: boolean;
  includeCli?: boolean;
  copyTasks?: boolean;
  includeTasks?: string[];
  excludeTasks?: string[];
  ci?: boolean;
  failOnDrift?: boolean;
  keepRuntime?: 'local' | 'remote';
}
