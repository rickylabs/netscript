import { join, resolve, toFileUrl } from '@std/path';

/** Run the shared consumer proof inside the generated package-resolution boundary. */
export async function probeAuthCookieJar(projectPath: string, repoPath: string): Promise<void> {
  const projectRoot = resolve(projectPath);
  const repoRoot = resolve(repoPath);
  const root = await Deno.makeTempDir({ dir: projectRoot, prefix: '.cookie-jar-proof-' });
  try {
    // Only the test harness comes from the repo. Use the exact installed service
    // entrypoint; public installs may declare it without a root import-map alias.
    const settings: {
      NetScript: { Plugins: { auth: { Entrypoint: string; Workdir?: string } } };
    } = JSON.parse(await Deno.readTextFile(join(projectRoot, 'appsettings.json')));
    const auth = settings.NetScript.Plugins.auth;
    const entrypoint = /^(jsr:|https?:|file:)/.test(auth.Entrypoint)
      ? auth.Entrypoint
      : toFileUrl(resolve(projectRoot, auth.Workdir ?? '.', auth.Entrypoint)).href;
    const config = JSON.parse(await Deno.readTextFile(join(repoRoot, 'deno.json')));
    const source = await Deno.readTextFile(
      join(repoRoot, 'plugins/auth/tests/testing/documented-cookie-jar.ts'),
    );
    await Deno.writeTextFile(
      join(root, 'consumer.ts'),
      source.replace("from '@std/assert'", `from '${config.imports['@std/assert']}'`)
        .replace("from '@netscript/plugin-auth/services'", `from '${entrypoint}'`),
    );
    const runner = join(root, 'run.ts');
    await Deno.writeTextFile(
      runner,
      `import { proveDocumentedCookieJar, verifyCookieJarTutorial } from './consumer.ts';
const [recipePath, tutorialPath] = Deno.args;
const recipe = await Deno.readTextFile(recipePath);
verifyCookieJarTutorial(recipe, await Deno.readTextFile(tutorialPath));
await proveDocumentedCookieJar(recipe);
console.info('Generated auth cookie-jar PASS: provider callback, cookie-only session/me, missing transaction, revocation, tutorial; no credentials emitted.');
`,
    );
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '-A',
        '--unstable-kv',
        '--config',
        join(projectRoot, 'deno.json'),
        runner,
        join(repoRoot, 'docs/site/identity-access/how-to/add-authentication.md'),
        join(repoRoot, 'docs/site/tutorials/workspace/02-auth.md'),
      ],
      cwd: projectRoot,
      stdout: 'inherit',
      stderr: 'inherit',
    }).output();
    if (!result.success) throw new Error(`Generated cookie-jar proof failed: ${result.code}`);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

if (import.meta.main) {
  const [projectRoot, repoRoot] = Deno.args;
  if (!projectRoot || !repoRoot) {
    throw new Error('Generated project and source repository required.');
  }
  await probeAuthCookieJar(projectRoot, repoRoot);
}
