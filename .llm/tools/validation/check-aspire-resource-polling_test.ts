import { assertEquals } from '@std/assert';

import {
  ASPIRE_RESOURCE_POLL_ALLOWLIST,
  findAspireResourcePolling,
  unexpectedAspireResourcePolling,
} from './check-aspire-resource-polling.ts';

Deno.test('Aspire resource polling allowlist is pinned to the exact approved set', () => {
  assertEquals([...ASPIRE_RESOURCE_POLL_ALLOWLIST].sort(), []);
});

Deno.test('polling guard ignores run/transient copies and retains the same defect in framework source', async () => {
  const source = `while (Date.now() < deadline) {
  await new Deno.Command('aspire', { args: ['describe'] }).output();
  await new Promise((resolve) => setTimeout(resolve, 1));
}`;
  await withSource(source, async (root) => {
    for (const directory of ['.llm/runs/old', '.llm/tmp', '.agents/generated/copy']) {
      await Deno.mkdir(`${root}/${directory}`, { recursive: true });
      await Deno.writeTextFile(`${root}/${directory}/probe.ts`, source);
    }
    assertEquals(await findAspireResourcePolling(root, root), [{
      path: 'packages/cli/e2e/src/probe.ts',
      describeLine: 2,
    }]);
  });
});

async function withSource(source: string, run: (root: string) => Promise<void>): Promise<void> {
  const root = await Deno.makeTempDir();
  try {
    const sourceRoot = `${root}/packages/cli/e2e/src`;
    await Deno.mkdir(sourceRoot, { recursive: true });
    await Deno.writeTextFile(`${sourceRoot}/probe.ts`, source);
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('Aspire polling guard detects snapshot describe on a local deadline', async () => {
  await withSource(
    `
const deadline = Date.now() + 90_000;
while (Date.now() < deadline) {
  await new Deno.Command('aspire', {
    args: ['describe', '--format', 'Json'],
  }).output();
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}
`,
    async (root) => {
      assertEquals(await findAspireResourcePolling(`${root}/packages/cli/e2e/src`, root), [{
        path: 'packages/cli/e2e/src/probe.ts',
        describeLine: 5,
      }]);
    },
  );
});

Deno.test('Aspire polling guard accepts a buffered describe follow reader', async () => {
  await withSource(
    `
const child = new Deno.Command('aspire', {
  args: ['describe', 'postgres', '--follow', '--format', 'Json'],
}).spawn();
while (true) {
  const update = await child.stdout.getReader().read();
  if (update.done) break;
}
`,
    async (root) => {
      assertEquals(await findAspireResourcePolling(`${root}/packages/cli/e2e/src`, root), []);
    },
  );
});

Deno.test('Aspire polling guard accepts one settled describe snapshot', async () => {
  await withSource(
    `
await new Deno.Command('aspire', {
  args: ['describe', '--format', 'Json'],
}).output();
`,
    async (root) => {
      assertEquals(await findAspireResourcePolling(`${root}/packages/cli/e2e/src`, root), []);
    },
  );
});

Deno.test('CLI E2E source has no non-fenced Aspire describe polling', async () => {
  const findings = unexpectedAspireResourcePolling(
    await findAspireResourcePolling('packages/cli/e2e/src'),
  );
  assertEquals(
    findings,
    [],
    `Hand-rolled Aspire resource polling must use event observation:\n${
      findings.map((finding) => `- ${finding.path}:${finding.describeLine}`).join('\n')
    }`,
  );
});
