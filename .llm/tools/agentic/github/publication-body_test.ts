import { assert, assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import { readOwnedPublicationBody, stagePublicationBody } from './publication-body.ts';

async function withTempRoot(run: (root: string) => Promise<void>): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-publication-body-' });
  try {
    await run(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('concurrent publication sessions stage collision-free body paths', async () => {
  await withTempRoot(async (root) => {
    const firstSession = crypto.randomUUID();
    const secondSession = crypto.randomUUID();
    const [first, second] = await Promise.all([
      stagePublicationBody('Closes #1084\n', firstSession, root),
      stagePublicationBody('Closes #9999\n', secondSession, root),
    ]);
    assertNotEquals(first.bodyPath, second.bodyPath);
    assert(first.bodyPath.includes(firstSession));
    assert(second.bodyPath.includes(secondSession));
    assertEquals(await readOwnedPublicationBody(first, firstSession), 'Closes #1084\n');
    assertEquals(await readOwnedPublicationBody(second, secondSession), 'Closes #9999\n');
  });
});

Deno.test('publication ownership rejects a body staged by another session', async () => {
  await withTempRoot(async (root) => {
    const owner = crypto.randomUUID();
    const other = crypto.randomUUID();
    const artifact = await stagePublicationBody('owned body', owner, root);
    await assertRejects(
      () => readOwnedPublicationBody(artifact, other),
      Error,
      'owned by another session',
    );
  });
});

Deno.test('publication ownership rejects body or metadata changed after staging', async () => {
  await withTempRoot(async (root) => {
    const session = crypto.randomUUID();
    const bodyArtifact = await stagePublicationBody('reviewed body', session, root);
    await Deno.writeTextFile(bodyArtifact.bodyPath, 'swapped body');
    await assertRejects(
      () => readOwnedPublicationBody(bodyArtifact, session),
      Error,
      'changed after session staging',
    );

    const metadataSession = crypto.randomUUID();
    const metadataArtifact = await stagePublicationBody('second body', metadataSession, root);
    const metadata = JSON.parse(await Deno.readTextFile(metadataArtifact.metadataPath));
    metadata.ownerSession = crypto.randomUUID();
    await Deno.writeTextFile(metadataArtifact.metadataPath, JSON.stringify(metadata));
    await assertRejects(
      () => readOwnedPublicationBody(metadataArtifact, metadataSession),
      Error,
      'mismatched owner metadata',
    );
  });
});

Deno.test('publication staging refuses reuse of one session directory', async () => {
  await withTempRoot(async (root) => {
    const session = crypto.randomUUID();
    await stagePublicationBody('first', session, root);
    await assertRejects(
      () => stagePublicationBody('second', session, root),
      Deno.errors.AlreadyExists,
    );
  });
});

Deno.test({
  name: 'publication staging tightens a pre-existing root to owner-only',
  ignore: Deno.build.os === 'windows',
  fn: async () => {
    await withTempRoot(async (root) => {
      await Deno.chmod(root, 0o755);
      await stagePublicationBody('private body', crypto.randomUUID(), root);
      const mode = (await Deno.stat(root)).mode;
      assertEquals(mode === null ? null : mode & 0o777, 0o700);
    });
  },
});
