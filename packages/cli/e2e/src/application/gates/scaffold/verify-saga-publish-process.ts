import { dirname, join } from '@std/path';
import { readDescribedResource } from './service-env/service-env-evidence.ts';
import { requireResourceProcesses, scanResourceProcesses } from './service-env/process-evidence.ts';

function validatePostgresDatabaseUrl(value: string | undefined): string {
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

/** Select the live PostgreSQL URL without exposing credentials in diagnostics. */
export function sagaProcessDatabaseUrl(describeOutput: string): string {
  const resource = readDescribedResource(describeOutput, 'users');
  return validatePostgresDatabaseUrl(resource.environment.get('DATABASE_URL'));
}

/** Resolve users DATABASE_URL from describe when unredacted, else from the running OS process. */
export async function resolveSagaProcessDatabaseUrl(
  describeOutput: string,
  readProcessDatabaseUrl: () => Promise<string | undefined>,
): Promise<string> {
  const described = readDescribedResource(describeOutput, 'users').environment.get('DATABASE_URL');
  if (described) return validatePostgresDatabaseUrl(described);
  return validatePostgresDatabaseUrl(await readProcessDatabaseUrl());
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
  const databaseUrl = await resolveSagaProcessDatabaseUrl(
    new TextDecoder().decode(describe.stdout),
    async () => {
      const usersDir = join(dirname(dirname(appHost)), 'services', 'users');
      const processes = requireResourceProcesses(
        await scanResourceProcesses(usersDir, 'users'),
        'users',
        usersDir,
      );
      return processes[0].environment.get('DATABASE_URL');
    },
  );
  // Provider-borrowing conformance: repository saga/router fixtures run against the users
  // allocation in an owned schema and service PIDs; this does not exercise generated sagas-api.
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
