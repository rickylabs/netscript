import packageConfig from '../../deno.json' with { type: 'json' };
import {
  buildScaffoldPluginJson,
  PluginScaffolder,
  readScaffoldPluginName,
} from '@netscript/plugin/scaffold';
import type {
  PluginScaffoldManifestSpec,
  ScaffoldArtifact,
  ScaffolderContext,
} from '@netscript/plugin/scaffold';

import { authTemplate0 } from './templates/root/README-md.ts';
import { authTemplate1 } from './templates/root/package-json.ts';
import { authTemplate2 } from './templates/root/deno-json.ts';
import { authTemplate3 } from './templates/root/mod-ts.ts';
import { authTemplate4 } from './templates/root/contracts-ts.ts';
import { authTemplate5 } from './templates/root/verify-plugin-ts.ts';
import { authTemplate6 } from './templates/src/src-constants-ts.ts';
import { authTemplate7 } from './templates/src/src-public-mod-ts.ts';
import { authTemplate8 } from './templates/src/src-plugin-mod-ts.ts';
import { authTemplate9 } from './templates/services/services-mod-ts.ts';
import { authTemplate10 } from './templates/services/services-src-backend-registry-ts.ts';
import { authTemplate11 } from './templates/services/services-src-init-ts.ts';
import { authTemplate12 } from './templates/services/services-src-main-ts.ts';
import { authTemplate13 } from './templates/services/services-src-request-context-ts.ts';
import { authTemplate14 } from './templates/services/services-src-router-ts.ts';
import { authTemplate15 } from './templates/services/services-src-routers-health-ts.ts';
import { authTemplate16 } from './templates/services/services-src-routers-v1-ts.ts';
import { authTemplate17 } from './templates/services/services-src-routers-v1-handlers-ts.ts';
import { authTemplate18 } from './templates/services/services-src-routers-v1-helpers-ts.ts';
import { authTemplate19 } from './templates/services/services-src-routers-v1-types-ts.ts';
import { authTemplate20 } from './templates/streams/streams-factory-ts.ts';
import { authTemplate21 } from './templates/streams/streams-mod-ts.ts';
import { authTemplate22 } from './templates/streams/streams-producer-ts.ts';
import { authTemplate23 } from './templates/streams/streams-schema-ts.ts';
import { authTemplate24 } from './templates/streams/streams-server-ts.ts';
import { authTemplate25 } from './templates/database/database-auth-prisma.ts';
import { authScaffoldSpec } from './spec.ts';

const NETSCRIPT_VERSION = packageConfig.version;

interface AuthScaffoldOptions {
  readonly pluginName: string;
}

const AUTH_ARTIFACT_SOURCES = [
  { sourcePath: 'scaffold.plugin.json', content: generateScaffoldPluginJson() },
  { sourcePath: 'README.md', content: authTemplate0 },
  { sourcePath: 'package.json', content: authTemplate1 },
  { sourcePath: 'deno.json', content: authTemplate2(NETSCRIPT_VERSION) },
  { sourcePath: 'mod.ts', content: authTemplate3 },
  { sourcePath: 'contracts.ts', content: authTemplate4 },
  { sourcePath: 'verify-plugin.ts', content: authTemplate5 },
  { sourcePath: 'src/constants.ts', content: authTemplate6 },
  { sourcePath: 'src/public/mod.ts', content: authTemplate7 },
  { sourcePath: 'src/plugin/mod.ts', content: authTemplate8 },
  { sourcePath: 'services/mod.ts', content: authTemplate9 },
  { sourcePath: 'services/src/backend-registry.ts', content: authTemplate10 },
  { sourcePath: 'services/src/init.ts', content: authTemplate11 },
  { sourcePath: 'services/src/main.ts', content: authTemplate12 },
  { sourcePath: 'services/src/request-context.ts', content: authTemplate13 },
  { sourcePath: 'services/src/router.ts', content: authTemplate14 },
  { sourcePath: 'services/src/routers/health.ts', content: authTemplate15 },
  { sourcePath: 'services/src/routers/v1.ts', content: authTemplate16 },
  { sourcePath: 'services/src/routers/v1-handlers.ts', content: authTemplate17 },
  { sourcePath: 'services/src/routers/v1-helpers.ts', content: authTemplate18 },
  { sourcePath: 'services/src/routers/v1-types.ts', content: authTemplate19 },
  { sourcePath: 'streams/factory.ts', content: authTemplate20 },
  { sourcePath: 'streams/mod.ts', content: authTemplate21 },
  { sourcePath: 'streams/producer.ts', content: authTemplate22 },
  { sourcePath: 'streams/schema.ts', content: authTemplate23 },
  { sourcePath: 'streams/server.ts', content: authTemplate24 },
  { sourcePath: 'database/auth.prisma', content: authTemplate25 },
] as const;

/** Scaffolder for auth plugin-specific artifacts. */
export class AuthScaffolder extends PluginScaffolder {
  readonly pluginName = 'auth';
  readonly manifestSpec: PluginScaffoldManifestSpec = authScaffoldSpec;

  protected buildArtifacts(context: ScaffolderContext): readonly ScaffoldArtifact[] {
    return buildAuthScaffoldArtifacts({
      pluginName: readScaffoldPluginName(context.options, { scaffolderName: 'Auth' }),
    });
  }
}

/** Build the deterministic files emitted by the auth plugin scaffolder. */
function buildAuthScaffoldArtifacts(
  options: AuthScaffoldOptions,
): readonly ScaffoldArtifact[] {
  const pluginRoot = `plugins/${options.pluginName}`;
  return AUTH_ARTIFACT_SOURCES.map((artifact) => ({
    path: `${pluginRoot}/${artifact.sourcePath}`,
    content: artifact.content,
  }));
}

function generateScaffoldPluginJson(): string {
  return buildScaffoldPluginJson(authScaffoldSpec, NETSCRIPT_VERSION);
}
