interface ReportEvidence {
  readonly label?: unknown;
  readonly data?: unknown;
}

interface ReportStep {
  readonly id?: unknown;
  readonly verdict?: unknown;
  readonly error?: unknown;
  readonly evidence?: unknown;
}

const DOWNLOAD_NOISE =
  /^\s*(?:\[[^\]]+\]\s*)?Download https?:\/\/(?:registry\.npmjs\.org|jsr\.io)\//;
const DECISIVE_ERROR =
  /(?:\bError code:\s*[A-Z]\d+\b|(?:^|\]\s+)(?:error|fatal|exception):|failed with exit code)/i;

/** Render failed gate diagnostics from a CLI E2E JSON report. */
export function formatFailedReportSteps(value: unknown): string {
  const failed = failedSteps(value);
  if (failed.length === 0) return 'No failed E2E gates were recorded.';
  return failed.map(formatFailedStep).join('\n\n');
}

/** Render a concise GitHub annotation carrying gate ids and decisive failures. */
export function formatFailedReportAnnotation(value: unknown): string {
  const failed = failedSteps(value);
  if (failed.length === 0) return 'No failed E2E gates were recorded.';
  return failed.map((step) => {
    const id = stringValue(step.id, '<unknown>');
    return `${id}: ${decisiveErrorLines(step).join(' | ')}`;
  }).join('\n');
}

/** Render the failed-gate section appended to GitHub's step summary. */
export function formatFailedReportStepSummary(value: unknown): string {
  return [
    '## Production CLI E2E failure',
    '',
    '```text',
    formatFailedReportAnnotation(value),
    '```',
    '',
    'The uploaded JSON and NDJSON artifacts retain the complete raw command tails.',
    '',
  ].join('\n');
}

/** Render an escaped GitHub workflow error command. */
export function formatFailedReportErrorCommand(value: unknown): string {
  return `::error title=Production CLI E2E failed::${
    escapeWorkflowCommand(
      formatFailedReportAnnotation(value),
    )
  }`;
}

function formatFailedStep(step: ReportStep): string {
  const lines = [
    `FAILED GATE: ${stringValue(step.id, '<unknown>')}`,
    'DECISIVE ERROR:',
    ...decisiveErrorLines(step).map((line) => `  ${line}`),
    'FILTERED TAILS (download noise omitted; raw tails remain in the report artifact):',
  ];
  if (!Array.isArray(step.evidence)) {
    lines.push('evidence: <none>');
    return lines.join('\n');
  }
  for (const evidence of step.evidence) {
    if (!isRecord(evidence)) continue;
    const item = evidence as ReportEvidence;
    const label = stringValue(item.label, '<unlabelled>');
    lines.push(`evidence: ${label}`);
    if (!isRecord(item.data)) {
      lines.push(`  data: ${JSON.stringify(item.data)}`);
      continue;
    }
    lines.push(`  stdout: ${filteredTail(item.data.stdoutTail)}`);
    lines.push(`  stderr: ${filteredTail(item.data.stderrTail)}`);
  }
  return lines.join('\n');
}

function failedSteps(value: unknown): readonly ReportStep[] {
  if (!isRecord(value) || !Array.isArray(value.steps)) {
    throw new Error('E2E report did not contain steps[]');
  }
  return value.steps.filter((step): step is ReportStep =>
    isRecord(step) && step.verdict === 'failed'
  );
}

function decisiveErrorLines(step: ReportStep): readonly string[] {
  const lines = [stringValue(step.error, '<none>')];
  if (Array.isArray(step.evidence)) {
    for (const evidence of step.evidence) {
      if (!isRecord(evidence) || !isRecord(evidence.data)) continue;
      for (const tail of [evidence.data.stdoutTail, evidence.data.stderrTail]) {
        if (typeof tail !== 'string') continue;
        lines.push(...tail.split(/\r?\n/).filter((line) => DECISIVE_ERROR.test(line)));
      }
    }
  }
  return [...new Set(lines.map((line) => line.trim()).filter((line) => line.length > 0))];
}

function filteredTail(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return '<empty>';
  const filtered = value.split(/\r?\n/).filter((line) => !DOWNLOAD_NOISE.test(line)).join('\n');
  return filtered.trim().length > 0 ? filtered.trim() : '<empty after download-noise filtering>';
}

function escapeWorkflowCommand(value: string): string {
  return value.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) {
  const githubMode = Deno.args.includes('--github');
  const path = Deno.args.find((arg) => arg !== '--github');
  if (!path) throw new Error('E2E report path is required');
  const report = JSON.parse(await Deno.readTextFile(path)) as unknown;
  if (githubMode) {
    console.log(formatFailedReportErrorCommand(report));
    const summaryPath = Deno.env.get('GITHUB_STEP_SUMMARY');
    if (summaryPath) {
      await Deno.writeTextFile(summaryPath, formatFailedReportStepSummary(report), {
        append: true,
      });
    }
  }
  console.log(formatFailedReportSteps(report));
}
