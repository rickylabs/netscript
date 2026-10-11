/** Refresh the desktop reference in its canonical prepared source/catalog context. */
import { join } from '@std/path';
import { prepareDesktopFixture } from '../../../packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts';
import { DESKTOP_REFERENCE_ENTRYPOINTS } from './check-reference-locks.ts';

const scratch = await Deno.makeTempDir({ prefix: 'desktop-reference-refresh-' });
try {
  await prepareDesktopFixture(Deno.cwd(), scratch, '1.0.0');
  const status = await new Deno.Command(Deno.execPath(), {
    cwd: scratch,
    args: [
      'install',
      '--lock=deno.lock',
      '--frozen=false',
      '--entrypoint',
      ...DESKTOP_REFERENCE_ENTRYPOINTS,
    ],
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn().status;
  if (!status.success) throw new Error('Desktop reference lock refresh failed: ' + status.code);
  await Deno.copyFile(
    join(scratch, 'deno.lock'),
    join(Deno.cwd(), 'packages/cli/e2e/fixtures/desktop-native/deno.lock'),
  );
  console.log('desktop-reference-lock refreshed; review and commit the lock delta');
} finally {
  await Deno.remove(scratch, { recursive: true });
}
