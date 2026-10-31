import {
  AGENT_HOSTS,
  type InitAgentInput,
  type InitAgentResult,
} from '../agent/init/init-agent-input.ts';
import { describeAgentInitResolution } from '../agent/init/hosts/agent-host-resolution.ts';
import { outputText } from '../../../kernel/presentation/output/default-output.ts';
import {
  CACHE_BACKEND_CHOICES,
  type CacheBackendChoice,
} from '../../../kernel/domain/cache-backend.ts';
import { DB_ENGINE_CHOICES, type DbEngineChoice } from '../../../kernel/domain/db-engine.ts';
import {
  EDITOR_CHOICES,
  type EditorChoice,
} from '../../../kernel/domain/scaffold/workspace-config.ts';
import type { InitPipelineContext } from '../../../kernel/application/scaffold/context.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../kernel/application/registries/template-registry.ts';
import { executeInit } from '../../../kernel/application/scaffold/orchestrate-init.ts';
import { PresetRegistry } from '../../../kernel/application/registries/preset-registry.ts';
import type { PromptPort } from '../../../kernel/ports/prompt-port.ts';
import type { ProjectNameResolver } from '../../presentation/support.ts';
import type { InitCommandInput } from './init-input.ts';
import { resolveInteractiveInitInput } from './init-interactive.ts';

/** Dependencies for the public `init` command handler. */
export interface InitCommandDependencies {
  /** Application context for the scaffold pipeline. */
  readonly initContext: InitPipelineContext;
  /** Existing agent installer, wired by the public composition root. */
  readonly initAgent: (input: InitAgentInput) => Promise<InitAgentResult>;
  /** Create the scaffold pipeline context for a parsed init invocation. */
  readonly createInitContext?: (options: { readonly dryRun: boolean }) => InitPipelineContext;
  /** Default name when the command is invoked without an argument. */
  readonly defaultProjectName: ProjectNameResolver;
  /** Prompt adapter used by interactive terminal init. */
  readonly prompt: PromptPort;
  /** Apply UI choices after scaffold output exists, before agent setup. */
  readonly applyPreset?: (
    input: import('../../../kernel/application/scaffold/apply-init-preset.ts').InitPresetInput,
  ) => Promise<void>;
}

function dbEngine(raw: string | undefined): DbEngineChoice | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase() as DbEngineChoice;
  if (!DB_ENGINE_CHOICES.includes(normalized)) {
    throw new Error(`--db must be one of: ${DB_ENGINE_CHOICES.join(', ')}`);
  }
  return normalized;
}

function editor(raw: string | undefined): EditorChoice | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase() as EditorChoice;
  if (!EDITOR_CHOICES.includes(normalized)) {
    throw new Error(`--editor must be one of: ${EDITOR_CHOICES.join(', ')}`);
  }
  return normalized;
}

function cacheBackend(raw: string | undefined): CacheBackendChoice | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase();
  if (!isCacheBackendChoice(normalized)) {
    throw new Error(`--cache-backend must be one of: ${CACHE_BACKEND_CHOICES.join(', ')}`);
  }
  return normalized;
}

function isCacheBackendChoice(value: string): value is CacheBackendChoice {
  return CACHE_BACKEND_CHOICES.some((choice) => choice === value);
}

/** Execute parsed init choices through the injected scaffold, preset and agent flows. */
export async function runInitCommand(
  dependencies: InitCommandDependencies,
  options: InitCommandInput,
  nameArg: string | undefined,
  terminal: boolean,
): Promise<void> {
  const host = agentHost(options.host);
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  if (options.from !== undefined) {
    const presets = new PresetRegistry();
    if (presets.entries().length === 0) {
      throw new Error('no presets registered');
    }
    if (presets.get(options.from) === undefined) {
      throw new Error(`preset "${options.from}" is not registered`);
    }
  }
  const nonInteractiveOptions = options.nonInteractive === true
    ? { ...options, ci: true }
    : options;
  const resolved = await resolveInteractiveInitInput(
    dependencies.prompt,
    nonInteractiveOptions,
    nameArg,
    dependencies.defaultProjectName,
    terminal,
  );
  const resolvedOptions = resolved.options;
  const includeService = resolvedOptions.service === true ||
    resolvedOptions.serviceName !== undefined ||
    resolvedOptions.servicePort !== undefined;
  const dryRun = resolvedOptions.dryRun ?? false;
  const initContext = dependencies.createInitContext?.({ dryRun }) ?? dependencies.initContext;
  const result = await executeInit(initContext, {
    name: resolved.name,
    appName: resolvedOptions.appName,
    path: resolvedOptions.path,
    importMode: 'jsr',
    editor: editor(resolvedOptions.editor),
    force: resolvedOptions.force ?? false,
    ci: resolvedOptions.ci ?? false,
    yes: resolvedOptions.yes ?? false,
    dryRun: resolvedOptions.dryRun ?? false,
    json: resolvedOptions.json ?? false,
    from: resolvedOptions.from,
    noGit: resolvedOptions.git === false,
    noAspire: resolvedOptions.aspire === false,
    dbEngine: dbEngine(resolvedOptions.db),
    cache: resolvedOptions.cache,
    cacheBackend: cacheBackend(resolvedOptions.cacheBackend),
    includeExampleService: includeService,
    serviceName: resolvedOptions.serviceName,
    modelName: resolvedOptions.modelName,
    servicePort: resolvedOptions.servicePort,
  });
  if (!result.dryRun && resolvedOptions.preset) {
    if (!dependencies.applyPreset) {
      throw new Error('Init UI preset dependencies are not configured');
    }
    await dependencies.applyPreset({
      projectRoot: result.targetPath,
      name: resolved.name,
      appName: resolvedOptions.appName,
      preset: resolvedOptions.preset,
    });
  }
  if (!result.dryRun && resolvedOptions.agent !== false) {
    const installed = await dependencies.initAgent({
      projectRoot: result.targetPath,
      host,
      editor: editor(resolvedOptions.editor),
      withDocs: resolvedOptions.withDocs,
    });
    if (!resolvedOptions.json) {
      for (const line of describeAgentInitResolution(installed.resolution)) outputText(line);
      for (const message of installed.messages) outputText(message);
    }
  }
}

function agentHost(raw: string | undefined): InitAgentInput['host'] {
  if (raw === undefined) return undefined;
  if (raw === 'all') return raw;
  const host = AGENT_HOSTS.find((host) => host === raw);
  if (host === undefined) {
    throw new Error(`--host must be one of: ${[...AGENT_HOSTS, 'all'].join(', ')}`);
  }
  return host;
}
