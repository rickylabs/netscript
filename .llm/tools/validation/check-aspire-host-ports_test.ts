/**
 * @module tools/validation/check-aspire-host-ports_test
 *
 * The scanner must reject the exact source shapes that shipped #952 and accept
 * the shapes that replaced them.
 */
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';
import { scanContent, scanHostPorts } from './check-aspire-host-ports.ts';

const APPHOST = 'packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts';
const APPSETTINGS = 'packages/cli/src/kernel/templates/aspire/generate-appsettings.ts';
const GENERATOR =
  'packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts';
const CONTRIBUTION = 'plugins/workers/src/aspire/workers-contribution.ts';
const INFRASTRUCTURE =
  'packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts';

Deno.test('rejects the generated line that shipped #952', () => {
  const { findings } = scanContent(
    GENERATOR,
    "lines.push(`      .withHttpEndpoint({ port: 3000, env: 'PORT' });`);",
  );
  assertEquals(findings.length, 1);
  assert(findings[0].message.includes('HostPort'));
});

Deno.test('accepts a config-driven pin, which a resource opts into', () => {
  const { findings } = scanContent(
    GENERATOR,
    'lines.push(`      .${renderHttpEndpointCall(entry)};`);',
  );
  assertEquals(findings, []);
});

Deno.test('rejects a multiline generated literal host-port call', () => {
  const { findings } = scanContent(
    GENERATOR,
    [
      'lines.push(`      .withHttpEndpoint({',
      "        port: 3000, env: 'PORT'",
      '      });`);',
    ].join('\n'),
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].line, 1);
});

Deno.test('accepts the un-pinned shape', () => {
  const { findings } = scanContent(GENERATOR, "const options = `{ env: 'PORT' }`;");
  assertEquals(findings, []);
});

Deno.test('rejects every unconditional entry-port write that shipped #952', () => {
  // The four pre-fix lines, verbatim. None is a numeric literal — a rule that
  // matched only literals would look straight past the shape that shipped.
  const shipped = [
    [APPHOST, '        Port: appProxyPort,'],
    [APPHOST, '      Port: options.servicePort,'],
    [APPSETTINGS, '      Port: options.service.port,'],
    [APPSETTINGS, '        Port: appPort,'],
  ] as const;

  for (const [path, line] of shipped) {
    const { findings } = scanContent(path, line);
    assertEquals(findings.length, 1, `expected a finding for: ${line}`);
    assert(findings[0].message.includes('Aspire allocates'));
  }
});

Deno.test('accepts the conditional opt-in that replaced them', () => {
  const service = scanContent(
    APPHOST,
    '      ...(options.serviceHostPort ? { HostPort: options.serviceHostPort } : {}),',
  );
  const app = scanContent(APPSETTINGS, '        ...(appPort ? { HostPort: appPort } : {}),');
  assertEquals(service.findings, []);
  assertEquals(app.findings, []);
});

Deno.test('only checks entry ports in the files that compose appsettings entries', () => {
  const elsewhere = scanContent(
    'packages/cli/src/kernel/constants/port-ranges.ts',
    '  Port: 3000,',
  );
  assertEquals(elsewhere.findings, []);
});

Deno.test('honours an explicit justification marker', () => {
  const { findings, allowances } = scanContent(
    APPHOST,
    '        Port: 5432, // aspire-host-port-ok: fixed by an external contract',
  );
  assertEquals(findings, []);
  assertEquals(allowances.length, 1);
  assertEquals(allowances[0].reason, 'fixed by an external contract');
});

Deno.test('treats an empty justification as a failure', () => {
  const { findings, allowances } = scanContent(
    APPHOST,
    '        Port: 5432, // aspire-host-port-ok:',
  );
  assertEquals(allowances, []);
  assertEquals(findings.length, 1);
  assert(findings[0].message.includes('empty reason'));
});

Deno.test('rejects a pinned host port in a generated appsettings file', () => {
  const result = scanContent(
    'fixture/aspire/appsettings.json',
    '{\n  "Resources": { "api": { "HostPort": 8091 } }\n}\n',
  );
  assertEquals(result.findings.length, 1);
});

Deno.test('does not descend into generated runtime state', async () => {
  const root = await Deno.makeTempDir();
  try {
    const stateDir = join(root, '.data', 'postgres');
    await Deno.mkdir(stateDir, { recursive: true });
    await Deno.writeTextFile(
      join(stateDir, 'appsettings.json'),
      '{"Resources":{"db":{"HostPort":5432}}}',
    );

    const result = await scanHostPorts([root]);
    assertEquals(result.scannedFiles, 0);
    assertEquals(result.findings, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('rejects contribution fallback ports and loopback URL literals', () => {
  const fallback = scanContent(
    CONTRIBUTION,
    'const port = ctx.port(WORKERS_API_RESOURCE, WORKERS_API_DEFAULT_PORT);',
  );
  const url = scanContent(
    CONTRIBUTION,
    'url: `http://localhost:${WORKERS_API_DEFAULT_PORT}/health`,',
  );
  assertEquals(fallback.findings.length, 1);
  assertEquals(url.findings.length, 1);
});

Deno.test('rejects a multiline contribution fallback port with the call line', () => {
  const result = scanContent(
    CONTRIBUTION,
    ['const port = ctx.port(resource,', '  defaultPort', ');'].join('\n'),
  );
  assertEquals(result.findings.length, 1);
  assertEquals(result.findings[0].line, 1);
});

Deno.test('accepts a single-argument contribution port call', () => {
  const result = scanContent(CONTRIBUTION, 'const port = ctx.port(resource);');
  assertEquals(result.findings, []);
});

Deno.test('accepts allocated contribution ports and resource references', () => {
  const allocated = scanContent(
    CONTRIBUTION,
    'const port = ctx.port(WORKERS_API_RESOURCE);',
  );
  const reference = scanContent(
    CONTRIBUTION,
    "WORKERS_API_URL: { kind: 'resource', resource: WORKERS_API_RESOURCE, key: 'url' },",
  );
  assertEquals(allocated.findings, []);
  assertEquals(reference.findings, []);
});

Deno.test('rejects generated infrastructure host-port literals', () => {
  const result = scanContent(INFRASTRUCTURE, "lines.push('    port: 5432,')");
  assertEquals(result.findings.length, 1);
});

Deno.test('accepts explicit-only infrastructure host-port interpolation', () => {
  const result = scanContent(INFRASTRUCTURE, 'lines.push(`    port: ${entry.Port},`)');
  assertEquals(result.findings, []);
});

Deno.test('S5 runtime literal grep excludes generated barrels and allows only compatibility contracts', async () => {
  const pattern = String.raw`809[1-4]|4437|127\.0\.0\.1:80`;
  const output = await new Deno.Command('git', {
    args: [
      'grep',
      '-nE',
      pattern,
      '--',
      'plugins',
      'packages/cli/src',
      'packages/cli/e2e',
      ':(exclude,glob)**/*.generated.ts',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout).trim();
  const lines = stdout.length === 0 ? [] : stdout.split('\n');
  const unexpected = lines.filter((line) => {
    const path = line.slice(0, line.indexOf(':'));
    return path !== 'plugins/auth/src/constants.ts' &&
      path !== 'plugins/auth/tests/public/deprecated-default-port_test.ts' &&
      path !== 'plugins/sagas/src/constants.ts' &&
      path !== 'plugins/sagas/tests/public/deprecated-default-port_test.ts' &&
      path !== 'plugins/triggers/src/constants.ts' &&
      path !== 'plugins/triggers/tests/public/deprecated-default-port_test.ts';
  });

  assertEquals(unexpected, []);
});
