/** Authenticated, value-free subscription usage acquisition for paid providers. */

import { OPENCODE_GO_USAGE_URL } from '../config/endpoints.ts';
import { dirname, isAbsolute, relative, resolve } from '@std/path';
import {
  type CopilotCreditLedger,
  evaluateCopilotExpense,
  type ExpenseDecision,
} from './subscription-expense.ts';
import { environmentWithOpenCodeCredential } from '../lib/provider-credential.ts';
import type {
  ExpenseUsageSnapshot,
  ExpenseUsageWindowId,
  ExpenseUsageWindowSnapshot,
} from './subscription-expense.ts';

type Environment = Readonly<Record<string, string | undefined>>;

/** Resolves operational accounting outside the selected repository. */
export function copilotLedgerPath(env: Environment, worktree: string): string {
  const home = env.HOME?.trim();
  if (!home || !isAbsolute(home)) throw new Error('Copilot ledger requires an absolute user HOME');
  const path = resolve(home, '.config/netscript-agentic/copilot-credits.json');
  const rel = relative(resolve(worktree), path);
  if (rel === '' || (!rel.startsWith('..' + '/') && !isAbsolute(rel))) {
    throw new Error('Copilot ledger must be outside the repository');
  }
  return path;
}

/** Reserves the full cap atomically; missing state or concurrent writers fail closed. */
export async function reserveCopilotCredits(options: {
  readonly cap: number;
  readonly now: string;
  readonly worktree: string;
  readonly env?: Environment;
}): Promise<ExpenseDecision> {
  const path = copilotLedgerPath(options.env ?? Deno.env.toObject(), options.worktree);
  const lockPath = `${path}.lock`;
  let lock: Deno.FsFile;
  try {
    lock = await Deno.open(lockPath, { write: true, createNew: true, mode: 0o600 });
  } catch {
    throw new Error('Copilot ledger unavailable or locked');
  }
  let temporary: string | undefined;
  try {
    let ledger: unknown;
    try {
      ledger = JSON.parse(await Deno.readTextFile(path));
    } catch {
      ledger = null;
    }
    const decision = evaluateCopilotExpense(ledger, options.cap, options.now);
    if (!decision.allowed) return decision;
    const month = new Date(options.now).toISOString().slice(0, 7);
    const prior = ledger as CopilotCreditLedger;
    const next: CopilotCreditLedger = {
      schemaVersion: 1,
      month,
      updatedAt: options.now,
      usedCredits: (prior.month === month ? prior.usedCredits : 0) + options.cap,
    };
    temporary = await Deno.makeTempFile({ dir: dirname(path), prefix: 'copilot-credits-' });
    await Deno.chmod(temporary, 0o600);
    await Deno.writeTextFile(temporary, JSON.stringify(next) + '\n');
    await Deno.rename(temporary, path);
    temporary = undefined;
    return decision;
  } finally {
    if (temporary) await Deno.remove(temporary);
    lock.close();
    await Deno.remove(lockPath);
  }
}

export interface OpenCodeGoUsageDependencies {
  readonly env?: Environment;
  readonly fetch?: typeof fetch;
  readonly now?: () => string;
  readonly readTextFile?: (path: string) => Promise<string>;
  readonly stat?: (path: string) => Promise<Pick<Deno.FileInfo, 'mode'>>;
}

interface OpenCodeGoUsagePayload {
  readonly usage?: Readonly<Record<string, unknown>>;
}

const WINDOW_KEYS: Readonly<Record<ExpenseUsageWindowId, string>> = {
  rolling_five_hours: 'rolling',
  weekly: 'weekly',
  monthly: 'monthly',
};

function parseWindow(value: unknown, name: string): ExpenseUsageWindowSnapshot {
  if (!value || typeof value !== 'object') {
    throw new Error(`OpenCode Go usage response is missing ${name}`);
  }
  const percent = (value as { percent?: unknown }).percent;
  const status = (value as { status?: unknown }).status;
  const resetsAt = (value as { resetsAt?: unknown }).resetsAt;
  if (
    typeof percent !== 'number' || !Number.isFinite(percent) || percent < 0 ||
    typeof status !== 'string' || status.trim().length === 0 ||
    (resetsAt !== undefined && typeof resetsAt !== 'string')
  ) {
    throw new Error(`OpenCode Go usage response has an invalid ${name}`);
  }
  return {
    percent,
    status,
    ...(typeof resetsAt === 'string' ? { resetsAt } : {}),
  };
}

/** Parses the public usage shape without retaining any credential or response body. */
export function parseOpenCodeGoUsagePayload(
  value: unknown,
  capturedAt: string,
): ExpenseUsageSnapshot {
  if (!value || typeof value !== 'object') {
    throw new Error('OpenCode Go usage response must be an object');
  }
  const usage = (value as OpenCodeGoUsagePayload).usage;
  if (!usage || typeof usage !== 'object') {
    throw new Error('OpenCode Go usage response is missing usage');
  }
  const percentageWindows = Object.fromEntries(
    Object.entries(WINDOW_KEYS).map(([id, key]) => [
      id,
      parseWindow(usage[key], key),
    ]),
  ) as Record<ExpenseUsageWindowId, ExpenseUsageWindowSnapshot>;
  return { provider: 'opencode_go', capturedAt, percentageWindows };
}

/** Fetches live Go usage; transport, auth, and shape errors fail closed without secret values. */
export async function fetchOpenCodeGoUsageSnapshot(
  model: string,
  dependencies: OpenCodeGoUsageDependencies = {},
): Promise<ExpenseUsageSnapshot> {
  const env = dependencies.env ?? Deno.env.toObject();
  const credentialed = await environmentWithOpenCodeCredential(
    model,
    env,
    dependencies.readTextFile ?? Deno.readTextFile,
    dependencies.stat ?? Deno.stat,
  );
  const credential = credentialed.OPENCODE_API_KEY;
  if (!credential) throw new Error('OpenCode Go usage credential is unavailable');

  let response: Response;
  try {
    response = await (dependencies.fetch ?? fetch)(OPENCODE_GO_USAGE_URL, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${credential}`,
      },
    });
  } catch {
    throw new Error('OpenCode Go usage request failed');
  }
  if (!response.ok) {
    throw new Error(`OpenCode Go usage request returned HTTP ${response.status}`);
  }
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new Error('OpenCode Go usage response was not valid JSON');
  }
  return parseOpenCodeGoUsagePayload(
    value,
    (dependencies.now ?? (() => new Date().toISOString()))(),
  );
}
