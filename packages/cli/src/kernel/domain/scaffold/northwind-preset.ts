import type { DbEngineChoice } from '../db-engine.ts';
import { ScaffoldValidationError } from '../errors.ts';

/** Built-in persisted orders example; the full plugin showcase is a separate recipe. */
export const NORTHWIND_PRESET = 'northwind';

const NORTHWIND_DEFAULTS = {
  serviceName: 'orders',
  modelName: 'Order',
  dbEngine: 'sqlite',
  cache: false,
} as const;

/** Choices shared by both init commands and the kernel validation boundary. */
export interface InitPresetChoices {
  readonly from?: string;
  readonly preset?: string;
  readonly dbEngine?: DbEngineChoice;
  readonly includeExampleService?: boolean;
  readonly serviceName?: string;
  readonly modelName?: string;
  readonly noAspire?: boolean;
  readonly cache?: boolean;
}

/** Resolve the closed domain preset before prompts, writes or maintainer package selection. */
export function applyInitPreset<T extends InitPresetChoices>(options: T): T & InitPresetChoices {
  if (options.from === undefined) return options;
  if (options.from !== NORTHWIND_PRESET) {
    throw new ScaffoldValidationError(
      `Unknown scaffold preset "${options.from}". Available: ${NORTHWIND_PRESET}.`,
    );
  }
  const conflict = options.preset !== undefined
    ? '--preset'
    : options.noAspire
    ? '--no-aspire'
    : options.includeExampleService === false
    ? '--service false'
    : options.dbEngine !== undefined && options.dbEngine !== 'sqlite' &&
        options.dbEngine !== 'postgres'
    ? `--db ${options.dbEngine}`
    : options.serviceName !== undefined && options.serviceName !== NORTHWIND_DEFAULTS.serviceName
    ? '--service-name'
    : options.modelName !== undefined && options.modelName !== NORTHWIND_DEFAULTS.modelName
    ? '--model-name'
    : undefined;
  if (conflict) {
    throw new ScaffoldValidationError(
      `--from ${NORTHWIND_PRESET} cannot be combined with ${conflict}. Use SQLite or Postgres with the orders service and Order model.`,
    );
  }
  return {
    ...options,
    dbEngine: options.dbEngine ?? NORTHWIND_DEFAULTS.dbEngine,
    includeExampleService: true,
    serviceName: NORTHWIND_DEFAULTS.serviceName,
    modelName: NORTHWIND_DEFAULTS.modelName,
    cache: options.cache ?? NORTHWIND_DEFAULTS.cache,
  };
}
