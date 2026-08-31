import { join } from '@std/path';

const [appHost, projectRoot, label] = Deno.args;
if (!appHost || !projectRoot || (label !== 'first' && label !== 'second')) {
  throw new Error('AppHost, project root, and first|second allocation label are required');
}

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
const path = join(projectRoot, '.netscript', 'e2e', `db-allocation-${label}.json`);
await Deno.mkdir(join(projectRoot, '.netscript', 'e2e'), { recursive: true });
await Deno.writeTextFile(path, JSON.stringify(JSON.parse(extractJson(stdout)), null, 2));
console.info(`captured ${label} database allocation topology: ${path}`);

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const indexes = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (indexes.length === 0) throw new Error('aspire describe did not emit JSON');
  return trimmed.slice(Math.min(...indexes));
}
