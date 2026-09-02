import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import {
  markOwnedResourceSliceLeaf,
  type ResourceSliceCandidateLeaf,
  type ResourceSlicePreflightPhase,
  type ResourceSliceStagingResult,
  sha256ResourceSliceBody,
} from './resource-slice-contract.ts';
import { classifyResourceSliceLeaf, reconcileResourceSlice } from './reconcile-resource-slice.ts';

async function leaf(
  path: string,
  body: string,
  options: readonly ('core' | 'form' | 'partial' | 'stream')[] = ['core'],
  previousCanonicalContents: readonly string[] = [],
): Promise<ResourceSliceCandidateLeaf> {
  return {
    path,
    resource: 'orders',
    role: path.includes('form') ? 'form-component' : 'page',
    options,
    content: await markOwnedResourceSliceLeaf(
      {
        resource: 'orders',
        role: path.includes('form') ? 'form-component' : 'page',
        options,
      },
      body,
    ),
    previousCanonicalContents,
  };
}

function staged(
  leaves: readonly ResourceSliceCandidateLeaf[],
  shared: Extract<ResourceSliceStagingResult, { ok: true }>['shared'] = [],
): ResourceSliceStagingResult {
  return { ok: true, leaves, shared };
}

function hasApplyPlan(value: object): boolean {
  return 'applyPlan' in value;
}

Deno.test('identical second run skips every path and plans zero writes', async () => {
  const page = await leaf('routes/orders/index.tsx', 'export const page = true;\n');
  const router = {
    path: 'router.ts',
    role: 'app-routes',
    content: 'export const appRoutes = {};\n',
  } as const;
  const result = await reconcileResourceSlice({
    staging: staged([page], [router]),
    current: { [page.path]: page.content, [router.path]: router.content },
  });

  assertEquals(result.status, 'ready');
  if (result.status !== 'ready') return;
  assertEquals(result.applyPlan.files, []);
  assertEquals(result.skipped, ['router.ts', 'routes/orders/index.tsx']);
  assertEquals(result.report.every((entry) => entry.action === 'skip'), true);
});

Deno.test('additive option is selected and fully reported before an edited-base dry-run conflict', async () => {
  const core = await leaf('routes/orders/index.tsx', 'export const page = true;\n');
  const upgraded = await leaf(
    core.path,
    'export const pageWithForm = true;\n',
    ['core', 'form'],
    [core.content],
  );
  const form = await leaf(
    'routes/orders/(_components)/orders-form.tsx',
    'export const form = true;\n',
    ['core', 'form'],
  );
  const edited = core.content.replace('page = true', 'page = false');
  const result = await reconcileResourceSlice({
    staging: staged([upgraded, form]),
    current: { [core.path]: edited },
    dryRun: true,
  });

  assertEquals(result.status, 'dry-run');
  assertEquals(result.exitCode, 1);
  assertFalse(hasApplyPlan(result));
  assertEquals(
    result.report.map((entry) => [entry.path, entry.action, entry.classification]),
    [
      [form.path, 'write', 'absent'],
      [core.path, 'conflict', 'owned-edited'],
    ],
  );
  assertStringIncludes(result.report[1].remedy ?? '', 'Move or rename');
});

Deno.test('canonical additive transition writes without force', async () => {
  const core = await leaf('routes/orders/index.tsx', 'export const page = true;\n');
  const upgraded = await leaf(
    core.path,
    'export const pageWithForm = true;\n',
    ['core', 'form'],
    [core.content],
  );
  const result = await reconcileResourceSlice({
    staging: staged([upgraded]),
    current: { [core.path]: core.content },
  });

  assertEquals(result.status, 'ready');
  if (result.status !== 'ready') return;
  assertEquals(result.applyPlan.files, [{ path: upgraded.path, content: upgraded.content }]);
});

Deno.test('default conflict reports every path, force eligibility, and no apply plan', async () => {
  const owned = await leaf('routes/orders/index.tsx', 'export const next = true;\n');
  const oldOwned = await leaf(owned.path, 'export const old = true;\n');
  const foreign = await leaf('routes/orders/foreign.tsx', 'export const next = true;\n');
  const result = await reconcileResourceSlice({
    staging: staged([owned, foreign]),
    current: {
      [owned.path]: oldOwned.content,
      [foreign.path]: '// maintained by the app\nexport const foreign = true;\n',
    },
  });

  assertEquals(result.status, 'conflict');
  assertFalse(hasApplyPlan(result));
  assertEquals(result.conflicts, [foreign.path, owned.path].sort());
  const ownedReport = result.report.find((entry) => entry.path === owned.path);
  const foreignReport = result.report.find((entry) => entry.path === foreign.path);
  assertStringIncludes(ownedReport?.remedy ?? '', '--force');
  assertFalse((foreignReport?.remedy ?? '').includes('--force'));
});

Deno.test('force replaces only positively owned leaves and leaves shared/exact bytes alone', async () => {
  const candidate = await leaf('routes/orders/index.tsx', 'export const next = true;\n');
  const previous = await leaf(candidate.path, 'export const old = true;\n');
  const router = { path: 'router.ts', role: 'app-routes', content: 'router bytes\n' } as const;
  const result = await reconcileResourceSlice({
    staging: staged([candidate], [router]),
    current: { [candidate.path]: previous.content, [router.path]: router.content },
    force: true,
  });

  assertEquals(result.status, 'ready');
  if (result.status !== 'ready') return;
  assertEquals(result.applyPlan.files, [{ path: candidate.path, content: candidate.content }]);
  assertEquals(result.report.find((entry) => entry.path === router.path)?.action, 'skip');
});

Deno.test('mismatched body hash is owned-edited and never replaceable under force', async () => {
  const candidate = await leaf('routes/orders/index.tsx', 'export const next = true;\n');
  const prior = await leaf(candidate.path, 'export const old = true;\n');
  const edited = prior.content.replace('old = true', 'old = false');

  assertEquals((await classifyResourceSliceLeaf(edited, candidate)).kind, 'owned-edited');
  const result = await reconcileResourceSlice({
    staging: staged([candidate]),
    current: { [candidate.path]: edited },
    force: true,
  });
  assertEquals(result.status, 'conflict');
  assertFalse(hasApplyPlan(result));
  assertFalse((result.report[0].remedy ?? '').includes('--force'));
});

Deno.test('recomputed marker forgery is owned by convention but needs force', async () => {
  const candidate = await leaf('routes/orders/index.tsx', 'export const canonical = true;\n');
  const forgedBody = 'export const forged = true;\n';
  const forged =
    `// @netscript/resource-slice {"schema":1,"resource":"orders","role":"page","options":["core"],"bodySha256":"${await sha256ResourceSliceBody(
      forgedBody,
    )}"}\n${forgedBody}`;
  assertEquals((await classifyResourceSliceLeaf(forged, candidate)).kind, 'owned');

  const defaultResult = await reconcileResourceSlice({
    staging: staged([candidate]),
    current: { [candidate.path]: forged },
  });
  assertEquals(defaultResult.status, 'conflict');

  const forced = await reconcileResourceSlice({
    staging: staged([candidate]),
    current: { [candidate.path]: forged },
    force: true,
  });
  assertEquals(forced.status, 'ready');
  assert(forced.status === 'ready');
  assertEquals(forced.applyPlan.files, [{ path: candidate.path, content: candidate.content }]);
});

Deno.test('missing, malformed, unsupported-schema, wrong-resource, and wrong-role markers are unowned', async () => {
  const candidate = await leaf('routes/orders/index.tsx', 'export const canonical = true;\n');
  const body = 'export const prior = true;\n';
  const hash = await sha256ResourceSliceBody(body);
  const marker = (schema: number, resource: string, role: string) =>
    `// @netscript/resource-slice {"schema":${schema},"resource":"${resource}","role":"${role}","options":["core"],"bodySha256":"${hash}"}\n${body}`;
  const fixtures = [
    body,
    `// @netscript/resource-slice {bad json}\n${body}`,
    marker(2, 'orders', 'page'),
    marker(1, 'customers', 'page'),
    marker(1, 'orders', 'view'),
  ];
  for (const current of fixtures) {
    assertEquals((await classifyResourceSliceLeaf(current, candidate)).kind, 'unowned');
  }
});

Deno.test('unowned content remains a conflict under force', async () => {
  const candidate = await leaf('routes/orders/index.tsx', 'export const canonical = true;\n');
  const result = await reconcileResourceSlice({
    staging: staged([candidate]),
    current: { [candidate.path]: 'export const appOwned = true;\n' },
    force: true,
  });
  assertEquals(result.status, 'conflict');
  assertFalse(hasApplyPlan(result));
  assertEquals(result.report[0].classification, 'unowned');
});

Deno.test('each injected pre-apply failure structurally proves zero application writes', async () => {
  const phases: readonly ResourceSlicePreflightPhase[] = [
    'input-validation',
    'client-selection',
    'procedure-validation',
    'fresh-staging',
    'shared-source-transform',
  ];
  const application = new Map([['router.ts', 'original bytes\n']]);

  for (const phase of phases) {
    const before = new Map(application);
    const result = await reconcileResourceSlice({
      staging: { ok: false, phase, message: `${phase} injected failure` },
      current: { 'router.ts': application.get('router.ts') },
      force: true,
    });
    if (hasApplyPlan(result)) {
      throw new Error(`Failure ${phase} unexpectedly exposed an apply plan.`);
    }
    assertEquals(result.status, 'preflight-failed');
    assertEquals(result.report, []);
    assertEquals(application, before);
  }
});

Deno.test('invalid staged ownership metadata fails before an apply plan exists', async () => {
  const candidate = await leaf('routes/orders/index.tsx', 'export const page = true;\n');
  const invalid = {
    ...candidate,
    content: candidate.content.replace('"role":"page"', '"role":"view"'),
  };
  const result = await reconcileResourceSlice({ staging: staged([invalid]), current: {} });
  assertEquals(result.status, 'preflight-failed');
  assertFalse(hasApplyPlan(result));
  if (result.status === 'preflight-failed') {
    assertEquals(result.phase, 'candidate-validation');
  }
});
