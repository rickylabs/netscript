import type { BuildResult } from '../../../../kernel/domain/deploy/compile-target.ts';
import type { ResolvedConfig } from '../../../../kernel/domain/resolved-config.ts';
import { Pipeline } from '../../../../kernel/application/abstracts/pipeline.ts';
import { PipelineStep } from '../../../../kernel/application/abstracts/pipeline-step.ts';

/** Public deployment build options. */
export interface BuildDeployOptions {
  /** Run compilations in parallel. */
  readonly parallel?: boolean;

  /** Max concurrent compilations. */
  readonly maxConcurrency?: number;

  /** Show verbose output. */
  readonly verbose?: boolean;

  /** Skip binary compilation. */
  readonly skipCompile?: boolean;

  /** Force overwrite runtime config files. */
  readonly forceRuntimeConfig?: boolean;

  /** Service names to exclude from compilation. */
  readonly skipServices?: readonly string[];

  /** Generate the deployment .env file. */
  readonly generateEnvFile?: boolean;

  /** Compile the CLI into the deploy bin directory. */
  readonly includeCli?: boolean;

  /** Copy task script files to the deploy output. */
  readonly copyTasks?: boolean;

  /** Extra task files or directories to include. */
  readonly includeTasks?: readonly string[];

  /** Task file names to exclude from copying. */
  readonly excludeTasks?: readonly string[];

  /** Non-interactive mode. */
  readonly ci?: boolean;

  /** Fail if remote runtime config is newer than local. */
  readonly failOnDrift?: boolean;

  /** Resolution for same-version runtime config conflicts. */
  readonly keepRuntime?: 'local' | 'remote';
}

/** Request for building deployment artifacts. */
export interface BuildDeployRequest {
  /** Build output directory. */
  readonly deployDir: string;

  /** Windows deployment build options. */
  readonly options: BuildDeployOptions;
}

/** Dependencies for the public deploy-build flow. */
export interface BuildDeployDependencies {
  /** Load the resolved project deployment config. */
  readonly loadConfig: (options: { deployDir: string }) => Promise<ResolvedConfig>;

  /** Build Windows deployment artifacts from a resolved config. */
  readonly buildWindowsDeployment: (
    config: ResolvedConfig,
    options: BuildDeployOptions & { readonly deployDir: string },
  ) => Promise<BuildResult>;
}

/** Deploy build step that loads config and writes deployment artifacts. */
export class BuildDeployStep extends PipelineStep<BuildDeployRequest, BuildResult> {
  readonly id = 'public.deploy.build.write-artifacts';

  constructor(private readonly dependencies: BuildDeployDependencies) {
    super();
  }

  inspect(input: BuildDeployRequest) {
    return {
      id: this.id,
      label: 'Build Windows deployment artifacts',
      touches: [input.deployDir],
    };
  }

  prepare(input: BuildDeployRequest): BuildDeployRequest {
    return input;
  }

  async execute(request: BuildDeployRequest): Promise<BuildResult> {
    const config = await this.dependencies.loadConfig({ deployDir: request.deployDir });
    return await this.dependencies.buildWindowsDeployment(config, {
      deployDir: request.deployDir,
      ...request.options,
      skipServices: request.options.skipServices ? [...request.options.skipServices] : undefined,
      includeTasks: request.options.includeTasks ? [...request.options.includeTasks] : undefined,
      excludeTasks: request.options.excludeTasks ? [...request.options.excludeTasks] : undefined,
    });
  }
}

/** Public deploy build pipeline. */
export class BuildDeployPipeline extends Pipeline<BuildDeployRequest, BuildResult> {
  readonly id = 'public.deploy.build';
  protected readonly steps: readonly PipelineStep<unknown, unknown>[];

  constructor(dependencies: BuildDeployDependencies) {
    super();
    this.steps = [new BuildDeployStep(dependencies)];
  }
}

/** Build public Windows deployment artifacts. */
export async function buildDeploy(
  request: BuildDeployRequest,
  dependencies: BuildDeployDependencies,
): Promise<BuildResult> {
  return (await new BuildDeployPipeline(dependencies).execute(request)).output;
}
