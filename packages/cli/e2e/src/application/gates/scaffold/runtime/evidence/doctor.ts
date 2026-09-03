import { dirname } from '@std/path';

/** One structured Aspire doctor finding. */
export interface DoctorFinding {
  readonly category: string;
  readonly name: string;
  readonly status: 'pass' | 'warning' | 'fail';
  readonly message: string;
}

/** Evaluated Aspire doctor result retained as a child receipt. */
export interface AspireDoctorEvaluation {
  readonly checks: readonly DoctorFinding[];
  readonly summary: { readonly passed: number; readonly warnings: number; readonly failed: number };
  readonly warnings: readonly DoctorFinding[];
}

/** Validate Aspire doctor JSON, retaining warnings and rejecting explicit failures. */
export function evaluateAspireDoctor(value: unknown): AspireDoctorEvaluation {
  const root = record(value, 'aspire doctor result');
  const sourceChecks = Reflect.get(root, 'checks');
  if (!Array.isArray(sourceChecks)) throw new Error('aspire doctor result omitted checks[]');
  const checks = sourceChecks.map(doctorFinding);
  const warnings = checks.filter((entry) => entry.status === 'warning');
  const failures = checks.filter((entry) => entry.status === 'fail');
  if (failures.length > 0) {
    throw new Error(failures.map((entry) => `${entry.name}: ${entry.message}`).join('; '));
  }
  return {
    checks,
    summary: {
      passed: checks.filter((entry) => entry.status === 'pass').length,
      warnings: warnings.length,
      failed: failures.length,
    },
    warnings,
  };
}

/** Capture and validate the structured Aspire doctor child receipt. */
export async function captureAspireDoctor(receiptPath: string): Promise<AspireDoctorEvaluation> {
  const output = await new Deno.Command('aspire', {
    args: ['doctor', '--format', 'Json', '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr).trim();
  if (!output.success) {
    throw new Error(`aspire doctor failed (${output.code}): ${stderr || stdout.trim()}`);
  }
  const parsed: unknown = JSON.parse(extractJson(stdout));
  await Deno.mkdir(dirname(receiptPath), { recursive: true });
  await Deno.writeTextFile(receiptPath, `${JSON.stringify(parsed, null, 2)}\n`);
  const evaluation = evaluateAspireDoctor(parsed);
  for (const warning of evaluation.warnings) {
    console.warn(`Aspire doctor warning: ${warning.name}: ${warning.message}`);
  }
  console.info(
    `Aspire doctor: ${evaluation.summary.passed} passed, ` +
      `${evaluation.summary.warnings} warnings, ${evaluation.summary.failed} failed`,
  );
  return evaluation;
}

function doctorFinding(value: unknown, index: number): DoctorFinding {
  const source = record(value, `aspire doctor checks[${index}]`);
  const status = stringField(source, 'status');
  if (status !== 'pass' && status !== 'warning' && status !== 'fail') {
    throw new Error(`aspire doctor checks[${index}] has unknown status ${status}`);
  }
  return {
    category: stringField(source, 'category'),
    name: stringField(source, 'name'),
    status,
    message: stringField(source, 'message'),
  };
}

function extractJson(output: string): string {
  const index = output.indexOf('{');
  if (index < 0) throw new Error('aspire doctor did not emit JSON');
  return output.slice(index);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return Object.fromEntries(Object.entries(value));
}

function stringField(source: Record<string, unknown>, key: string): string {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string') throw new Error(`Expected string ${key}`);
  return value;
}

if (import.meta.main) {
  const receiptPath = Deno.args[0];
  if (!receiptPath) throw new Error('doctor receipt path argument is required');
  await captureAspireDoctor(receiptPath);
}
