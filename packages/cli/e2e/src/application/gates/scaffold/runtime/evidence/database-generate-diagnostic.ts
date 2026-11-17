/** Test-only evidence around the original database.generate command; no additional Aspire calls. */
import { saveOwnedInvocationDiagnostics } from './owned-invocation-diagnostic.ts';
import type { CapturedInvocation } from './invocation-diagnostic.ts';

/** The nested Aspire exit is reported by the CLI, distinct from the captured database CLI exit. */
export function reportedRestartFailure(text: string, appHost: string) {
  const match =
    /Database client generated, but (web|api|workers|postgres|redis|garnet|streams|dashboard) restart failed \(Aspire exit ([0-9]{1,3})\)\./
      .exec(text);
  if (
    !match || Number(match[2]) > 255 ||
    !text.includes(`Run: aspire resource ${match[1]} restart --apphost ${JSON.stringify(appHost)}`)
  ) return undefined;
  return { resource: match[1], exit: Number(match[2]) };
}

/** Capture one command and return exactly its native exit; diagnostic failure cannot replace it. */
export async function databaseGenerateWithEvidence(input: {
  readonly command: readonly string[];
  readonly appHost: string;
  readonly run?: (command: readonly string[]) => Promise<CapturedInvocation>;
  readonly emit?: (stdout: string, stderr: string) => Promise<void>;
  readonly collect: (invocation: CapturedInvocation) => Promise<void>;
}): Promise<number> {
  const run = input.run ?? (async (command: readonly string[]) => {
    const startedAt = new Date().toISOString();
    const result = await new Deno.Command(command[0], {
      args: command.slice(1),
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    return {
      startedAt,
      completedAt: new Date().toISOString(),
      code: result.code,
      stdout: new TextDecoder().decode(result.stdout),
      stderr: new TextDecoder().decode(result.stderr),
    };
  });
  const invocation = await run(input.command);
  const emit = input.emit ?? (async (stdout, stderr) => {
    await Deno.stdout.write(new TextEncoder().encode(stdout));
    await Deno.stderr.write(new TextEncoder().encode(stderr));
  });
  try {
    await emit(invocation.stdout, invocation.stderr);
  } finally {
    try {
      await input.collect({
        ...invocation,
        process: 'database_cli',
        reportedRestart: reportedRestartFailure(
          invocation.stderr + '\n' + invocation.stdout,
          input.appHost,
        ),
      });
    } catch {
      console.warn('Owned restart diagnostic unavailable; original command outcome preserved.');
    }
  }
  return invocation.code;
}

if (import.meta.main) {
  const [projectRoot, appHost, separator, ...command] = Deno.args;
  if (
    !projectRoot || !appHost || separator !== '--' || command[0] !== 'deno' ||
    !command.includes('generate') || !command.includes('--project-root') ||
    !command.includes(projectRoot)
  ) {
    throw new Error('Expected the existing generated-project database command');
  }
  const code = await databaseGenerateWithEvidence({
    command,
    appHost,
    collect: async (invocation) => {
      const home = Deno.env.get('HOME') ?? Deno.env.get('USERPROFILE');
      const uid = (await Deno.stat(projectRoot)).uid;
      if (!home || uid === null) throw new Error('diagnostic_owner_unavailable');
      await Deno.mkdir(`${projectRoot}/.netscript`, { recursive: true });
      await saveOwnedInvocationDiagnostics({
        projectRoot,
        appHost,
        kind: 'restart',
        home,
        uid,
        transcripts: [invocation],
      });
    },
  });
  Deno.exit(code);
}
