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
