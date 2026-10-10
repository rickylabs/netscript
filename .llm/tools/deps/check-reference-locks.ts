/** Verify the frozen source graph used by the isolated Expo reference fixture. */
import { join } from '@std/path';

/** Use Deno's resolver to check the reference lock without executing fixture code. */
export async function checkReferenceLock(reference: string): Promise<boolean> {
  const status = await new Deno.Command(Deno.execPath(), {
    cwd: reference,
    args: [
      'install',
      '--lock=deno.lock',
      '--frozen',
      '--entrypoint',
      'stream-react.fixture.ts',
    ],
    stdin: 'null',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn().status;
  if (!status.success) {
    console.error(
      'FAIL DEPS-REFERENCE-LOCK resources/examples/expo-streams/deno.lock: frozen install failed. ' +
        'For stale dependencies, run from the reference directory: ' +
        'deno install --lock=deno.lock --frozen=false --entrypoint stream-react.fixture.ts; ' +
        'commit the refreshed lock with the dependency change.',
    );
  }
  return status.success;
}

if (import.meta.main) {
  if (!(await checkReferenceLock(join(Deno.cwd(), 'resources/examples/expo-streams')))) {
    Deno.exit(1);
  }
  console.log('reference-lock PASS locks=1');
}
