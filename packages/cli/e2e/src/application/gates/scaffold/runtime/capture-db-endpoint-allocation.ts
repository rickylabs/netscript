import { join } from '@std/path';
import { resolveDeclaredResourceUrlsFromAppHost } from '../generated-app-endpoint.ts';

export type AllocationLabel = 'first' | 'second';

/** Capture topology once after Aspire has published the database resource's endpoint. */
export async function captureDatabaseEndpointAllocation(
  appHost: string,
  projectRoot: string,
  label: AllocationLabel,
  resourceName: string,
  resolveUrls: typeof resolveDeclaredResourceUrlsFromAppHost =
    resolveDeclaredResourceUrlsFromAppHost,
  describe: (appHost: string) => Promise<string> = describeAppHost,
): Promise<string> {
  await resolveUrls(appHost, resourceName);
  // This snapshot does not discover endpoint allocation. The scoped follower above already
  // observed it; this single read preserves the complete topology used by the allocation diff.
  const topology = JSON.parse(await describe(appHost));
  const path = join(projectRoot, '.netscript', 'e2e', `db-allocation-${label}.json`);
  await Deno.mkdir(join(projectRoot, '.netscript', 'e2e'), { recursive: true });
  await Deno.writeTextFile(path, JSON.stringify(topology, null, 2));
  return path;
}

async function describeAppHost(appHost: string): Promise<string> {
  const output = await new Deno.Command('aspire', {
    args: ['describe', '--apphost', appHost, '--format', 'Json', '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(`aspire describe failed (${output.code}): ${stderr || stdout}`);
  }
  return extractJson(stdout);
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const indexes = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (indexes.length === 0) throw new Error('aspire describe did not emit JSON');
  return trimmed.slice(Math.min(...indexes));
}

if (import.meta.main) {
  const [appHost, projectRoot, label, resourceName] = Deno.args;
  if (
    !appHost || !projectRoot || !resourceName || (label !== 'first' && label !== 'second')
  ) {
    throw new Error(
      'AppHost, project root, first|second allocation label, and resource name are required',
    );
  }
  const path = await captureDatabaseEndpointAllocation(appHost, projectRoot, label, resourceName);
  console.info(`captured ${label} database allocation topology: ${path}`);
}
