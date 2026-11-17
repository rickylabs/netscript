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
  return ({ context, result, startedAt, completedAt }) =>
    collectDatabaseGenerateExecution({
      projectRoot: context.project.projectRoot,
      appHost: context.project.appHost,
      runnerRoot: context.project.repoRoot,
      result,
      startedAt,
      completedAt,
    }, collect);
}

/** Evidence from a direct documented command, using the same safe owning collector. */
export function collectDatabaseGenerateExecution(input: {
  readonly projectRoot: string;
  readonly appHost: string;
  readonly runnerRoot: string;
  readonly result: Pick<CommandObservation['result'], 'code' | 'stdout' | 'stderr' | 'timedOut'>;
  readonly startedAt: string;
  readonly completedAt: string;
}, collect: Parameters<typeof databaseGenerateEvidence>[0] = save): Promise<void> {
  return collect({
    projectRoot: input.projectRoot,
    appHost: input.appHost,
    runnerRoot: input.runnerRoot,
    invocation: {
      ...input.result,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      process: 'database_cli',
      reportedRestart: reportedRestartFailure(
        input.result.stderr + '\n' + input.result.stdout,
        input.appHost,
      ),
    },
  });
}

/** Select only the actual documented database-generation command, before native execution. */
export function documentedDatabaseGenerateEvidence(
  words: readonly string[],
  scope: { readonly projectRoot: string; readonly appHost: string; readonly runnerRoot: string },
  collect?: Parameters<typeof databaseGenerateEvidence>[0],
):
  | ((
    output: { result: Deno.CommandOutput; startedAt: string; completedAt: string },
  ) => Promise<void>)
  | undefined {
  if (words[0] !== 'netscript' || words[1] !== 'db' || words[2] !== 'generate') return undefined;
  return ({ result, startedAt, completedAt }) =>
    collectDatabaseGenerateExecution({
      ...scope,
      startedAt,
      completedAt,
      result: {
        code: result.code,
        stdout: new TextDecoder().decode(result.stdout),
        stderr: new TextDecoder().decode(result.stderr),
        timedOut: false,
      },
    }, collect);
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
