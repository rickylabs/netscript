import { assertEquals, assertNotEquals, assertRejects, assertThrows } from '@std/assert';

import {
  appUrlFromDescribeOutput,
  generatedAppHomeUrl,
  readPinnedAppPort,
} from '../../../src/application/gates/scaffold/generated-app-endpoint.ts';
import { generateAppsettings } from '../../../../src/kernel/templates/aspire/generate-appsettings.ts';
import { PORT_RANGES, SCAFFOLD_APP_PORT } from '../../../../src/kernel/constants/port-ranges.ts';
import { SCAFFOLD_FILES } from '../../../../src/kernel/constants/scaffold/scaffold-files.ts';

async function projectWithAppsettings(contents: string): Promise<string> {
  const root = await Deno.makeTempDir();
  await Deno.writeTextFile(`${root}/${SCAFFOLD_FILES.APPSETTINGS}`, contents);
  return root;
}

Deno.test('readPinnedAppPort returns the port the project declares, not a default', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { dashboard: { Type: 'app', HostPort: 9137 } } } }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), 9137);
    assertEquals(await generatedAppHomeUrl(root, 'dashboard'), 'http://127.0.0.1:9137/');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

// A workspace scaffolded before the HostPort rename still spells it `Port`, and must resolve
// identically — the rename is not allowed to strand existing projects.
Deno.test('readPinnedAppPort still honours the legacy Port spelling', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { dashboard: { Type: 'app', Port: 9137 } } } }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), 9137);
    assertEquals(await generatedAppHomeUrl(root, 'dashboard'), 'http://127.0.0.1:9137/');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

// #954 regression: the probe shipped hardcoded to `PORT_RANGES.APP.start` (8000) while a
// pinning project publishes the app on `SCAFFOLD_APP_PORT` (8010). Every request was refused,
// and 60 refused connections read exactly like an app that cannot render.
Deno.test('the app home URL follows a pinned port rather than a guessed one', async () => {
  const root = await projectWithAppsettings(
    generateAppsettings({ name: 'smoke', appName: 'dashboard', appPort: SCAFFOLD_APP_PORT }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), SCAFFOLD_APP_PORT);
    assertEquals(
      await generatedAppHomeUrl(root, 'dashboard'),
      `http://127.0.0.1:${SCAFFOLD_APP_PORT}/`,
    );
    // The offset is the whole point: probing the range start reaches nothing.
    assertNotEquals(SCAFFOLD_APP_PORT, PORT_RANGES.APP.start);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

// #952 regression, and the reason this module was reworked: the pristine scaffold pins no host
// port so `aspire start --isolated` works. The previous resolver threw
// "declares NetScript.Apps.dashboard.Port as undefined" on exactly this input — a green
// scaffold would have failed the app-home gate the moment #952 landed.
Deno.test('a pristine scaffold pins no port, and that is not an error', async () => {
  const root = await projectWithAppsettings(
    generateAppsettings({ name: 'smoke', appName: 'dashboard' }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), undefined);
    // Without a running AppHost there is nothing to ask, and the message has to say so
    // rather than blame a missing field.
    await assertRejects(
      () => generatedAppHomeUrl(root, 'dashboard'),
      Error,
      'pins no host port',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('an app absent from appsettings pins nothing', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { other: { HostPort: 8010 } } } }),
  );
  try {
    assertEquals(readPinnedAppPort(root, 'dashboard'), undefined);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('a non-numeric pinned port is reported, never coerced', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { dashboard: { HostPort: 'eighty-ten' } } } }),
  );
  try {
    assertThrows(() => readPinnedAppPort(root, 'dashboard'), Error, 'host port as "eighty-ten"');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('readPinnedAppPort reports an unreadable appsettings rather than guessing', async () => {
  const root = await Deno.makeTempDir();
  try {
    assertThrows(() => readPinnedAppPort(root, 'dashboard'), Error, 'is unreadable');
  } finally {
    await Deno.remove(root, { recursive: true });
  }

  const broken = await projectWithAppsettings('{ not json');
  try {
    assertThrows(() => readPinnedAppPort(broken, 'dashboard'), Error, 'is not valid JSON');
  } finally {
    await Deno.remove(broken, { recursive: true });
  }
});

// The allocated-port path parses `aspire describe`, so the parse is tested without a running
// AppHost. Shape mirrors the service-health gate's resolver, which is already green in CI.
Deno.test('appUrlFromDescribeOutput finds the resource endpoint in describe output', () => {
  const describe = JSON.stringify({
    resources: [
      { name: 'users', urls: [{ url: 'http://127.0.0.1:41001' }] },
      { name: 'dashboard', urls: [{ url: 'http://127.0.0.1:41999' }] },
    ],
  });
  assertEquals(appUrlFromDescribeOutput(describe, 'dashboard'), 'http://127.0.0.1:41999');
});

Deno.test('appUrlFromDescribeOutput tolerates a banner before the JSON', () => {
  const describe = 'Scanning for running AppHosts...\n' +
    JSON.stringify({
      resources: [{ name: 'dashboard', urls: [{ url: 'http://127.0.0.1:41999' }] }],
    });
  assertEquals(appUrlFromDescribeOutput(describe, 'dashboard'), 'http://127.0.0.1:41999');
});

Deno.test('appUrlFromDescribeOutput names what was missing', () => {
  const noResource = JSON.stringify({ resources: [{ name: 'users', urls: [] }] });
  assertThrows(
    () => appUrlFromDescribeOutput(noResource, 'dashboard'),
    Error,
    'was not present in aspire describe output',
  );

  const noEndpoint = JSON.stringify({ resources: [{ name: 'dashboard', state: 'Running' }] });
  assertThrows(
    () => appUrlFromDescribeOutput(noEndpoint, 'dashboard'),
    Error,
    'did not expose an HTTP endpoint',
  );
});
