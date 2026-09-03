import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  readOwnedContainerLog,
  selectOwnedContainer,
  toOwnedContainerCandidate,
} from '../../../src/application/gates/scaffold/runtime/owned-container-log.ts';
import {
  ASPIRE_DCP_APPHOST_PATH,
  ASPIRE_MOUNTS,
} from '../../../src/application/gates/scaffold/runtime/evidence/cleanup.ts';

const ROOT = '/work/run-a/project';

function inspectRecord(
  id: string,
  image: string,
  labels: Record<string, string> = {},
  env: string[] = [],
): unknown {
  return { Id: id, Config: { Image: image, Labels: labels, Env: env } };
}

Deno.test('toOwnedContainerCandidate reads the mounts label, then the DCP env fallback', () => {
  const byLabel = toOwnedContainerCandidate(
    inspectRecord('a'.repeat(64), 'docker.io/library/postgres:17', {
      [ASPIRE_MOUNTS]: `type=bind,src=${ROOT}/.aspire/data,dst=/var/lib/postgresql/data`,
    }),
  );
  assertEquals(byLabel?.appHostSource, `${ROOT}/.aspire/data`);

  const byEnv = toOwnedContainerCandidate(
    inspectRecord('b'.repeat(64), 'postgres:17', {}, [
      `${ASPIRE_DCP_APPHOST_PATH}=${ROOT}/apphost.ts`,
    ]),
  );
  assertEquals(byEnv?.appHostSource, `${ROOT}/apphost.ts`);

  assertEquals(toOwnedContainerCandidate({ Id: 'no-config' }), undefined);
  assertEquals(toOwnedContainerCandidate(null), undefined);
});

Deno.test('selectOwnedContainer refuses image-name matches without ownership proof', () => {
  const foreign = { id: 'f'.repeat(64), image: 'postgres:17' };
  const otherRun = {
    id: 'o'.repeat(64),
    image: 'postgres:17',
    appHostSource: '/work/run-b/project/.aspire/data',
  };
  const owned = { id: 'p'.repeat(64), image: 'docker.io/library/postgres:17', appHostSource: ROOT };
  const ownedGarnet = {
    id: 'g'.repeat(64),
    image: 'ghcr.io/microsoft/garnet:1.0',
    appHostSource: ROOT,
  };

  assertEquals(selectOwnedContainer([foreign, otherRun, owned, ownedGarnet], ROOT, 'postgres'), {
    id: owned.id,
    image: owned.image,
  });
  assertThrows(
    () => selectOwnedContainer([foreign, otherRun], ROOT, 'postgres'),
    Error,
    'found 0',
  );
  assertThrows(
    () => selectOwnedContainer([owned, { ...owned, id: 'q'.repeat(64) }], ROOT, 'postgres'),
    Error,
    'found 2',
  );
});

Deno.test('readOwnedContainerLog inspects running containers and tails only the owned one', async () => {
  const calls: string[][] = [];
  const docker = (args: readonly string[]) => {
    calls.push([...args]);
    if (args[0] === 'ps') return Promise.resolve('aaa\nbbb\n');
    if (args[0] === 'inspect') {
      return Promise.resolve(JSON.stringify([
        inspectRecord('aaa', 'postgres:17', { [ASPIRE_MOUNTS]: 'type=bind,src=/elsewhere,dst=/x' }),
        inspectRecord('bbb', 'postgres:17', {
          [ASPIRE_MOUNTS]: `type=bind,src=${ROOT}/.aspire,dst=/x`,
        }),
      ]));
    }
    if (args[0] === 'logs') {
      return Promise.resolve('LOG:  database system is ready to accept connections\n');
    }
    return Promise.reject(new Error(`unexpected docker ${args.join(' ')}`));
  };

  const result = await readOwnedContainerLog(ROOT, 'postgres', 50, docker);
  assertEquals(result.container.id, 'bbb');
  assertEquals(result.log.includes('ready to accept connections'), true);
  assertEquals(calls.at(-1), ['logs', '--tail', '50', 'bbb']);

  await assertRejects(
    () => readOwnedContainerLog(ROOT, 'postgres', 50, () => Promise.resolve('')),
    Error,
    'no running containers',
  );
});
