import { assertEquals, assertStringIncludes } from '@std/assert';
import type { SourceOutcome } from '../src/ports/service-endpoint-directory-port.ts';
import { AppsettingsEndpointSource } from '../src/infrastructure/service-endpoints/appsettings-endpoint-source.ts';
import { AspireCliEndpointSource } from '../src/infrastructure/service-endpoints/aspire-cli-endpoint-source.ts';
import { OverrideEndpointSource } from '../src/infrastructure/service-endpoints/override-endpoint-source.ts';
import { RunManifestEndpointSource } from '../src/infrastructure/service-endpoints/run-manifest-endpoint-source.ts';
import {
  APPSETTINGS_FIXTURE,
  ASPIRE_DESCRIBE_FIXTURE,
} from './service-endpoint-source-fixtures.ts';

function missingFile(): Promise<string> {
  return Promise.reject(new Deno.errors.NotFound('fixture absent'));
}

function jsonFile(value: unknown): (path: string) => Promise<string> {
  const text = JSON.stringify(value);
  return () => Promise.resolve(text);
}

function failedCode(outcome: SourceOutcome): string | undefined {
  return outcome.outcome === 'failed' ? outcome.code : undefined;
}

Deno.test('override source exposes used, absent, and failed outcomes without decoding sibling policy', async () => {
  const projectRoot = '/project';
  assertEquals(
    (await new OverrideEndpointSource({ readText: missingFile }).read({ projectRoot })).outcome,
    'absent',
  );

  const used = new OverrideEndpointSource({
    readText: jsonFile({
      endpointExecution: { enabled: true },
      futurePolicy: { preserved: true },
      introspection: {
        serviceEndpoints: {
          public: 'https://api.example.test/base/?ignored=yes#fragment',
          users: 'http://127.0.0.1:43127/',
        },
        excludeServices: ['secret', 'secret'],
        futureIntrospectionPolicy: true,
      },
    }),
  });
  assertEquals(await used.read({ projectRoot }), {
    source: 'override',
    outcome: 'used',
    candidates: [
      {
        name: 'public',
        baseUrl: 'https://api.example.test/base',
        source: 'override',
        operatorTrusted: true,
      },
      {
        name: 'users',
        baseUrl: 'http://127.0.0.1:43127',
        source: 'override',
        operatorTrusted: true,
      },
    ],
    excludedServices: ['secret'],
  });

  const invalid = new OverrideEndpointSource({
    readText: () => Promise.resolve('{ "introspection": { "serviceEndpoints": [] } }'),
  });
  assertEquals(failedCode(await invalid.read({ projectRoot })), 'invalid');
});

Deno.test('appsettings source preserves unpinned services and distinguishes torn configuration', async () => {
  const projectRoot = '/project';
  assertEquals(
    (await new AppsettingsEndpointSource({ readText: missingFile }).read({ projectRoot })).outcome,
    'absent',
  );

  const used = new AppsettingsEndpointSource({ readText: jsonFile(APPSETTINGS_FIXTURE) });
  assertEquals(await used.read({ projectRoot }), {
    source: 'appsettings',
    outcome: 'used',
    candidates: [
      {
        name: 'billing',
        baseUrl: 'http://127.0.0.1:43128',
        source: 'appsettings',
        operatorTrusted: false,
      },
      {
        name: 'legacy',
        baseUrl: 'http://127.0.0.1:43129',
        source: 'appsettings',
        operatorTrusted: false,
      },
      { name: 'users', source: 'appsettings', operatorTrusted: false },
    ],
    excludedServices: [],
  });

  const torn = new AppsettingsEndpointSource({ readText: () => Promise.resolve('{ torn') });
  assertEquals(failedCode(await torn.read({ projectRoot })), 'invalid');
});

Deno.test('run manifest requires real project identity and an expected current run id', async () => {
  const projectRoot = '/project';
  assertEquals(
    (await new RunManifestEndpointSource({ readText: missingFile }).read({
      projectRoot,
      expectedRunId: 'run-1',
    })).outcome,
    'absent',
  );

  const manifest = {
    schemaVersion: 1,
    projectRoot,
    runId: 'run-1',
    services: [{ service: 'users', endpoint: 'http', url: 'http://localhost:43127' }],
  };
  const source = new RunManifestEndpointSource({
    readText: jsonFile(manifest),
    realPath: (path) => Promise.resolve(path),
  });
  assertEquals(failedCode(await source.read({ projectRoot })), 'expected_run_id_missing');
  assertEquals(
    failedCode(await source.read({ projectRoot, expectedRunId: 'old-run' })),
    'run_id_mismatch',
  );
  assertEquals(await source.read({ projectRoot, expectedRunId: 'run-1' }), {
    source: 'run-manifest',
    outcome: 'used',
    candidates: [{
      name: 'users',
      baseUrl: 'http://127.0.0.1:43127',
      source: 'run-manifest',
      operatorTrusted: false,
    }],
    excludedServices: [],
  });

  const foreign = new RunManifestEndpointSource({
    readText: jsonFile({ ...manifest, projectRoot: '/foreign' }),
    realPath: (path) => Promise.resolve(path),
  });
  assertEquals(
    failedCode(await foreign.read({ projectRoot, expectedRunId: 'run-1' })),
    'project_root_mismatch',
  );
});

Deno.test('torn manifest remains failed while healthy appsettings remains independently usable', async () => {
  const projectRoot = '/project';
  const manifest = await new RunManifestEndpointSource({
    readText: () => Promise.resolve('{ "runId":'),
  }).read({ projectRoot, expectedRunId: 'run-1' });
  const appsettings = await new AppsettingsEndpointSource({
    readText: jsonFile(APPSETTINGS_FIXTURE),
  }).read({ projectRoot });
  assertEquals(failedCode(manifest), 'invalid');
  assertEquals(appsettings.outcome, 'used');
  assertEquals(appsettings.candidates.length, 3);
});

Deno.test('Aspire CLI source uses the 13.4 machine query and parses banner-prefixed resources', async () => {
  const calls: Array<{ command: string; args: readonly string[] }> = [];
  let invocation = 0;
  const source = new AspireCliEndpointSource({
    execute: (command, args) => {
      calls.push({ command, args });
      invocation++;
      return Promise.resolve(
        invocation === 2 ? { code: 0, stdout: ASPIRE_DESCRIBE_FIXTURE, stderr: '' } : {
          code: 0,
          stdout: '[{"appHostPath":"/project/apphost.mts","appHostPid":4312}]',
          stderr: '',
        },
      );
    },
    realPath: (path) => Promise.resolve(path),
  });
  const outcome = await source.read({
    projectRoot: '/project',
    appHostPath: '/project/apphost.mts',
  });
  assertEquals(calls.map(({ args }) => args[0]), ['ps', 'describe', 'ps']);
  assertEquals(outcome, {
    source: 'aspire-cli',
    outcome: 'used',
    candidates: [
      {
        name: 'billing',
        baseUrl: 'http://127.0.0.2:43128',
        source: 'aspire-cli',
        operatorTrusted: false,
      },
      {
        name: 'users',
        baseUrl: 'http://127.0.0.1:43127',
        source: 'aspire-cli',
        operatorTrusted: false,
      },
    ],
    excludedServices: [],
  });
});

Deno.test('Aspire CLI absence, non-zero exit, and parse failure are explicit failed rows', async () => {
  const projectRoot = '/fixture';
  const missing = await new AspireCliEndpointSource({
    command: 'missing-aspire-fixture',
    realPath: (path) => Promise.resolve(path),
  }).read({ projectRoot });
  assertEquals(failedCode(missing), 'command_not_found');

  const nonZero = await new AspireCliEndpointSource({
    execute: () => Promise.resolve({ code: 12, stdout: '', stderr: 'dashboard unavailable' }),
    realPath: (path) => Promise.resolve(path),
  }).read({ projectRoot });
  assertEquals(failedCode(nonZero), 'command_failed');
  if (nonZero.outcome === 'failed') assertStringIncludes(nonZero.reason, 'exited 12');

  const malformed = await new AspireCliEndpointSource({
    execute: () => Promise.resolve({ code: 0, stdout: 'No running AppHost found', stderr: '' }),
    realPath: (path) => Promise.resolve(path),
  }).read({ projectRoot });
  assertEquals(failedCode(malformed), 'parse_failed');
});

Deno.test('Aspire CLI accepts casing drift and bounded trailing output while preserving identity', async () => {
  const outputs = [
    'Aspire 14\n{"Items":[{"AppHostPath":"/project/aspire/apphost.mts","AppHostPid":"run-7"}]}\ndone',
    'notice\n{"Resources":[{"DisplayName":"users","Endpoints":[{"Url":"http://localhost:41234"}],"Properties":{"WorkDir":"/project/services/users"}}]}\ntelemetry',
    '{"appHosts":[{"appHostPath":"/project/aspire/apphost.mts","appHostPid":"run-7"}]}',
  ];
  const source = new AspireCliEndpointSource({
    execute: () => Promise.resolve({ code: 0, stdout: outputs.shift()!, stderr: '' }),
    realPath: (path) => Promise.resolve(path),
  });
  const outcome = await source.read({ projectRoot: '/project' });
  assertEquals(outcome.outcome, 'used');
  assertEquals(outcome.candidates[0]?.baseUrl, 'http://127.0.0.1:41234');
});

Deno.test('Aspire CLI rejects torn output, foreign resources, and AppHost restart races', async () => {
  const ps = (runId: string) =>
    JSON.stringify([{ appHostPath: '/project/aspire/apphost.mts', appHostPid: runId }]);
  const describe = (workDir: string) =>
    JSON.stringify({
      resources: [{
        displayName: 'users',
        urls: [{ url: 'http://localhost:41234' }],
        properties: { 'executable.workDir': workDir },
      }],
    });
  const read = async (outputs: string[]) =>
    await new AspireCliEndpointSource({
      execute: () => Promise.resolve({ code: 0, stdout: outputs.shift()!, stderr: '' }),
      realPath: (path) => Promise.resolve(path),
    }).read({ projectRoot: '/project' });

  assertEquals(failedCode(await read([ps('7'), '{"resources":[', ps('7')])), 'parse_failed');
  assertEquals(
    failedCode(await read([ps('7'), describe('/foreign/services/users'), ps('7')])),
    'project_root_mismatch',
  );
  assertEquals(
    failedCode(await read([ps('7'), describe('/project/services/users'), ps('8')])),
    'run_id_mismatch',
  );
});
