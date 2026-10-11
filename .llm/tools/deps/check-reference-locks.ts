/** Verify frozen source graphs used by isolated reference fixtures and runtime probes. */
import { join } from '@std/path';
import { prepareDesktopFixture } from '../../../packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts';

/** Use Deno's resolver to check the reference lock without executing fixture code. */
export async function checkReferenceLock(
  reference: string,
  entrypoints: readonly string[] = ['stream-react.fixture.ts'],
): Promise<boolean> {
  const status = await new Deno.Command(Deno.execPath(), {
    cwd: reference,
    args: [
      'install',
      '--lock=deno.lock',
      '--frozen',
      '--entrypoint',
      ...entrypoints,
    ],
    stdin: 'null',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn().status;
  if (!status.success) {
    console.error(
      'FAIL DEPS-REFERENCE-LOCK: frozen install failed. ' +
        'For stale dependencies, run from the reference directory: ' +
        `deno install --lock=deno.lock --frozen=false --entrypoint ${entrypoints.join(' ')}; ` +
        'commit the refreshed lock with the dependency change.',
    );
  }
  return status.success;
}

/** Check the desktop lock in the same source/catalog context used by its scratch probes. */
export async function checkDesktopReferenceLock(repoRoot: string): Promise<boolean> {
  const scratch = await Deno.makeTempDir({ prefix: 'desktop-reference-lock-' });
  try {
    await prepareDesktopFixture(repoRoot, scratch, '1.0.0');
    return await checkReferenceLock(scratch, [
      'src/main.ts',
      'src/renderer.ts',
      'tests/fixture-contract.ts',
    ]);
  } finally {
    await Deno.remove(scratch, { recursive: true });
  }
}

if (import.meta.main) {
  if (!(await checkReferenceLock(join(Deno.cwd(), 'resources/examples/expo-streams')))) {
    Deno.exit(1);
  }
  if (
    !(await checkReferenceLock(Deno.cwd(), [
      'packages/cli/e2e/src/application/gates/scaffold/guarded-service-reference.ts',
    ]))
  ) {
    Deno.exit(1);
  }
  if (!(await checkDesktopReferenceLock(Deno.cwd()))) {
    Deno.exit(1);
  }
  console.log('reference-lock PASS locks=3');
}
