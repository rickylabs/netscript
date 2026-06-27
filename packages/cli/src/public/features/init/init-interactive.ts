import { CACHE_BACKEND_CHOICES } from '../../../kernel/domain/cache-backend.ts';
import { DB_ENGINE_CHOICES } from '../../../kernel/domain/db-engine.ts';
import type { PromptPort } from '../../../kernel/ports/prompt-port.ts';
import { SCAFFOLD_DEFAULTS } from '../../../kernel/constants/scaffold/scaffold-defaults.ts';
import type { InitCommandInput } from './init-input.ts';

/** Input resolved by the interactive `init` prompt pass. */
export interface ResolvedInitCommandInput {
  /** CLI options after prompt answers fill missing values. */
  readonly options: InitCommandInput;
  /** Project name after prompt answers fill a missing positional argument. */
  readonly name: string;
}

/** Resolve missing init inputs by prompting only in interactive terminal mode. */
export async function resolveInteractiveInitInput(
  prompt: PromptPort,
  options: InitCommandInput,
  nameArg: string | undefined,
  defaultProjectName: () => string,
  isTerminal: boolean,
): Promise<ResolvedInitCommandInput> {
  if (options.ci === true || options.yes === true || !isTerminal) {
    return {
      options,
      name: nameArg ?? defaultProjectName(),
    };
  }

  const name = nameArg ??
    await prompt.input('Project name', { defaultValue: defaultProjectName() });
  const dbEngine = options.db === undefined
    ? await prompt.select('Database engine', DB_ENGINE_CHOICES, {
      defaultValue: SCAFFOLD_DEFAULTS.DB_ENGINE,
    })
    : options.db;
  const includeService = options.service === undefined
    ? await prompt.confirm('Scaffold an example oRPC service?', { defaultValue: false })
    : options.service;
  const serviceName = includeService && options.serviceName === undefined
    ? await prompt.input('Example service name', { defaultValue: SCAFFOLD_DEFAULTS.SERVICE_NAME })
    : options.serviceName;
  const appName = options.appName === undefined
    ? await prompt.input('Frontend application name', { defaultValue: SCAFFOLD_DEFAULTS.APP_NAME })
    : options.appName;
  const cache = options.cache === undefined
    ? await prompt.confirm('Scaffold a shared cache?', {
      defaultValue: SCAFFOLD_DEFAULTS.CACHE_ENABLED,
    })
    : options.cache;
  const cacheBackend = cache && options.cacheBackend === undefined
    ? await prompt.select('Cache backend', CACHE_BACKEND_CHOICES, {
      defaultValue: SCAFFOLD_DEFAULTS.CACHE_BACKEND,
    })
    : options.cacheBackend;

  return {
    name,
    options: {
      ...options,
      appName,
      db: dbEngine,
      service: includeService,
      serviceName,
      cache,
      cacheBackend,
    },
  };
}
