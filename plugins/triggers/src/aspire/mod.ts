/**
 * @module @netscript/plugin-triggers/aspire
 *
 * Aspire service contribution for triggers API and background processor resources.
 */

export {
  TRIGGERS_PLUGIN_PACKAGE_NAME,
  TriggersAspireContribution,
} from './triggers-contribution.ts';
export type {
  TriggersAspireBuilder,
  TriggersAspireResource,
  TriggersContributionContext,
  TriggersDenoBackgroundSpec,
  TriggersDenoServiceSpec,
  TriggersEnvSource,
  TriggersHealthCheckSpec,
} from './triggers-contribution.ts';
export {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_ID,
} from '../constants.ts';
