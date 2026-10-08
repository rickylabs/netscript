/** Qualify public exports against an exact stable release without provider IO. @module */

const target = Deno.args[0];
const rehearsal = target === '--source-rehearsal';
if (
  Deno.args.length !== 1 ||
  (!rehearsal && !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(target ?? ''))
) {
  throw new Error(
    'Pass one exact stable version, or --source-rehearsal. Ranges and canaries reject.',
  );
}

const packageRoot = new URL('../../../packages/ai/', import.meta.url);
const sourceTest = new URL('tests/anthropic_forward_compatible_test.ts', packageRoot);
const replacements = new Map([
  ['../anthropic.ts', '@netscript/ai/anthropic'],
  ['../mod.ts', '@netscript/ai'],
  ['../src/contracts/errors.ts', '@netscript/ai/contracts'],
  ['../src/contracts/tool.ts', '@netscript/ai/contracts'],
  ['../src/ports/chat-client.ts', '@netscript/ai/ports'],
]);
let fixture = await Deno.readTextFile(sourceTest);
for (const [from, to] of replacements) {
  if (!fixture.includes(`'${from}'`)) throw new Error(`Regression import changed: ${from}`);
  fixture = fixture.replaceAll(`'${from}'`, `'${to}'`);
}
if (/from\s+['"]\.\.?\//.test(fixture)) {
  throw new Error('Consumer still imports repository internals.');
}

const imports: Record<string, string> = {
  '@netscript/ai': rehearsal ? new URL('mod.ts', packageRoot).href : `jsr:@netscript/ai@${target}`,
  '@netscript/ai/anthropic': rehearsal
    ? new URL('anthropic.ts', packageRoot).href
    : `jsr:@netscript/ai@${target}/anthropic`,
  '@netscript/ai/contracts': rehearsal
    ? new URL('src/contracts/mod.ts', packageRoot).href
    : `jsr:@netscript/ai@${target}/contracts`,
  '@netscript/ai/ports': rehearsal
    ? new URL('src/ports/mod.ts', packageRoot).href
    : `jsr:@netscript/ai@${target}/ports`,
  '@std/assert': 'jsr:@std/assert@1.0.19',
  '@standard-schema/spec': 'jsr:@standard-schema/spec@1.1.0',
  '@tanstack/ai': 'npm:@tanstack/ai@0.52.3',
  '@tanstack/ai-anthropic': 'npm:@tanstack/ai-anthropic@0.18.3',
  'npm:@tanstack/ai@^0.52.0': 'npm:@tanstack/ai@0.52.3',
  'npm:@tanstack/ai-anthropic@^0.18.3': 'npm:@tanstack/ai-anthropic@0.18.3',
};
const directory = await Deno.makeTempDir({ prefix: 'anthropic-public-consumer-' });
const env: Record<string, string> = { NO_COLOR: '1' };
// Module resolution uses the existing cache/proxy configuration. Provider and
// GitHub credentials are deliberately absent from the child environment.
for (const key of ['PATH', 'HOME', 'DENO_DIR', 'TMPDIR', 'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY']) {
  const value = Deno.env.get(key);
  if (value !== undefined) env[key] = value;
}
const report: Record<string, unknown> = {
  mode: rehearsal ? 'source-rehearsal' : 'published-stable-consumer',
  requestedPackage: rehearsal ? 'local public exports' : `@netscript/ai@${target}`,
  expectedGraph: { core: '0.52.3', anthropic: '0.18.3' },
  publishedConsumerProof: false,
  providerRuntimeNetworkAllowed: false,
  liveInference: false,
};
let exitCode = 1;
try {
  const entrypoint = `${directory}/consumer.test.ts`;
  const importMap = `${directory}/imports.json`;
  await Deno.writeTextFile(entrypoint, fixture);
  await Deno.writeTextFile(importMap, JSON.stringify({ imports }, null, 2));
  const flags = [
    '--no-config',
    '--no-lock',
    '--minimum-dependency-age=0',
    '--import-map',
    importMap,
  ];
  const run = async (args: string[]): Promise<{ code: number; stdout: string; stderr: string }> => {
    const output = await new Deno.Command(Deno.execPath(), {
      args,
      cwd: directory,
      clearEnv: true,
      env,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    return {
      code: output.code,
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
    };
  };
  const graph = await run(['info', ...flags, '--json', entrypoint]);
  report.graphExitCode = graph.code;
  if (graph.code !== 0) {
    report.outcome = 'MODULE_GRAPH_UNAVAILABLE';
    report.diagnostics = graph.stderr.slice(0, 12000);
  } else {
    const info = JSON.parse(graph.stdout);
    const npm = Object.keys(info.npmPackages ?? {}).filter((name) =>
      name.startsWith('@tanstack/ai@') || name.startsWith('@tanstack/ai-anthropic@')
    );
    report.resolvedTanstackPackages = npm;
    if (
      npm.length !== 2 || !npm.some((name) => /^@tanstack\/ai@0\.52\.3(?:_|$)/.test(name)) ||
      !npm.some((name) => /^@tanstack\/ai-anthropic@0\.18\.3(?:_|$)/.test(name))
    ) {
      throw new Error('Resolved dependency graph differs from the qualified graph.');
    }
    const publishedModules = info.modules.filter((module: { specifier: string }) =>
      module.specifier.startsWith(`https://jsr.io/@netscript/ai/${target}/`)
    ).map((module: { specifier: string }) => module.specifier);
    report.resolvedPublishedModules = publishedModules;
    if (!rehearsal && publishedModules.length === 0) {
      throw new Error('No exact-version registry modules resolved.');
    }
    const check = await run(['check', ...flags, entrypoint]);
    report.publicTypecheckExitCode = check.code;
    if (check.code !== 0) {
      report.outcome = 'PUBLIC_TYPECHECK_FAILED';
      report.diagnostics = check.stderr.slice(0, 12000);
    } else {
      const tests = await run([
        'test',
        ...flags,
        '--allow-env',
        '--allow-read',
        '--reporter=tap',
        entrypoint,
      ]);
      report.testExitCode = tests.code;
      report.passed = (tests.stdout.match(/^ok\s+\d+/gm) ?? []).length;
      report.failed = (tests.stdout.match(/^not ok\s+\d+/gm) ?? []).length;
      report.outcome = tests.code === 0 ? 'PASS' : 'REGRESSION_FAILED';
      report.diagnostics = tests.code === 0
        ? undefined
        : (tests.stdout + tests.stderr).slice(-16000);
      report.publishedConsumerProof = !rehearsal && tests.code === 0;
      exitCode = tests.code;
    }
  }
} catch (error) {
  report.outcome = 'QUALIFICATION_REFUSED';
  report.diagnostics = error instanceof Error ? error.message : String(error);
} finally {
  await Deno.remove(directory, { recursive: true });
}
console.log(JSON.stringify(report));
Deno.exit(exitCode);
