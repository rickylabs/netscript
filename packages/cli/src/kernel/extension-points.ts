/**
 * CLI extension point manifest.
 *
 * This file names the registry-backed axes that are intentional extension
 * points for CLI composition.
 */

/** Plugin kind providers for scaffolded plugin workspaces. */
export { PluginKindRegistry } from './application/registries/plugin-kind-registry.ts';

/** Database engine providers for scaffolded database workspaces. */
export { DbEngineRegistry } from './application/registries/db-engine-registry.ts';

/** Checked-in scaffold template assets available to generators. */
export { TemplateRegistry } from './application/registries/template-registry.ts';

/** Output renderers available at CLI presentation edges. */
export { OutputRendererRegistry } from './application/registries/output-renderer-registry.ts';

/** Deployment target descriptors supported by deploy commands. */
export { DeployTargetRegistry } from './application/registries/deploy-target-registry.ts';
