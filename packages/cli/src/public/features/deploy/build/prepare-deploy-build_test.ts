import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { deployBuildDirs } from './prepare-deploy-build.ts';
import { DEPLOY_DIRS } from '../../../../kernel/constants/runtime.ts';

// `deployBuildDirs` is the OS-neutral layout mapping extracted in S7. The rest of
// `prepareDeployBuild` composes already-unit-tested units (`extractCompileTargets`,
// `topologicalSort`) over `Deno.mkdir`, so the load-bearing new logic is the pure
// path derivation asserted here.

Deno.test('deployBuildDirs maps a Windows deploy root to the four standard subdirs', () => {
  const root = join('C:', 'proj', '.deploy', 'windows');
  const dirs = deployBuildDirs(root);
  assertEquals(dirs.binDir, join(root, DEPLOY_DIRS.BIN));
  assertEquals(dirs.configDir, join(root, DEPLOY_DIRS.CONFIG));
  assertEquals(dirs.logsDir, join(root, DEPLOY_DIRS.LOGS));
  assertEquals(dirs.scriptsDir, join(root, DEPLOY_DIRS.SCRIPTS));
});

Deno.test('deployBuildDirs derives every subdir under the given deploy root', () => {
  const root = join('srv', 'netscript', '.deploy', 'linux');
  const dirs = deployBuildDirs(root);
  for (const dir of [dirs.binDir, dirs.configDir, dirs.logsDir, dirs.scriptsDir]) {
    assertEquals(dir.startsWith(root), true);
  }
  // Distinct subdirectories, one per DEPLOY_DIRS entry used.
  const unique = new Set([dirs.binDir, dirs.configDir, dirs.logsDir, dirs.scriptsDir]);
  assertEquals(unique.size, 4);
});
