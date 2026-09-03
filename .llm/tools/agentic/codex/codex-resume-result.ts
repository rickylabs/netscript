export const CODEX_RESUME_OUTCOMES = ['accepted', 'rejected', 'failed'] as const;

export type CodexResumeOutcome = typeof CODEX_RESUME_OUTCOMES[number];

export const CODEX_RESUME_REJECTION_SIGNATURES = [
  'thread-store conflict: already has an active writer',
] as const;

export interface CodexResumeChildResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** Classifies a resume child result without changing or rendering its output. */
export function classifyCodexResumeOutcome(
  result: CodexResumeChildResult,
): CodexResumeOutcome {
  const rejected = CODEX_RESUME_REJECTION_SIGNATURES.some((signature) =>
    result.stdout.includes(signature) || result.stderr.includes(signature)
  );
  if (rejected) return 'rejected';
  return result.code === 0 ? 'accepted' : 'failed';
}

/** Maps a resume outcome to the wrapper's stable process exit contract. */
export function codexResumeExitCode(outcome: CodexResumeOutcome): 0 | 1 {
  return outcome === 'accepted' ? 0 : 1;
}
