import type { CommandSignalAtSettlement } from '../../../../../ports/command-executor.ts';
import type { CommandObservation } from '../../../../../domain/gate-definition.ts';
/** Test-only evidence around the original database.generate command; no additional Aspire calls. */
import { saveOwnedInvocationDiagnostics } from './owned-invocation-diagnostic.ts';
import { type CapturedInvocation, diagnosticResourceName } from './invocation-diagnostic.ts';
import { generatedAppName } from '../generated-app-name.ts';

/** The nested Aspire exit is reported by the CLI, distinct from the captured database CLI exit. */
export function reportedRestartFailure(
  text: string,
  appHost: string,
  scoped: readonly string[] = [],
) {
  const match =
    /Database client generated, but ([a-z][a-z0-9-]{0,127}) restart failed \(Aspire exit ([0-9]{1,3})\)\./
      .exec(text);
  if (
    !match || diagnosticResourceName(match[1], scoped) === null || Number(match[2]) > 255 ||
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
      scopedResources: ['users', generatedAppName(context)],
      startedAt,
      completedAt,
    }, collect);
}

/** Evidence from a direct documented command, using the same safe owning collector. */
export function collectDatabaseGenerateExecution(input: {
  readonly projectRoot: string;
  readonly appHost: string;
  readonly runnerRoot: string;
  readonly result: Pick<
    CommandObservation['result'],
    'code' | 'stdout' | 'stderr' | 'timedOut' | 'signalAtSettlement'
  >;
  readonly scopedResources?: readonly string[];
  readonly startedAt: string;
  readonly completedAt: string;
}, collect: Parameters<typeof databaseGenerateEvidence>[0] = save): Promise<void> {
  return collect({
    projectRoot: input.projectRoot,
    appHost: input.appHost,
    runnerRoot: input.runnerRoot,
    invocation: {
      code: input.result.code,
      stdout: input.result.stdout,
      stderr: input.result.stderr,
      timedOut: input.result.timedOut,
      signalAtSettlement: input.result.signalAtSettlement,
      scopedResources: input.scopedResources,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      process: 'database_cli',
      reportedRestart: reportedRestartFailure(
        input.result.stderr + '\n' + input.result.stdout,
        input.appHost,
        input.scopedResources,
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
    output: {
      result: Deno.CommandOutput;
      startedAt: string;
      completedAt: string;
      signalAtSettlement: CommandSignalAtSettlement;
    },
  ) => Promise<void>)
  | undefined {
  if (words[0] !== 'netscript' || words[1] !== 'db' || words[2] !== 'generate') return undefined;
  return ({ result, startedAt, completedAt, signalAtSettlement }) =>
    collectDatabaseGenerateExecution({
      ...scope,
      startedAt,
      completedAt,
      result: {
        code: result.code,
        stdout: new TextDecoder().decode(result.stdout),
        stderr: new TextDecoder().decode(result.stderr),
        timedOut: signalAtSettlement.deadlineExpired,
        signalAtSettlement,
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
