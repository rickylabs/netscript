import { readDescribedResource } from './service-env/service-env-evidence.ts';

/** Select the live PostgreSQL URL without exposing credentials in diagnostics. */
export function sagaProcessDatabaseUrl(describeOutput: string): string {
  const resource = readDescribedResource(describeOutput, 'users');
  const value = resource.environment.get('DATABASE_URL');
  if (!value) throw new Error('Saga process gate requires the users DATABASE_URL');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Saga process gate requires a PostgreSQL URL');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('Saga process gate requires a PostgreSQL backend');
  }
  return value;
}

if (import.meta.main) {
  const [appHost, repoRoot] = Deno.args;
  if (!appHost || !repoRoot) throw new Error('expected apphost and repo root');
  const describe = await new Deno.Command('aspire', {
    args: ['describe', '--apphost', appHost, '--format', 'Json'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!describe.success) {
    throw new Error(`Saga process topology discovery failed (${describe.code})`);
  }
  const databaseUrl = sagaProcessDatabaseUrl(new TextDecoder().decode(describe.stdout));
  // The consumer fixture uses the allocated real provider, but owns a unique schema and
  // service PIDs. It never stops the generated project's shared resources.
  const proof = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-run',
      '.llm/tools/run-deno-test.ts',
      '--',
      '--unstable-kv',
      '--allow-all',
      'plugins/sagas/tests/runtime/publish-process-postgres_test.ts',
    ],
    cwd: repoRoot,
    env: { SAGA_PROCESS_DATABASE_URL: databaseUrl, COMMAND_POSTGRES_SOCKET: '' },
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();
  Deno.exit(proof.code);
}
