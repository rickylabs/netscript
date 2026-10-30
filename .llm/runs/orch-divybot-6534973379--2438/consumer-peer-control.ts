import { assert, assertEquals, assertStringIncludes } from '@std/assert';

// Intentionally unlocked consumer control: compare the published peer policy
// with the broken upstream combination, independently of the workspace lock.
const root = new URL('../../../', import.meta.url);
const config = JSON.parse(await Deno.readTextFile(new URL('deno.json', root)));
const directory = await Deno.makeTempDir();
try {
  const imports: Record<string, string> = Object.fromEntries(
    Object.entries(config.catalog).map(([name, version]) => [name, `npm:${name}@${version}`]),
  );
  imports['@opentelemetry/api'] = 'npm:@opentelemetry/api@1.9.1';
  imports['@orpc/otel'] = 'npm:@orpc/otel@1.16.1';
  imports['@netscript/telemetry/orpc'] = new URL('packages/telemetry/orpc.ts', root).href;
  const source = `${directory}/consumer.ts`;
  await Deno.writeTextFile(
    source,
    "import { ORPCInstrumentation } from '@orpc/otel';\n" +
      "import { TracingPlugin } from '@netscript/telemetry/orpc';\n" +
      "if (!ORPCInstrumentation || !TracingPlugin) throw Error('missing consumer exports');\n",
  );
  const run = async (instrumentation: string): Promise<Deno.CommandOutput> => {
    imports['@opentelemetry/instrumentation'] =
      `npm:@opentelemetry/instrumentation@${instrumentation}`;
    await Deno.writeTextFile(
      `${directory}/deno.json`,
      JSON.stringify({ catalog: config.catalog, imports }),
    );
    return await new Deno.Command(Deno.execPath(), {
      args: ['run', '--no-lock', '-A', '--config', `${directory}/deno.json`, source],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
  };
  const bounded = await run(config.catalog['@opentelemetry/instrumentation']);
  assertEquals(bounded.code, 0, new TextDecoder().decode(bounded.stderr));
  assert(!new TextDecoder().decode(bounded.stderr).includes('peer @opentelemetry/api'));
  const drift = await run('0.300.0');
  assert(drift.code !== 0);
  assertStringIncludes(
    new TextDecoder().decode(drift.stderr),
    "does not provide an export named 'logs'",
  );
  console.log(JSON.stringify({
    bounded: {
      api: '1.9.1',
      orpcOtel: '1.16.1',
      instrumentation: '0.223.0',
      exitCode: bounded.code,
    },
    negative: { instrumentation: '0.300.0', exitCode: drift.code, missingLogs: true },
  }));
} finally {
  await Deno.remove(directory, { recursive: true });
}
