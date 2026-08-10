import { fromFileUrl, join } from '@std/path';

const DATABASE_ZOD_ALIAS = '@database/zod';
const ROOT_ZOD_TARGET = './database/postgres/schema/.generated/zod/crud.ts';
const CONTRACTS_ZOD_TARGET = '../database/postgres/schema/.generated/zod/crud.ts';
const REPO_CONFIG = fromFileUrl(new URL('../../../deno.json', import.meta.url));

const PRODUCT_MODEL = `import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  warehouseId: z.number().int().positive(),
  internalCost: z.number().nonnegative(),
  deletedAt: z.date().nullable(),
});
`;

const PRODUCT_CREATE_INPUT = `import { z } from 'zod';

export const ProductInputSchema = z.object({
  name: z.string().min(1),
  warehouseId: z.number().int().positive(),
  internalCost: z.number().nonnegative(),
});
`;

const PRODUCT_UPDATE_INPUT = `import { z } from 'zod';

export const ProductUpdateInputObjectZodSchema = z.object({
  name: z.string().min(1).optional(),
  warehouseId: z.number().int().positive().optional(),
  internalCost: z.number().nonnegative().optional(),
  deletedAt: z.date().nullable().optional(),
});
`;

const WAREHOUSE_MODEL = `import { z } from 'zod';

export const WarehouseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  internalRegionCode: z.string().min(1),
});
`;

const WAREHOUSE_CREATE_INPUT = `import { z } from 'zod';

export const WarehouseInputSchema = z.object({
  name: z.string().min(1),
  internalRegionCode: z.string().min(1),
});
`;

const WAREHOUSE_UPDATE_INPUT = `import { z } from 'zod';

export const WarehouseUpdateInputObjectZodSchema = z.object({
  name: z.string().min(1).optional(),
  internalRegionCode: z.string().min(1).optional(),
});
`;

/**
 * Contract-derivation snippets shared verbatim with the documentation pages.
 *
 * The public API deliberately selects fields instead of exposing persistence-only columns. The
 * relation is explicit composition: the generated barrel does not promise relation-aware schemas.
 */
export const DOCUMENTED_CONTRACT_DERIVATION: string = `import { z } from 'zod';
import {
  ProductCreateInput,
  ProductSchema,
  ProductUpdateInput,
  WarehouseSchema,
} from '@database/zod';

export const ProductApiSchemaV1 = ProductSchema.pick({
  id: true,
  name: true,
  warehouseId: true,
}).extend({
  warehouse: WarehouseSchema.pick({ id: true, name: true }),
});

export const ProductCreateApiSchemaV1 = ProductCreateInput.pick({
  name: true,
  warehouseId: true,
});

export const ProductUpdateApiSchemaV1 = ProductUpdateInput.pick({
  name: true,
  warehouseId: true,
});

export const ProductResponseSchemaV1 = z.object({
  item: ProductApiSchemaV1,
});
`;

const ROOT_ALIAS_CONSUMER = `import { ProductSchema } from '@database/zod';

ProductSchema.parse({
  id: 1,
  name: 'Desk lamp',
  warehouseId: 2,
  internalCost: 15,
  deletedAt: null,
});
`;

export type NegativeFixture = 'root-alias' | 'contracts-alias' | 'barrel-export';

export interface ContractDerivationResult {
  readonly rootAlias: string;
  readonly contractsAlias: string;
  readonly rootCheckCode: number;
  readonly contractsCheckCode: number;
}

function sourceUrl(path: string): string {
  return new URL(path, import.meta.url).href;
}

function scaffoldProbeSource(): string {
  return `import { join } from 'jsr:@std/path@1';
import { writeCrudZodBarrel } from ${
    JSON.stringify(
      sourceUrl('../../../packages/database/scripts/fix-zod-imports.ts'),
    )
  };
import { Scaffolder } from ${
    JSON.stringify(
      sourceUrl('../../../packages/cli/src/kernel/adapters/scaffold/scaffolder.ts'),
    )
  };
import { StringTemplateAdapter } from ${
    JSON.stringify(
      sourceUrl('../../../packages/cli/src/kernel/adapters/scaffold/template-adapter.ts'),
    )
  };
import { DenoFileSystem } from ${
    JSON.stringify(
      sourceUrl(
        '../../../packages/cli/src/kernel/adapters/runtime/file-system/deno-file-system.ts',
      ),
    )
  };
import { scaffoldRoot } from ${
    JSON.stringify(
      sourceUrl('../../../packages/cli/src/kernel/application/scaffold/plan-init.ts'),
    )
  };
import { scaffoldContracts } from ${
    JSON.stringify(
      sourceUrl('../../../packages/cli/src/kernel/application/scaffold/workspace-init.ts'),
    )
  };

const root = Deno.args[0];
const fs = new DenoFileSystem();
const templateAdapter = new StringTemplateAdapter(fs);
const scaffolder = new Scaffolder(templateAdapter, fs);
const emptyResult = {
  filesCreated: [], directoriesCreated: [], filesSkipped: [], totalOperations: 0, durationMs: 0,
};
const context = {
  scaffolder,
  fs,
  templateAdapter,
  process: { exec: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }) },
  jsrResolver: {
    resolveImport: (specifier) => specifier,
    resolveImports: (specifiers) => Object.fromEntries(specifiers.map((value) => [value, value])),
  },
  cwd: () => root,
  resolveModeFields: () => ({}),
  packagesAsWorkspaceMembers: () => false,
  scaffoldWorkspacePackages: () => Promise.resolve(emptyResult),
};
const options = {
  name: 'docs-contract-derivation',
  appName: 'dashboard',
  targetPath: root,
  importMode: 'jsr',
  editor: 'none',
  force: true,
  ci: true,
  dryRun: false,
  noGit: true,
  noAspire: true,
  dbEngine: 'postgres',
  cache: false,
  cacheBackend: 'redis',
  includeExampleService: false,
  modelName: 'Product',
};

await scaffoldRoot(context, options);
await scaffoldContracts(context, options);

const databaseRoot = join(root, 'database', 'postgres');
const zodOutputDir = join(databaseRoot, 'schema', '.generated', 'zod');
const modelsDir = join(zodOutputDir, 'schemas', 'models');
const inputsDir = join(zodOutputDir, 'schemas', 'variants', 'input');
const objectsDir = join(zodOutputDir, 'schemas', 'objects');
await Promise.all([
  Deno.mkdir(modelsDir, { recursive: true }),
  Deno.mkdir(inputsDir, { recursive: true }),
  Deno.mkdir(objectsDir, { recursive: true }),
]);
await Promise.all([
  Deno.writeTextFile(join(modelsDir, 'Product.schema.ts'), ${JSON.stringify(PRODUCT_MODEL)}),
  Deno.writeTextFile(join(inputsDir, 'Product.input.ts'), ${JSON.stringify(PRODUCT_CREATE_INPUT)}),
  Deno.writeTextFile(join(objectsDir, 'ProductUpdateInput.schema.ts'), ${
    JSON.stringify(PRODUCT_UPDATE_INPUT)
  }),
  Deno.writeTextFile(join(modelsDir, 'Warehouse.schema.ts'), ${JSON.stringify(WAREHOUSE_MODEL)}),
  Deno.writeTextFile(join(inputsDir, 'Warehouse.input.ts'), ${
    JSON.stringify(WAREHOUSE_CREATE_INPUT)
  }),
  Deno.writeTextFile(join(objectsDir, 'WarehouseUpdateInput.schema.ts'), ${
    JSON.stringify(WAREHOUSE_UPDATE_INPUT)
  }),
]);
await writeCrudZodBarrel({ zodOutputDir, modelName: 'Product' });
await Deno.writeTextFile(
  join(databaseRoot, 'deno.json'),
  JSON.stringify({
    name: '@docs/database-postgres',
    version: '0.0.0',
    exports: './mod.ts',
    imports: { zod: 'npm:zod@^4.3.6' },
  }, null, 2) + '\\n',
);
await Deno.writeTextFile(join(databaseRoot, 'mod.ts'), 'export {};\\n');
await Deno.mkdir(join(root, 'plugins'), { recursive: true });
await Deno.writeTextFile(
  join(root, 'plugins', 'deno.json'),
  JSON.stringify({ name: '@docs/plugins', version: '0.0.0', exports: './mod.ts' }, null, 2) + '\\n',
);
await Deno.writeTextFile(join(root, 'plugins', 'mod.ts'), 'export {};\\n');
`;
}

async function runScaffoldProbe(root: string): Promise<void> {
  const probePath = join(root, 'scaffold-probe.ts');
  await Deno.writeTextFile(probePath, scaffoldProbeSource());
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--no-lock',
      '--no-check',
      '--config',
      REPO_CONFIG,
      '--allow-read',
      '--allow-write',
      probePath,
      root,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code !== 0) throw checkFailure('real scaffold emitter probe', output);
}

async function runCheck(
  root: string,
  config: string,
  entrypoint: string,
): Promise<Deno.CommandOutput> {
  return await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      'check',
      '--no-lock',
      '--unstable-kv',
      '--config',
      config,
      entrypoint,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}

function checkFailure(label: string, output: Deno.CommandOutput): Error {
  const decoder = new TextDecoder();
  return new Error(
    `${label} failed with exit ${output.code}\n${decoder.decode(output.stdout)}${
      decoder.decode(output.stderr)
    }`,
  );
}

async function moveAlias(configPath: string, target: string): Promise<void> {
  const config = JSON.parse(await Deno.readTextFile(configPath));
  config.imports[DATABASE_ZOD_ALIAS] = target.replace('crud.ts', 'moved.ts');
  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2) + '\n');
}

/** Build and compile the documented generated-schema contract path through both real aliases. */
export async function checkDocsContractDerivation(
  negative?: NegativeFixture,
): Promise<ContractDerivationResult> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-docs-contract-derivation-' });
  try {
    await runScaffoldProbe(root);

    const rootConfigPath = join(root, 'deno.json');
    const contractsConfigPath = join(root, 'contracts', 'deno.json');
    const rootConfig = JSON.parse(await Deno.readTextFile(rootConfigPath));
    const contractsConfig = JSON.parse(await Deno.readTextFile(contractsConfigPath));
    const rootAlias = rootConfig.imports[DATABASE_ZOD_ALIAS];
    const contractsAlias = contractsConfig.imports[DATABASE_ZOD_ALIAS];

    if (rootAlias !== ROOT_ZOD_TARGET) {
      throw new Error(`Unexpected root ${DATABASE_ZOD_ALIAS} target: ${rootAlias}`);
    }
    if (contractsAlias !== CONTRACTS_ZOD_TARGET) {
      throw new Error(`Unexpected contracts ${DATABASE_ZOD_ALIAS} target: ${contractsAlias}`);
    }

    const databaseRoot = join(root, 'database', 'postgres');
    const zodOutputDir = join(databaseRoot, 'schema', '.generated', 'zod');
    await Deno.writeTextFile(join(root, 'root-import-check.ts'), ROOT_ALIAS_CONSUMER);
    await Deno.writeTextFile(
      join(root, 'contracts', 'versions', 'v1', 'products.contract.ts'),
      DOCUMENTED_CONTRACT_DERIVATION,
    );

    if (negative === 'root-alias') {
      await moveAlias(rootConfigPath, ROOT_ZOD_TARGET);
    } else if (negative === 'contracts-alias') {
      await moveAlias(contractsConfigPath, CONTRACTS_ZOD_TARGET);
    } else if (negative === 'barrel-export') {
      const barrelPath = join(zodOutputDir, 'crud.ts');
      const barrel = await Deno.readTextFile(barrelPath);
      await Deno.writeTextFile(
        barrelPath,
        barrel.replace('ProductInputSchema as ProductCreateInput', 'ProductInputSchema'),
      );
    }

    const rootCheck = await runCheck(root, rootConfigPath, join(root, 'root-import-check.ts'));
    if (rootCheck.code !== 0) throw checkFailure('root alias compile', rootCheck);

    const contractsCheck = await runCheck(
      root,
      contractsConfigPath,
      join(root, 'contracts', 'versions', 'v1', 'products.contract.ts'),
    );
    if (contractsCheck.code !== 0) throw checkFailure('contracts-member compile', contractsCheck);

    return {
      rootAlias,
      contractsAlias,
      rootCheckCode: rootCheck.code,
      contractsCheckCode: contractsCheck.code,
    };
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

function parseNegative(args: readonly string[]): NegativeFixture | undefined {
  const value = args.find((arg) => arg.startsWith('--negative='))?.slice('--negative='.length);
  if (value === undefined) return undefined;
  if (value === 'root-alias' || value === 'contracts-alias' || value === 'barrel-export') {
    return value;
  }
  throw new Error(`Unknown negative fixture: ${value}`);
}

if (import.meta.main) {
  const result = await checkDocsContractDerivation(parseNegative(Deno.args));
  console.log('docs:contract-derivation PASS');
  console.log(`root alias: ${result.rootAlias}`);
  console.log(`contracts alias: ${result.contractsAlias}`);
  console.log(`root alias compile exit: ${result.rootCheckCode}`);
  console.log(`contracts-member compile exit: ${result.contractsCheckCode}`);
}
