import { discoverWorkspaceMembers } from './publish-workspace.ts';
import { JSR_API_BASE_URL } from './config/endpoints.ts';

export interface PublishBudget {
  readonly usage: number;
  readonly limit: number;
  readonly remaining: number;
  readonly requiredAttempts: number;
}

/** Read JSR's rolling scope quota and require room for one coordinated publish attempt. */
export async function checkJsrPublishBudget(
  token: string,
  requiredAttempts: number,
  scope = 'netscript',
  fetcher: typeof fetch = fetch,
): Promise<PublishBudget> {
  if (!token.trim()) throw new Error('JSR_API_TOKEN is required to read scope publish quotas.');
  if (!Number.isInteger(requiredAttempts) || requiredAttempts <= 0) {
    throw new Error(`Required publish attempts must be a positive integer: ${requiredAttempts}`);
  }
  const response = await fetcher(`${JSR_API_BASE_URL}/scopes/${scope}`, {
    headers: { accept: 'application/json', authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(
      `JSR publish-budget lookup failed: HTTP ${response.status} ${response.statusText}`,
    );
  }
  const body: unknown = await response.json();
  const quotas = isRecord(body) && isRecord(body.quotas) ? body.quotas : undefined;
  const usage = quotas?.publishAttemptsPerWeekUsage;
  const limit = quotas?.publishAttemptsPerWeekLimit;
  if (!Number.isInteger(usage) || !Number.isInteger(limit)) {
    throw new Error('JSR publish-budget response is missing integer usage/limit quota fields.');
  }
  const remaining = Number(limit) - Number(usage);
  const budget = { usage: Number(usage), limit: Number(limit), remaining, requiredAttempts };
  if (remaining < requiredAttempts) {
    throw new Error(
      `Canary refused before version minting: JSR @${scope} has ${remaining}/${limit} publish ` +
        `attempts remaining in the rolling 7-day window, but ${requiredAttempts} are required ` +
        'for the coordinated workspace. Wait for attempts to age out or request a quota increase.',
    );
  }
  return budget;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) {
  const token = Deno.env.get('JSR_API_TOKEN') ?? '';
  const requiredAttempts = (await discoverWorkspaceMembers()).length;
  const budget = await checkJsrPublishBudget(token, requiredAttempts);
  console.log(
    `JSR publish budget PASS: ${budget.remaining}/${budget.limit} remain; ` +
      `${budget.requiredAttempts} required for this canary.`,
  );
}
