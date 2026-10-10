import { assertEquals, assertNotEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
import {
  analyzePrivateLockWorkspaces,
  readLockWorkspaces,
} from './check-private-lock-workspace.ts';

const workspace = {
  dependencies: ['npm:zod@^4.0.0'],
  members: {
    'packages/database': { packageJson: { dependencies: ['npm:@prisma/client@^7.8.0'] } },
    'packages/fresh': { dependencies: ['jsr:@fresh/core@^2.3.3'] },
  },
};

Deno.test('private lock matching the root workspace passes', () => {
  assertEquals(analyzePrivateLockWorkspaces(workspace, [{ path: 'a/deno.lock', workspace }]), []);
});

Deno.test('private lock keeping a dependency the root dropped names the drifted member', () => {
  const stale = structuredClone(workspace);
  stale.members['packages/database'].packageJson.dependencies.push(
    'npm:@prisma/driver-adapter-utils@^7.8.0',
  );
  const findings = analyzePrivateLockWorkspaces(workspace, [
    { path: 'packages/fresh-ui/deno.lock', workspace: stale },
  ]);
  assertEquals(findings.length, 1);
  assertEquals(findings[0].path, 'packages/fresh-ui/deno.lock');
  assertEquals(findings[0].message.includes('members.packages/database'), true);
  assertEquals(findings[0].message.includes('packages/fresh,'), false);
});

Deno.test('root-level workspace drift and missing sections fail', () => {
  const drifted = { ...workspace, dependencies: [] };
  assertNotEquals(analyzePrivateLockWorkspaces(workspace, [{ path: 'p', workspace: drifted }]), []);
  assertEquals(analyzePrivateLockWorkspaces(workspace, [{ path: 'p', workspace: null }]).length, 1);
  assertEquals(analyzePrivateLockWorkspaces(undefined, []).length, 1);
});

Deno.test('every member-private lock in this repository matches the root workspace', async () => {
  const root = fromFileUrl(new URL('../../../', import.meta.url));
  const { rootWorkspace, privateLocks } = await readLockWorkspaces(root);
  assertNotEquals(privateLocks.length, 0);
  assertEquals(analyzePrivateLockWorkspaces(rootWorkspace, privateLocks), []);
});
