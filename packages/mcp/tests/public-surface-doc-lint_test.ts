import { assert, assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
import type * as cli from '../cli.ts';
import type * as mod from '../mod.ts';
import type * as openApiProjection from '../openapi-projection.ts';
import type { GetOperationSchemaResult, ServiceOperationSummary } from '../mod.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false;

// Compile-time guard: the types reachable from public read-tool results are exported by `.` and
// `./cli`, and are the same declarations `./openapi-projection` publishes (not duplicates).
const accessFromRoot: Equal<mod.OperationAccessSummary, openApiProjection.OperationAccessSummary> =
  true;
const accessFromCli: Equal<cli.OperationAccessSummary, openApiProjection.OperationAccessSummary> =
  true;
const viewFromRoot: Equal<mod.SchemaViewName, openApiProjection.SchemaViewName> = true;
const viewFromCli: Equal<cli.SchemaViewName, openApiProjection.SchemaViewName> = true;
const summaryAccess: Equal<
  NonNullable<ServiceOperationSummary['access']>,
  mod.OperationAccessSummary
> = true;
const schemaAccess: Equal<
  NonNullable<GetOperationSchemaResult['access']>,
  mod.OperationAccessSummary
> = true;
const schemaView: Equal<GetOperationSchemaResult['view'], mod.SchemaViewName> = true;

const packageRoot = fromFileUrl(new URL('../', import.meta.url));

async function readExportEntrypoints(): Promise<readonly string[]> {
  const manifest = JSON.parse(await Deno.readTextFile(`${packageRoot}deno.json`)) as {
    readonly exports: Readonly<Record<string, string>>;
  };
  return Object.values(manifest.exports);
}

Deno.test('MCP result types are re-exported from the root and cli entrypoints', () => {
  assertEquals(
    [
      accessFromRoot,
      accessFromCli,
      viewFromRoot,
      viewFromCli,
      summaryAccess,
      schemaAccess,
      schemaView,
    ],
    [true, true, true, true, true, true, true],
  );
});

Deno.test('every MCP export-map entrypoint passes deno doc --lint on its own', async () => {
  const entrypoints = await readExportEntrypoints();
  assertEquals(entrypoints, ['./mod.ts', './cli.ts', './openapi-projection.ts']);
  for (const entrypoint of entrypoints) {
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['doc', '--lint', entrypoint],
      cwd: packageRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const diagnostics = new TextDecoder().decode(output.stderr);
    assert(
      !diagnostics.includes('private-type-ref'),
      `${entrypoint} leaks a private type:\n${diagnostics}`,
    );
    assertEquals(output.code, 0, `${entrypoint} failed deno doc --lint:\n${diagnostics}`);
  }
});
