/**
 * Bundle-isolation proof for the provider subpaths.
 *
 * The model registry is a process-level singleton, so importing every subpath
 * into one test process would accumulate all providers. To prove that importing
 * a *single* subpath registers *exactly one* provider — and no sibling subpath
 * leaks into the graph — each assertion runs a fresh `deno run` subprocess that
 * imports only one fixture and reports the registered ids.
 *
 * @module
 */
import { assertEquals } from '@std/assert';

/** Run a fixture in a fresh subprocess and return the registered provider ids. */
async function registeredProvidersFrom(fixture: string): Promise<string[]> {
  const fixtureUrl = new URL(`./fixtures/${fixture}`, import.meta.url);
  const command = new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-all', '--unstable-kv', '--quiet', fixtureUrl.href],
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stdout, stderr } = await command.output();
  if (code !== 0) {
    throw new Error(`fixture ${fixture} exited ${code}: ${new TextDecoder().decode(stderr)}`);
  }
  const lines = new TextDecoder().decode(stdout).trim().split('\n');
  const last = lines[lines.length - 1] ?? '[]';
  return JSON.parse(last) as string[];
}

Deno.test('bundle isolation: importing @netscript/ai/anthropic registers exactly one provider', async () => {
  const providers = await registeredProvidersFrom('registered_anthropic.ts');
  assertEquals(providers, ['anthropic']);
});

Deno.test('bundle isolation: importing @netscript/ai/openai-compatible registers exactly one provider', async () => {
  const providers = await registeredProvidersFrom('registered_openai_compatible.ts');
  assertEquals(providers, ['openai-compatible']);
});
