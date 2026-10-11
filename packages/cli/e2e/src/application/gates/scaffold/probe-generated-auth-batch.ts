import { dirname } from '@std/path';
import {
  GENERATED_AUTH_CREDENTIAL_CASES,
  parseGeneratedAuthCase,
} from './generated-auth-checks.ts';
import { probeGeneratedGuardedService } from './probe-generated-guarded-service.ts';

/** Reuse only complete verdicts belonging to this exact runner context. */
export async function probeGeneratedAuthBatch(
  projectRoot: string,
  repoRoot: string,
  receiptPath: string,
  token: string,
  requestedCase: string,
  probe = probeGeneratedGuardedService,
): Promise<void> {
  const id = parseGeneratedAuthCase(requestedCase);
  if (!GENERATED_AUTH_CREDENTIAL_CASES.some((candidate) => candidate === id)) {
    throw new Error('Resident anonymous auth checks do not use the pre-start fixture');
  }
  let receipt: unknown;
  try {
    receipt = JSON.parse(await Deno.readTextFile(receiptPath));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound) && !(error instanceof SyntaxError)) throw error;
  }
  if (!matchesReceipt(receipt, token)) {
    // A failed batch cannot leave a partial success receipt for later named gates.
    await probe(projectRoot, repoRoot, GENERATED_AUTH_CREDENTIAL_CASES);
    await Deno.mkdir(dirname(receiptPath), { recursive: true });
    await Deno.writeTextFile(
      receiptPath,
      JSON.stringify({ token, cases: GENERATED_AUTH_CREDENTIAL_CASES }),
    );
  }
  console.info(id + ' PASS; complete native-session batch verified for this run');
}

function matchesReceipt(value: unknown, token: string): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const cases: unknown = Reflect.get(value, 'cases');
  return Reflect.get(value, 'token') === token && Array.isArray(cases) &&
    cases.length === GENERATED_AUTH_CREDENTIAL_CASES.length &&
    GENERATED_AUTH_CREDENTIAL_CASES.every((id, index) => cases[index] === id);
}

if (import.meta.main) {
  const [projectRoot, repoRoot, receiptPath, token, requestedCase] = Deno.args;
  if (!projectRoot || !repoRoot || !receiptPath || !token || !requestedCase) {
    throw new Error('Generated project, repository, receipt, run token and case are required');
  }
  await probeGeneratedAuthBatch(projectRoot, repoRoot, receiptPath, token, requestedCase);
}
