import { walk } from '@std/fs/walk';
import { dirname, join, relative, resolve } from '@std/path';

const projectRoot = resolve(Deno.args[0]);
// A sibling preserves local-source imports that resolve outside the generated project.
const scratch = await Deno.makeTempDir({
  dir: dirname(projectRoot),
  prefix: 'outbound-webhook-adoption-',
});
try {
  for await (
    const entry of walk(projectRoot, {
      includeSymlinks: false,
      followSymlinks: false,
      skip: [/(?:^|[/\\])(?:node_modules|\.git|\.data|\.deno|\.aspire|_cache)(?:[/\\]|$)/],
    })
  ) {
    const destination = join(scratch, relative(projectRoot, entry.path));
    if (entry.isDirectory) await Deno.mkdir(destination, { recursive: true });
    else if (entry.isFile) await Deno.copyFile(entry.path, destination);
  }
  await run(
    'run',
    '--minimum-dependency-age=0',
    '-A',
    '--lock=deno.lock',
    '@netscript/plugin-workers/cli',
    'add',
    'job',
    'deliver-webhook-adoption',
    '--template=webhook-delivery',
  );
  const job = 'workers/jobs/deliver-webhook-adoption.ts';
  await run(
    'check',
    '--minimum-dependency-age=0',
    '--unstable-kv',
    '--lock=deno.lock',
    job,
    '.netscript/generated/plugin-workers/job-registry.ts',
  );
  const probe = 'workers/outbound-webhook-probe.ts';
  await Deno.copyFile(new URL('./probe.ts', import.meta.url), join(scratch, probe));
  await run(
    'run',
    '--minimum-dependency-age=0',
    '-A',
    '--unstable-kv',
    '--lock=deno.lock',
    probe,
    job,
  );
} finally {
  await Deno.remove(scratch, { recursive: true });
}

async function run(...args: string[]): Promise<void> {
  const status = await new Deno.Command(Deno.execPath(), {
    args,
    cwd: scratch,
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn().status;
  if (!status.success) throw new Error(`Webhook adoption ${args[0]} failed (${status.code})`);
}
