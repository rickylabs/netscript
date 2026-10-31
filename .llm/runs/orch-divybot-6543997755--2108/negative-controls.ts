/** Disposable module mutations; original source and test assertions remain untouched. */
import { join, toFileUrl } from 'jsr:@std/path@^1';

const repo = Deno.cwd();
const scratch = await Deno.makeTempDir();
const decoder = new TextDecoder();
const runnerPath = 'plugins/sagas/src/runtime/saga-runner.ts';
const enginePath = 'packages/plugin-sagas-core/src/runtime/saga-engine.ts';
const reports: unknown[] = [];

async function moduleCopy(path: string): Promise<string> {
  const base = toFileUrl(join(repo, path));
  return (await Deno.readTextFile(base))
    .replace(/(from\s+|import\s*)['"](\.[^'"]+)['"]/g,
      (_all, prefix: string, specifier: string) => `${prefix}'${new URL(specifier, base).href}'`)
    .replace(/new URL\('([^']+)', import.meta.url\)/g,
      (_all, specifier: string) => `new URL('${new URL(specifier, base).href}')`);
}

try {
  const config = JSON.parse(await Deno.readTextFile('deno.json'));
  const imports: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.imports ?? {})) {
    if (typeof value !== 'string') throw new Error('Unexpected import map');
    imports[key] = value.startsWith('.') ? new URL(value, toFileUrl(repo + '/')).href : value;
  }
  imports['@std/path/to-file-url'] = 'jsr:@std/path@^1/to-file-url';
  const runner = join(scratch, 'saga-runner.ts');
  const engine = join(scratch, 'saga-engine.ts');
  const originalRunner = await moduleCopy(runnerPath);
  const originalEngine = await moduleCopy(enginePath);
  imports[toFileUrl(join(repo, enginePath)).href] = toFileUrl(engine).href;
  const map = join(scratch, 'imports.json');
  await Deno.writeTextFile(map, JSON.stringify({ imports }));
  const cases = [
    { name: 'runner-env-ignored', path: runner, original: originalRunner,
      before: "resolveSagaStoreBackend({ ...input, defaultBackend: 'kv' })",
      after: "resolveSagaStoreBackend({ defaultBackend: 'kv' })",
      test: 'saga-canonical-backend_test.ts', filter: 'canonical runner prisma from env' },
    { name: 'projection-setting-ignored', path: runner, original: originalRunner,
      before: 'resolveSagaProjectionBackend(input)', after: 'resolveSagaProjectionBackend({})',
      test: 'saga-kv-only-runner_test.ts', filter: 'runner boots with none projection, archiveToDb=false' },
    { name: 'duplicate-protection-removed', path: engine, original: originalEngine,
      before: 'const entries = this.#dispatchIndex.get(message.type);',
      after: 'message = { ...message, idempotencyKey: undefined };\n    const entries = this.#dispatchIndex.get(message.type);',
      test: 'saga-kv-only-runner_test.ts', filter: 'runner boots with kv projection, archiveToDb=false' },
  ];
  for (const control of cases) {
    await Deno.writeTextFile(runner, originalRunner);
    await Deno.writeTextFile(engine, originalEngine);
    const test = join(scratch, control.test);
    const source = await moduleCopy('plugins/sagas/tests/runtime/' + control.test);
    await Deno.writeTextFile(test, source.replace(toFileUrl(join(repo, runnerPath)).href, toFileUrl(runner).href));
    const run = async () => {
      const result = await new Deno.Command(Deno.execPath(), { args: [
        'run', '--no-lock', '--allow-read', '--allow-write', '--allow-run', '.llm/tools/run-deno-test.ts', '--',
        '--no-lock', '--config', join(repo, 'deno.json'), '--import-map', map, '--unstable-kv', '--allow-all',
        '--filter', control.filter, test,
      ], stdin: 'null', stdout: 'piped', stderr: 'piped' }).output();
      const output = decoder.decode(result.stdout);
      return { code: result.code, report: JSON.parse(output), output };
    };
    const baseline = await run();
    if (baseline.code !== 0 || baseline.report.summary.passed !== 1) throw new Error('Pristine control failed: ' + baseline.output);
    if (!control.original.includes(control.before)) throw new Error('Mutation target absent');
    await Deno.writeTextFile(control.path, control.original.replace(control.before, control.after));
    const mutant = await run();
    await Deno.writeTextFile(control.path, control.original);
    if (await Deno.readTextFile(control.path) !== control.original) throw new Error('Restoration failed');
    if (mutant.code === 0 || mutant.report.summary.failed !== 1 || mutant.report.processFailure) {
      throw new Error(control.name + ': expected one semantic failure: ' + mutant.output);
    }
    reports.push({ control: control.name, pristineExit: baseline.code, mutationExit: mutant.code,
      summary: mutant.report.summary,
      failingTests: mutant.report.failures.flatMap((failure: { tests: { name: string }[] }) => failure.tests.map((test) => test.name)),
      sourceRestored: true });
  }
  console.log(JSON.stringify({ controls: reports }, null, 2));
} finally {
  await Deno.remove(scratch, { recursive: true });
}
