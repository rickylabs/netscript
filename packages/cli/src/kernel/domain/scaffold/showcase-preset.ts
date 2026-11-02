import { ScaffoldValidationError } from '../errors.ts';
import type { InitOptions } from './scaffold-options.ts';

/** The commerce recipe composes the canonical scaffold through this opt-in selector. */
export const SHOWCASE_PRESET = 'showcase';

/** Resolve the fixed commerce identities before the ordinary scaffold validation. */
export function applyShowcasePreset(options: InitOptions): InitOptions {
  if (options.from !== SHOWCASE_PRESET) return options;
  if (options.noAspire || options.dbEngine === 'none') {
    throw new ScaffoldValidationError('The showcase requires Aspire and a database.');
  }
  if (options.dbEngine && options.dbEngine !== 'sqlite' && options.dbEngine !== 'postgres') {
    throw new ScaffoldValidationError('The showcase supports --db sqlite or --db postgres.');
  }
  if (
    (options.serviceName && options.serviceName !== 'orders') ||
    (options.modelName && options.modelName !== 'Order')
  ) {
    throw new ScaffoldValidationError('The showcase uses service orders and model Order.');
  }
  return {
    ...options,
    cache: options.cache ?? false,
    dbEngine: options.dbEngine ?? 'sqlite',
    includeExampleService: true,
    serviceName: 'orders',
    modelName: 'Order',
  };
}
