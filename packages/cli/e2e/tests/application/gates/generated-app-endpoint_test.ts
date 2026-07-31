import { assertEquals, assertNotEquals, assertThrows } from '@std/assert';

import {
  generatedAppHomeUrl,
  readGeneratedAppPort,
} from '../../../src/application/gates/scaffold/generated-app-endpoint.ts';
import { generateAppsettings } from '../../../../src/kernel/templates/aspire/generate-appsettings.ts';
import { PORT_RANGES, SCAFFOLD_APP_PORT } from '../../../../src/kernel/constants/port-ranges.ts';
import { SCAFFOLD_FILES } from '../../../../src/kernel/constants/scaffold/scaffold-files.ts';

async function projectWithAppsettings(contents: string): Promise<string> {
  const root = await Deno.makeTempDir();
  await Deno.writeTextFile(`${root}/${SCAFFOLD_FILES.APPSETTINGS}`, contents);
  return root;
}

Deno.test('readGeneratedAppPort returns the port the project declares, not a default', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { dashboard: { Type: 'app', Port: 9137 } } } }),
  );
  try {
    assertEquals(readGeneratedAppPort(root, 'dashboard'), 9137);
    assertEquals(generatedAppHomeUrl(root, 'dashboard'), 'http://127.0.0.1:9137/');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

// #954 regression: the probe shipped hardcoded to `PORT_RANGES.APP.start` (8000) while the
// scaffold publishes the app on `SCAFFOLD_APP_PORT` (8010). Every request was refused, and
// 60 refused connections read exactly like an app that cannot render.
Deno.test('the app home URL follows the port the scaffold actually generates', async () => {
  const root = await projectWithAppsettings(
    generateAppsettings({ name: 'smoke', appName: 'dashboard', appPort: SCAFFOLD_APP_PORT }),
  );
  try {
    assertEquals(readGeneratedAppPort(root, 'dashboard'), SCAFFOLD_APP_PORT);
    assertEquals(generatedAppHomeUrl(root, 'dashboard'), `http://127.0.0.1:${SCAFFOLD_APP_PORT}/`);
    // The offset is the whole point: probing the range start reaches nothing.
    assertNotEquals(SCAFFOLD_APP_PORT, PORT_RANGES.APP.start);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('readGeneratedAppPort names the file and the app when the port is missing', async () => {
  const root = await projectWithAppsettings(
    JSON.stringify({ NetScript: { Apps: { other: { Port: 8010 } } } }),
  );
  try {
    assertThrows(
      () => readGeneratedAppPort(root, 'dashboard'),
      Error,
      'NetScript.Apps.dashboard.Port',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('readGeneratedAppPort reports an unreadable appsettings rather than guessing', async () => {
  const root = await Deno.makeTempDir();
  try {
    assertThrows(() => readGeneratedAppPort(root, 'dashboard'), Error, 'is unreadable');
  } finally {
    await Deno.remove(root, { recursive: true });
  }

  const broken = await projectWithAppsettings('{ not json');
  try {
    assertThrows(() => readGeneratedAppPort(broken, 'dashboard'), Error, 'is not valid JSON');
  } finally {
    await Deno.remove(broken, { recursive: true });
  }
});
