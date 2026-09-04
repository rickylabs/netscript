/** Authenticated, value-free subscription usage acquisition for paid providers. */

import { OPENCODE_GO_USAGE_URL } from '../config/endpoints.ts';
import { environmentWithOpenCodeCredential } from '../lib/provider-credential.ts';
import type {
  ExpenseUsageSnapshot,
  ExpenseUsageWindowId,
  ExpenseUsageWindowSnapshot,
} from './subscription-expense.ts';

type Environment = Readonly<Record<string, string | undefined>>;

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
