import { AstExtractor } from '@netscript/plugin/sdk';
import { NETSCRIPT_CONTRIBUTION_BUILDERS as workerBuilders } from '@netscript/plugin-workers-core/discovery';
import { NETSCRIPT_CONTRIBUTION_BUILDERS as sagaBuilders } from '@netscript/plugin-sagas-core/discovery';
import { NETSCRIPT_CONTRIBUTION_BUILDERS as streamBuilders } from '@netscript/plugin-streams-core/discovery';
import { NETSCRIPT_CONTRIBUTION_BUILDERS as triggerBuilders } from '@netscript/plugin-triggers-core/discovery';

/** Compose factory-owned first-party metadata with project-owned declarations. */
export function createContributionExtractor(): AstExtractor {
  return new AstExtractor({
    additionalBuilders: [...workerBuilders, ...sagaBuilders, ...streamBuilders, ...triggerBuilders],
  });
}
