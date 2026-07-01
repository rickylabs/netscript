/**
 * @module
 *
 * Greenfield plugin generator for the dual-tier NetScript plugin topology.
 */

import { dirname, join } from '@std/path';
import {
  artifactText,
  defineRegistryModule,
  renderRegistrySource,
  type ScaffoldArtifact,
  textArtifact,
} from '@netscript/plugin/scaffold';

import { IoError, UsageError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { EXIT_CODES } from '../host/plugin-loader.ts';

/** Package version stamped onto generated plugin tiers. */
export const GENERATED_PLUGIN_VERSION = '0.0.1-alpha.17';

/** Options accepted by the greenfield plugin generator. */
export interface NewPluginOptions {
  /** Plugin short name, package segment, or scoped connector package name. */
  readonly name: string;
  /** Workspace root that receives `packages/` and `plugins/` tiers. */
  readonly projectRoot: string;
  /** Connector archetype. Defaults to `proxy`. */
  readonly kind?: 'feature' | 'proxy';
  /** Overwrite existing files. */
  readonly overwrite?: boolean;
}

/** Dependencies required by the greenfield plugin generator. */
export interface NewPluginDependencies {
  /** Filesystem adapter used for deterministic artifact writes. */
  readonly fs: FileSystemPort;
}

/** Paths and identifiers derived from a requested plugin name. */
export interface NewPluginDescriptor {
  /** Bare kebab plugin name without the `plugin-` prefix. */
  readonly name: string;
  /** PascalCase identifier stem. */
  readonly pascalName: string;
  /** lowerCamelCase identifier stem. */
  readonly camelName: string;
  /** Core package name. */
  readonly corePackage: string;
  /** Connector package name. */
  readonly connectorPackage: string;
  /** Core tier root path. */
  readonly coreRoot: string;
  /** Connector tier root path. */
  readonly connectorRoot: string;
  /** Connector archetype. */
  readonly kind: 'feature' | 'proxy';
}

/** Result returned after writing a greenfield plugin. */
export interface NewPluginResult {
  /** Generated descriptor. */
  readonly descriptor: NewPluginDescriptor;
  /** Files written by the generator. */
  readonly filesCreated: readonly string[];
  /** Files skipped because overwrite was disabled. */
  readonly filesSkipped: readonly string[];
}

/** Resolve the dual-tier descriptor for a plugin name. */
export function resolveNewPluginDescriptor(
  options: NewPluginOptions,
): NewPluginDescriptor {
  const name = normalizePluginName(options.name);
  const pascalName = toPascalCase(name);
  const camelName = pascalName.charAt(0).toLowerCase() + pascalName.slice(1);
  const kind = options.kind ?? 'proxy';

  return {
    name,
    pascalName,
    camelName,
    corePackage: `@netscript/plugin-${name}-core`,
    connectorPackage: `@netscript/plugin-${name}`,
    coreRoot: join(options.projectRoot, 'packages', `plugin-${name}-core`),
    connectorRoot: join(options.projectRoot, 'plugins', name),
    kind,
  };
}

/** Emit the greenfield core + connector plugin tiers. */
export async function createNewPlugin(
  options: NewPluginOptions,
  dependencies: NewPluginDependencies,
): Promise<NewPluginResult> {
  const descriptor = resolveNewPluginDescriptor(options);
  const artifacts = buildArtifacts(descriptor);
  const filesCreated: string[] = [];
  const filesSkipped: string[] = [];

  try {
    for (const artifact of artifacts) {
      const root = artifact.path.startsWith('packages/')
        ? options.projectRoot
        : options.projectRoot;
      const outputPath = join(root, artifact.path);
      if (await dependencies.fs.exists(outputPath) && !options.overwrite) {
        filesSkipped.push(outputPath);
        continue;
      }

      await dependencies.fs.createDir(dirname(outputPath));
      await dependencies.fs.writeFile(outputPath, artifactText(artifact));
      filesCreated.push(outputPath);
    }
  } catch (error: unknown) {
    if (error instanceof UsageError) throw error;
    throw new IoError(
      EXIT_CODES.SCAFFOLD_FAILED,
      `Could not generate plugin "${options.name}".`,
      { cause: error, context: { projectRoot: options.projectRoot } },
    );
  }

  return { descriptor, filesCreated, filesSkipped };
}

function buildArtifacts(descriptor: NewPluginDescriptor): readonly ScaffoldArtifact[] {
  return [
    ...buildCoreArtifacts(descriptor),
    ...buildConnectorArtifacts(descriptor),
  ];
}

function buildCoreArtifacts(descriptor: NewPluginDescriptor): readonly ScaffoldArtifact[] {
  const root = `packages/plugin-${descriptor.name}-core`;
  return [
    textArtifact(`${root}/deno.json`, `${JSON.stringify(coreDenoJson(descriptor), null, 2)}\n`),
    textArtifact(`${root}/mod.ts`, coreRootSource(descriptor)),
    textArtifact(`${root}/README.md`, coreReadme(descriptor)),
    textArtifact(`${root}/src/domain/mod.ts`, coreDomainSource(descriptor)),
    textArtifact(`${root}/src/ports/mod.ts`, corePortsSource(descriptor)),
    textArtifact(`${root}/src/application/mod.ts`, coreApplicationSource(descriptor)),
    textArtifact(
      `${root}/src/contracts/v1/${descriptor.name}.contract.ts`,
      coreContractSource(descriptor),
    ),
    textArtifact(
      `${root}/src/contracts/v1/mod.ts`,
      `export * from './${descriptor.name}.contract.ts';\n`,
    ),
    textArtifact(`${root}/src/testing/mod.ts`, coreTestingSource(descriptor)),
    textArtifact(
      `${root}/tests/contracts/${descriptor.name}-contract-soundness_test.ts`,
      coreContractTestSource(descriptor),
    ),
  ];
}

function buildConnectorArtifacts(descriptor: NewPluginDescriptor): readonly ScaffoldArtifact[] {
  const root = `plugins/${descriptor.name}`;
  return [
    textArtifact(
      `${root}/deno.json`,
      `${JSON.stringify(connectorDenoJson(descriptor), null, 2)}\n`,
    ),
    textArtifact(
      `${root}/package.json`,
      `${JSON.stringify(connectorPackageJson(descriptor), null, 2)}\n`,
    ),
    textArtifact(`${root}/mod.ts`, connectorRootSource(descriptor)),
    textArtifact(`${root}/README.md`, connectorReadme(descriptor)),
    textArtifact(
      `${root}/contracts/v1.ts`,
      `export * from '${descriptor.corePackage}/contracts/v1';\n`,
    ),
    textArtifact(`${root}/adapter.ts`, connectorAdapterSource(descriptor)),
    textArtifact(`${root}/aspire.ts`, connectorAspireSource(descriptor)),
    textArtifact(`${root}/cli.ts`, connectorCliSource(descriptor)),
    textArtifact(`${root}/scaffold.ts`, connectorScaffoldSource(descriptor)),
    textArtifact(`${root}/verify-plugin.ts`, connectorVerifySource(descriptor)),
    textArtifact(
      `${root}/scaffold.plugin.json`,
      `${JSON.stringify(scaffoldPluginJson(descriptor), null, 2)}\n`,
    ),
    textArtifact(
      `${root}/scaffold.runtime.json`,
      `${JSON.stringify(scaffoldRuntimeJson(descriptor), null, 2)}\n`,
    ),
    textArtifact(`${root}/database/${descriptor.name}.prisma`, connectorPrismaSource(descriptor)),
    textArtifact(`${root}/scaffolding/${descriptor.name}.stub.ts`, connectorStubSource(descriptor)),
    textArtifact(
      `${root}/scaffolding/${descriptor.name}-scaffolder.ts`,
      connectorScaffolderSource(descriptor),
    ),
    textArtifact(`${root}/services/src/context.ts`, connectorServiceContextSource(descriptor)),
    textArtifact(`${root}/services/src/handlers.ts`, connectorServiceHandlersSource(descriptor)),
    textArtifact(`${root}/services/src/main.ts`, connectorServiceMainSource(descriptor)),
    textArtifact(`${root}/tests/public/manifest_test.ts`, connectorManifestTestSource(descriptor)),
  ];
}

function coreDenoJson(descriptor: NewPluginDescriptor): Record<string, unknown> {
  return {
    name: descriptor.corePackage,
    version: GENERATED_PLUGIN_VERSION,
    description: `Core engine for the NetScript ${descriptor.name} plugin.`,
    license: 'MIT',
    exports: {
      '.': './mod.ts',
      './contracts/v1': './src/contracts/v1/mod.ts',
      './domain': './src/domain/mod.ts',
      './ports': './src/ports/mod.ts',
      './testing': './src/testing/mod.ts',
    },
    imports: {
      '@netscript/plugin': `jsr:@netscript/plugin@${GENERATED_PLUGIN_VERSION}`,
      '@orpc/contract': 'npm:@orpc/contract@^1.14.6',
      '@orpc/server': 'npm:@orpc/server@^1.14.6',
      '@std/assert': 'jsr:@std/assert@^1',
      'zod': 'jsr:@zod/zod@4.4.3',
    },
    tasks: {
      check:
        'deno check --unstable-kv mod.ts src/contracts/v1/mod.ts src/domain/mod.ts src/ports/mod.ts src/testing/mod.ts',
      test: 'deno test --allow-all tests/',
      'publish:dry-run': 'deno publish --dry-run --allow-dirty',
    },
    publish: {
      include: ['README.md', 'deno.json', 'mod.ts', 'src/**/*.ts'],
      exclude: ['**/*_test.ts', '**/*.test.ts', '**/test_utils/**'],
    },
    compilerOptions: {
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
    },
  };
}

function connectorDenoJson(descriptor: NewPluginDescriptor): Record<string, unknown> {
  return {
    name: descriptor.connectorPackage,
    version: GENERATED_PLUGIN_VERSION,
    description: `NetScript connector for the ${descriptor.name} plugin.`,
    license: 'MIT',
    exports: {
      '.': './mod.ts',
      './contracts': './contracts/v1.ts',
      './services': './services/src/main.ts',
      './aspire': './aspire.ts',
      './cli': './cli.ts',
      './scaffold': './scaffold.ts',
    },
    imports: {
      '@netscript/aspire': `jsr:@netscript/aspire@${GENERATED_PLUGIN_VERSION}`,
      '@netscript/plugin': `jsr:@netscript/plugin@${GENERATED_PLUGIN_VERSION}`,
      [descriptor.corePackage]: `jsr:${descriptor.corePackage}@${GENERATED_PLUGIN_VERSION}`,
      '@std/assert': 'jsr:@std/assert@^1',
    },
    tasks: {
      check:
        'deno check --unstable-kv mod.ts adapter.ts aspire.ts cli.ts scaffold.ts verify-plugin.ts contracts/v1.ts services/src/main.ts',
      test: 'deno test --allow-all',
      'publish:dry-run': 'deno publish --dry-run --allow-dirty',
    },
    publish: {
      include: [
        'README.md',
        'deno.json',
        'package.json',
        'scaffold.plugin.json',
        'scaffold.runtime.json',
        'adapter.ts',
        'aspire.ts',
        'cli.ts',
        'scaffold.ts',
        'verify-plugin.ts',
        'mod.ts',
        'contracts/**/*.ts',
        'services/**/*.ts',
        'scaffolding/**/*.ts',
        'database/**/*.prisma',
      ],
      exclude: ['**/*_test.ts', '**/*.test.ts', '**/test_utils/**'],
    },
    compilerOptions: {
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
    },
  };
}

function connectorPackageJson(descriptor: NewPluginDescriptor): Record<string, string> {
  return {
    name: descriptor.connectorPackage,
    version: GENERATED_PLUGIN_VERSION,
    type: 'module',
  };
}

function scaffoldPluginJson(descriptor: NewPluginDescriptor): Record<string, unknown> {
  return {
    name: descriptor.connectorPackage,
    kind: descriptor.kind,
    capabilities: {
      hasRoutes: descriptor.kind === 'feature',
    },
    starterResources: [],
  };
}

function scaffoldRuntimeJson(descriptor: NewPluginDescriptor): Record<string, unknown> {
  return {
    plugin: descriptor.connectorPackage,
    services: [`${descriptor.name}-service`],
  };
}

function coreRootSource(descriptor: NewPluginDescriptor): string {
  return [
    `export { define${descriptor.pascalName} } from './src/application/mod.ts';`,
    `export type { ${descriptor.pascalName}, ${descriptor.pascalName}Id } from './src/domain/mod.ts';`,
    `export type { ${descriptor.pascalName}Port } from './src/ports/mod.ts';`,
    '',
  ].join('\n');
}

function coreDomainSource(descriptor: NewPluginDescriptor): string {
  return [
    `export type ${descriptor.pascalName}Id = string;`,
    '',
    `export interface ${descriptor.pascalName} {`,
    `  readonly id: ${descriptor.pascalName}Id;`,
    '  readonly title: string;',
    '}',
    '',
  ].join('\n');
}

function corePortsSource(descriptor: NewPluginDescriptor): string {
  return [
    `import type { ${descriptor.pascalName} } from '../domain/mod.ts';`,
    '',
    `export interface ${descriptor.pascalName}Port {`,
    `  list${descriptor.pascalName}s(): Promise<readonly ${descriptor.pascalName}[]>;`,
    '}',
    '',
  ].join('\n');
}

function coreApplicationSource(descriptor: NewPluginDescriptor): string {
  return [
    `import type { ${descriptor.pascalName}Port } from '../ports/mod.ts';`,
    '',
    `export interface ${descriptor.pascalName}Application {`,
    `  list(): ReturnType<${descriptor.pascalName}Port['list${descriptor.pascalName}s']>;`,
    '}',
    '',
    `export function define${descriptor.pascalName}(port: ${descriptor.pascalName}Port): ${descriptor.pascalName}Application {`,
    '  return {',
    '    list() {',
    `      return port.list${descriptor.pascalName}s();`,
    '    },',
    '  };',
    '}',
    '',
  ].join('\n');
}

function coreContractSource(descriptor: NewPluginDescriptor): string {
  return [
    "import { oc } from '@orpc/contract';",
    'import type {',
    '  AnySchema,',
    '  ContractProcedureBuilderWithOutput,',
    '  ErrorMap,',
    '  MergedErrorMap,',
    "} from '@orpc/contract';",
    "import { implement } from '@orpc/server';",
    "import { z } from 'zod';",
    'import {',
    '  BASE_PLUGIN_CONTRACT_ROUTES,',
    '  BASE_PLUGIN_ERRORS,',
    '  type BasePluginContract,',
    "} from '@netscript/plugin/contract-base';",
    '',
    'const baseContract: ReturnType<typeof oc.errors> = oc.errors(',
    '  { ...BASE_PLUGIN_ERRORS } as unknown as Parameters<typeof oc.errors>[0],',
    ');',
    '',
    'type BaseErrors = MergedErrorMap<Record<never, never>, ErrorMap>;',
    '',
    'type OutputRoute<TOut extends AnySchema> = ContractProcedureBuilderWithOutput<',
    '  AnySchema,',
    '  TOut,',
    '  BaseErrors,',
    '  Record<never, never>',
    '>;',
    '',
    `export const ${descriptor.camelName}Schema: z.ZodObject<{ id: z.ZodString; title: z.ZodString }> = z.object({`,
    '  id: z.string(),',
    '  title: z.string(),',
    '});',
    '',
    `const list${descriptor.pascalName}sOutput: z.ZodArray<typeof ${descriptor.camelName}Schema> = z.array(${descriptor.camelName}Schema);`,
    '',
    `export interface ${descriptor.pascalName}ContractDefinition extends BasePluginContract {`,
    `  readonly list${descriptor.pascalName}s: OutputRoute<typeof list${descriptor.pascalName}sOutput>;`,
    '}',
    '',
    `export const ${descriptor.camelName}ContractDefinition: ${descriptor.pascalName}ContractDefinition = {`,
    '  ...BASE_PLUGIN_CONTRACT_ROUTES,',
    `  list${descriptor.pascalName}s: baseContract.route({ method: 'GET', path: '/${descriptor.name}' }).output(list${descriptor.pascalName}sOutput),`,
    '};',
    '',
    `export const ${descriptor.camelName}ContractV1: ReturnType<typeof implement<${descriptor.pascalName}ContractDefinition>> = implement(`,
    `  ${descriptor.camelName}ContractDefinition,`,
    ');',
    '',
  ].join('\n');
}

function coreTestingSource(descriptor: NewPluginDescriptor): string {
  return [
    `import type { ${descriptor.pascalName} } from '../domain/mod.ts';`,
    `import type { ${descriptor.pascalName}Port } from '../ports/mod.ts';`,
    '',
    `export class InMemory${descriptor.pascalName}Port implements ${descriptor.pascalName}Port {`,
    `  readonly #items: ${descriptor.pascalName}[];`,
    '',
    `  constructor(items: readonly ${descriptor.pascalName}[] = []) {`,
    '    this.#items = [...items];',
    '  }',
    '',
    `  list${descriptor.pascalName}s(): Promise<readonly ${descriptor.pascalName}[]> {`,
    '    return Promise.resolve(this.#items);',
    '  }',
    '}',
    '',
  ].join('\n');
}

function coreContractTestSource(descriptor: NewPluginDescriptor): string {
  return [
    "import { assert } from '@std/assert';",
    `import { ${descriptor.camelName}ContractV1 } from '../../src/contracts/v1/mod.ts';`,
    '',
    `Deno.test('${descriptor.name} contract includes base describe route', () => {`,
    `  assert(${descriptor.camelName}ContractV1.describe);`,
    `  assert(${descriptor.camelName}ContractV1.list${descriptor.pascalName}s);`,
    '});',
    '',
  ].join('\n');
}

function connectorRootSource(descriptor: NewPluginDescriptor): string {
  return [
    'import {',
    '  definePlugin,',
    '  type InspectionReport,',
    '  inspectPlugin,',
    '  type PluginManifest,',
    "} from '@netscript/plugin';",
    '',
    `export const ${descriptor.camelName}Plugin: PluginManifest = definePlugin(`,
    `  '${descriptor.connectorPackage}',`,
    `  '${GENERATED_PLUGIN_VERSION}',`,
    ')',
    `  .withDisplayName('${descriptor.pascalName}')`,
    `  .withDescription('NetScript ${descriptor.name} plugin connector.')`,
    "  .withContractVersions([{ version: 'v1', loader: './contracts/v1.ts' }])",
    `  .withService({ name: '${descriptor.name}', entrypoint: './services/src/main.ts' })`,
    '  .build();',
    '',
    `export const ${descriptor.camelName}PluginInfo: InspectionReport = inspectPlugin(${descriptor.camelName}Plugin);`,
    '',
  ].join('\n');
}

function connectorAdapterSource(descriptor: NewPluginDescriptor): string {
  return [
    "import type { NetScriptPlugin } from '@netscript/plugin/adapter';",
    `import { ${descriptor.camelName}Scaffolder } from './scaffolding/${descriptor.name}-scaffolder.ts';`,
    '',
    `export const ${descriptor.camelName}AdapterPlugin: NetScriptPlugin = {`,
    `  name: '${descriptor.connectorPackage}',`,
    `  kind: '${descriptor.name}',`,
    `  displayName: '${descriptor.pascalName}',`,
    '  install: {',
    `    dependencySpecifier: 'jsr:${descriptor.connectorPackage}@^${GENERATED_PLUGIN_VERSION}',`,
    '    starterResources: [],',
    '  },',
    '  doctor: {',
    "    healthEndpoint: '/health',",
    '  },',
    '  info: {',
    `    capabilities: ['${descriptor.kind}'],`,
    "    versionSource: 'package',",
    '  },',
    '  update: {',
    "    strategy: 'dependency',",
    `    targetSpecifier: 'jsr:${descriptor.connectorPackage}@^${GENERATED_PLUGIN_VERSION}',`,
    '  },',
    '  remove: {',
    "    strategy: 'manifest-only',",
    '  },',
    '  resources: [{',
    `    name: '${descriptor.name}',`,
    `    scaffolder: ${descriptor.camelName}Scaffolder,`,
    "    parseInput: (args) => ({ identifier: args.values?.[0] ?? 'sample' }),",
    '  }],',
    '};',
    '',
  ].join('\n');
}

function connectorAspireSource(descriptor: NewPluginDescriptor): string {
  return [
    'import {',
    '  type AspireBuilder,',
    '  AspireNSPluginContribution,',
    '  type AspireResource,',
    '  type ContributionContext,',
    "} from '@netscript/aspire/public';",
    '',
    `export class ${descriptor.pascalName}AspireContribution extends AspireNSPluginContribution {`,
    `  readonly pluginName = '${descriptor.connectorPackage}';`,
    '',
    '  contribute(',
    '    _builder: AspireBuilder,',
    '    _ctx: ContributionContext,',
    '  ): readonly AspireResource[] {',
    '    return [];',
    '  }',
    '}',
    '',
  ].join('\n');
}

function connectorCliSource(descriptor: NewPluginDescriptor): string {
  return [
    "import { createPluginAdapter, type PluginCliEntrypoint } from '@netscript/plugin/adapter';",
    `import { ${descriptor.camelName}AdapterPlugin } from './adapter.ts';`,
    '',
    `const cli: PluginCliEntrypoint = createPluginAdapter(${descriptor.camelName}AdapterPlugin).toCli();`,
    '',
    'export default cli;',
    '',
  ].join('\n');
}

function connectorScaffoldSource(descriptor: NewPluginDescriptor): string {
  return [
    'import {',
    '  createPluginAdapter,',
    '  type PluginScaffoldEntrypoint,',
    '  runPluginScaffoldCli,',
    "} from '@netscript/plugin/adapter';",
    `import { ${descriptor.camelName}AdapterPlugin } from './adapter.ts';`,
    '',
    `const scaffold: PluginScaffoldEntrypoint = createPluginAdapter(${descriptor.camelName}AdapterPlugin).toScaffold();`,
    '',
    'export default scaffold;',
    '',
    'if (import.meta.main) {',
    '  await runPluginScaffoldCli(scaffold);',
    '}',
    '',
  ].join('\n');
}

function connectorVerifySource(descriptor: NewPluginDescriptor): string {
  return [
    "import { verifyPlugin } from '@netscript/plugin';",
    `import { ${descriptor.camelName}Plugin } from './mod.ts';`,
    '',
    `const result = verifyPlugin(${descriptor.camelName}Plugin, {`,
    `  name: '${descriptor.connectorPackage}',`,
    `  version: '${GENERATED_PLUGIN_VERSION}',`,
    '});',
    '',
    'if (!result.ok) {',
    "  console.error(result.findings.join('\\n'));",
    '  Deno.exit(1);',
    '}',
    '',
  ].join('\n');
}

function connectorPrismaSource(descriptor: NewPluginDescriptor): string {
  return [
    `// Optional ${descriptor.name} plugin schema extension.`,
    '',
  ].join('\n');
}

function connectorStubSource(descriptor: NewPluginDescriptor): string {
  return [
    "import { defineStub, type StubSource } from '@netscript/plugin/scaffold';",
    '',
    `export const ${descriptor.camelName}Stub: StubSource<'IDENTIFIER' | 'PLUGIN'> = defineStub({`,
    '  source: [',
    "    'export const %%IDENTIFIER%% = {',",
    '    "  plugin: \'%%PLUGIN%%\',",',
    "    '};',",
    "    '',",
    "  ].join('\\n'),",
    "  tokens: ['IDENTIFIER', 'PLUGIN'] as const,",
    '});',
    '',
  ].join('\n');
}

function connectorScaffolderSource(descriptor: NewPluginDescriptor): string {
  const registry = renderRegistrySource(defineRegistryModule({
    imports: [{
      alias: `${descriptor.camelName}StubModule`,
      specifier: `./${descriptor.name}.stub.ts`,
    }],
    exportName: `${descriptor.camelName}ScaffolderRegistry`,
    entries: [`${descriptor.camelName}StubModule`],
  }));
  return [
    "import { type ItemScaffolder, substituteTokens, textArtifact } from '@netscript/plugin/scaffold';",
    `import { ${descriptor.camelName}Stub } from './${descriptor.name}.stub.ts';`,
    '',
    registry,
    `export const ${descriptor.camelName}Scaffolder: ItemScaffolder<{ readonly identifier: string }> = {`,
    `  name: '${descriptor.name}',`,
    '  emit(input) {',
    '    return [',
    '      textArtifact(',
    `        \`src/${descriptor.name}/\${input.identifier}.ts\`,`,
    `        substituteTokens(${descriptor.camelName}Stub, {`,
    '          IDENTIFIER: input.identifier,',
    `          PLUGIN: '${descriptor.connectorPackage}',`,
    '        }),',
    '      ),',
    '    ];',
    '  },',
    '};',
    '',
  ].join('\n');
}

function connectorServiceContextSource(descriptor: NewPluginDescriptor): string {
  return [
    `export interface ${descriptor.pascalName}RequestContext {`,
    '  readonly traceId?: string;',
    '}',
    '',
  ].join('\n');
}

function connectorServiceHandlersSource(descriptor: NewPluginDescriptor): string {
  return [
    "import { bindPluginContract } from '@netscript/plugin/service';",
    "import type { BoundPluginContract } from '@netscript/plugin/service';",
    `import { ${descriptor.camelName}ContractV1 } from '${descriptor.corePackage}/contracts/v1';`,
    `import type { ${descriptor.pascalName}RequestContext } from './context.ts';`,
    '',
    `type ${descriptor.pascalName}Router = ReturnType<typeof ${descriptor.camelName}ContractV1.$context<${descriptor.pascalName}RequestContext>>;`,
    '',
    `const bound${descriptor.pascalName}Contract: BoundPluginContract<${descriptor.pascalName}Router> = bindPluginContract(`,
    `  ${descriptor.camelName}ContractV1,`,
    `).context<${descriptor.pascalName}RequestContext>();`,
    '',
    `export const ${descriptor.camelName}Handlers: ReturnType<typeof bound${descriptor.pascalName}Contract.handlers> =`,
    `  bound${descriptor.pascalName}Contract.handlers({`,
    '    describe: bound' + descriptor.pascalName + 'Contract.router.describe.handler(() => ({',
    `      pluginName: '${descriptor.connectorPackage}',`,
    "      contractVersions: ['v1'],",
    `      routeGroups: ['${descriptor.name}'],`,
    `      capabilities: ['${descriptor.kind}'],`,
    '    })),',
    `    list${descriptor.pascalName}s: bound${descriptor.pascalName}Contract.router.list${descriptor.pascalName}s.handler(() => []),`,
    '  });',
    '',
    `export const ${descriptor.camelName}Router: ReturnType<typeof bound${descriptor.pascalName}Contract.assemble> = bound${descriptor.pascalName}Contract`,
    '  .assemble({',
    "    version: 'v1',",
    `    namespace: '${descriptor.name}',`,
    `    handlers: ${descriptor.camelName}Handlers,`,
    '  });',
    '',
  ].join('\n');
}

function connectorServiceMainSource(descriptor: NewPluginDescriptor): string {
  return [
    "import { createPluginService } from '@netscript/plugin/service';",
    `import { ${descriptor.camelName}Router } from './handlers.ts';`,
    '',
    `export const ${descriptor.camelName}Service: ReturnType<typeof createPluginService<typeof ${descriptor.camelName}Router>> =`,
    `  createPluginService(${descriptor.camelName}Router, {`,
    `    name: '${descriptor.name}',`,
    `    version: '${GENERATED_PLUGIN_VERSION}',`,
    "    openApi: { title: '" + descriptor.pascalName + " API' },",
    '  });',
    '',
    'if (import.meta.main) {',
    `  await ${descriptor.camelName}Service.serve();`,
    '}',
    '',
  ].join('\n');
}

function connectorManifestTestSource(descriptor: NewPluginDescriptor): string {
  return [
    "import { assertEquals } from '@std/assert';",
    `import { ${descriptor.camelName}Plugin } from '../../mod.ts';`,
    '',
    `Deno.test('${descriptor.name} plugin manifest carries package identity', () => {`,
    `  assertEquals(${descriptor.camelName}Plugin.name, '${descriptor.connectorPackage}');`,
    `  assertEquals(${descriptor.camelName}Plugin.version, '${GENERATED_PLUGIN_VERSION}');`,
    '});',
    '',
  ].join('\n');
}

function coreReadme(descriptor: NewPluginDescriptor): string {
  return [
    `# ${descriptor.corePackage}`,
    '',
    `Core engine package for the NetScript ${descriptor.name} plugin.`,
    '',
    'The engine owns the domain, ports, application orchestration, contracts, and testing doubles.',
    'The connector package implements these seams and is the right place for service/runtime wiring.',
    '',
    '## Public Subpaths',
    '',
    '- `.`: curated builders and domain types',
    '- `./contracts/v1`: contract surface',
    '- `./domain`: domain entities',
    '- `./ports`: engine ports',
    '- `./testing`: in-memory doubles',
    '',
  ].join('\n');
}

function connectorReadme(descriptor: NewPluginDescriptor): string {
  return [
    `# ${descriptor.connectorPackage}`,
    '',
    `Thin NetScript connector for \`${descriptor.corePackage}\`.`,
    '',
    '## Install',
    '',
    `\`\`\`sh`,
    `netscript plugin install ${descriptor.connectorPackage}`,
    `\`\`\``,
    '',
    '## Public Subpaths',
    '',
    '- `.`: plugin manifest',
    '- `./contracts`: v1 contract re-export',
    '- `./services`: service entrypoint',
    '- `./aspire`: Aspire contribution',
    '- `./cli`: CLI adapter',
    '- `./scaffold`: scaffold adapter',
    '',
  ].join('\n');
}

function normalizePluginName(input: string): string {
  const packageSegment = input.split('/').at(-1)?.trim() ?? '';
  const stripped = packageSegment.replace(/^plugin-/, '');
  const normalized = stripped.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!normalized || normalized.includes('--')) {
    throw new UsageError(
      EXIT_CODES.SCAFFOLD_FAILED,
      `Plugin name is invalid: ${input}`,
    );
  }
  return normalized;
}

function toPascalCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
