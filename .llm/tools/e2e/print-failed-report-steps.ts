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

/** Render failed gate diagnostics from a CLI E2E JSON report. */
export function formatFailedReportSteps(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.steps)) {
    throw new Error('E2E report did not contain steps[]');
  }
  const failed = value.steps.filter((step): step is ReportStep =>
    isRecord(step) && step.verdict === 'failed'
  );
  if (failed.length === 0) return 'No failed E2E gates were recorded.';
  return failed.map(formatFailedStep).join('\n\n');
}

function formatFailedStep(step: ReportStep): string {
  const lines = [
    `FAILED GATE: ${stringValue(step.id, '<unknown>')}`,
    `error: ${stringValue(step.error, '<none>')}`,
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
    lines.push(`  stdout: ${stringValue(item.data.stdoutTail, '<empty>')}`);
    lines.push(`  stderr: ${stringValue(item.data.stderrTail, '<empty>')}`);
  }
  return lines.join('\n');
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) {
  const [path] = Deno.args;
  if (!path) throw new Error('E2E report path is required');
  const report = JSON.parse(await Deno.readTextFile(path)) as unknown;
  console.log(formatFailedReportSteps(report));
}
