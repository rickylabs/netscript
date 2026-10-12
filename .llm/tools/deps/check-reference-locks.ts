/** Verify frozen source graphs used by isolated reference fixtures and runtime probes. */
import { join } from '@std/path';
import { prepareDesktopFixture } from '../../../packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts';
import { MAINTAINED_REFERENCE_LOCK_FILES } from './bump-version.ts';

/** Runtime and test entrypoints covered by the staged desktop reference lock. */
export const DESKTOP_REFERENCE_ENTRYPOINTS: readonly string[] = [
  'src/main.ts',
  'src/renderer.ts',
  'tests/fixture-contract.ts',
];

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
    const success = await checkReferenceLock(scratch, DESKTOP_REFERENCE_ENTRYPOINTS);
    if (!success) {
      console.error(
        'Desktop scratch reference: run deno task deps:refresh:desktop-lock from the repository root; ' +
          'commit packages/cli/e2e/fixtures/desktop-native/deno.lock with the dependency change.',
      );
    }
    return success;
  } finally {
    await Deno.remove(scratch, { recursive: true });
  }
}

/** Entrypoint-specific checks; keys must match the coordinated bump's maintained lock set. */
export const REFERENCE_LOCK_CHECKS: Readonly<Record<string, (root: string) => Promise<boolean>>> = {
  'deno.lock': (root) =>
    checkReferenceLock(root, [
      'packages/cli/e2e/src/application/gates/scaffold/guarded-service-reference.ts',
    ]),
  'resources/examples/expo-streams/deno.lock': (root) =>
    checkReferenceLock(join(root, 'resources/examples/expo-streams')),
  'packages/cli/e2e/fixtures/desktop-native/deno.lock': checkDesktopReferenceLock,
};

if (import.meta.main) {
  for (const lock of MAINTAINED_REFERENCE_LOCK_FILES) {
    const check = REFERENCE_LOCK_CHECKS[lock];
    if (!check) throw new Error(`Missing frozen resolution context for maintained lock: ${lock}`);
    if (!(await check(Deno.cwd()))) Deno.exit(1);
  }
  console.log(`reference-lock PASS locks=${MAINTAINED_REFERENCE_LOCK_FILES.length}`);
}
