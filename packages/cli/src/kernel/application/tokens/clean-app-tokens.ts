import {
  type AppTokenDependencies,
  appTokenPath,
  assertTokenApp,
  tokenOutputFile,
} from './token-files.ts';

/** Remove only known generated files, retaining app CSS, configuration and all sources. */
export async function cleanAppTokens(
  root: string,
  dependencies: AppTokenDependencies,
): Promise<readonly string[]> {
  const { fs, tokenEngine } = dependencies;
  await assertTokenApp(root, fs);
  const defaults = await tokenEngine.defaults();
  const removed: string[] = [];
  for (const name of defaults.outputFiles) {
    const file = tokenOutputFile(name);
    const path = appTokenPath(root, file);
    if (await fs.exists(path)) {
      if (!(await fs.stat(path)).isFile) {
        throw new Error(`Generated token asset is not a file: ${file}`);
      }
      await fs.remove(path);
      removed.push(file);
    }
  }
  return removed;
}
