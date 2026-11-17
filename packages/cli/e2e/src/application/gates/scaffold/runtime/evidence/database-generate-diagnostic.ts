import type { CommandObservation } from '../../../../../domain/gate-definition.ts';
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

/** Build a diagnostic observer for the existing direct command executor, never a subprocess wrapper. */
export function databaseGenerateEvidence(
  collect: (
    input: {
      readonly projectRoot: string;
      readonly appHost: string;
      readonly runnerRoot: string;
      readonly invocation: CapturedInvocation;
    },
  ) => Promise<void> = save,
): (observation: CommandObservation) => Promise<void> {
  return async ({ context, result, startedAt, completedAt }) => {
    const appHost = context.project.appHost;
    await collect({
      projectRoot: context.project.projectRoot,
      appHost,
      runnerRoot: context.project.repoRoot,
      invocation: {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
        startedAt,
        completedAt,
        process: 'database_cli',
        timedOut: result.timedOut,
        reportedRestart: reportedRestartFailure(result.stderr + '\n' + result.stdout, appHost),
      },
    });
  };
}
async function save(
  input: {
    readonly projectRoot: string;
    readonly appHost: string;
    readonly runnerRoot: string;
    readonly invocation: CapturedInvocation;
  },
): Promise<void> {
  const home = Deno.env.get('HOME') ?? Deno.env.get('USERPROFILE');
  const uid = (await Deno.stat(input.projectRoot)).uid;
  if (!home || uid === null) throw new Error('diagnostic_owner_unavailable');
  await saveOwnedInvocationDiagnostics({
    projectRoot: input.projectRoot,
    appHost: input.appHost,
    runnerRoot: input.runnerRoot,
    kind: 'restart',
    home,
    uid,
    transcripts: [input.invocation],
  });
}
