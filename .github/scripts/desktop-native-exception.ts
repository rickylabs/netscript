/** Fail closed unless the desktop lane passes or reproduces active issue #859 exactly. */

export type DesktopNativePolicyVerdict = 'passed' | 'accepted-issue-859';

interface DesktopEvidence {
  readonly status?: unknown;
  readonly failure?: unknown;
}

const ISSUE_859_MARKERS = [
  'v1 failed to stage v2:',
  'Update written to ',
  '.so.update. Will be applied on next launch.',
] as const;

/** Accept a green suite, or only the narrow staged-update callback gap tracked by #859. */
export function enforceDesktopNativePolicy(
  outcome: string,
  evidence: DesktopEvidence,
): DesktopNativePolicyVerdict {
  if (outcome === 'success') {
    if (evidence.status !== 'PASS') {
      throw new Error('desktop suite reported success without PASS evidence');
    }
    return 'passed';
  }
  if (outcome !== 'failure') {
    throw new Error(`desktop suite has unsupported outcome '${outcome}'`);
  }
  if (evidence.status !== 'FAIL' || typeof evidence.failure !== 'string') {
    throw new Error('desktop suite failure lacks structured FAIL evidence');
  }
  const failure = evidence.failure;
  const missing = ISSUE_859_MARKERS.filter((marker) => !failure.includes(marker));
  if (missing.length > 0) {
    throw new Error(`desktop failure is outside active issue #859: missing ${missing.join(', ')}`);
  }
  return 'accepted-issue-859';
}

function argument(name: string): string {
  const index = Deno.args.indexOf(name);
  const value = index < 0 ? undefined : Deno.args[index + 1];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

if (import.meta.main) {
  try {
    const outcome = argument('--outcome');
    const evidencePath = argument('--evidence');
    const evidence = JSON.parse(await Deno.readTextFile(evidencePath)) as DesktopEvidence;
    const verdict = enforceDesktopNativePolicy(outcome, evidence);
    const summary = verdict === 'passed'
      ? 'Desktop native Linux suite passed.'
      : 'Desktop native Linux reproduced the staged-update callback gap tracked by active issue #859; no other failure is tolerated.';
    console.log(summary);
    const summaryPath = Deno.env.get('GITHUB_STEP_SUMMARY');
    if (summaryPath) {
      await Deno.writeTextFile(summaryPath, `## Desktop native policy\n\n${summary}\n`, {
        append: true,
      });
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
