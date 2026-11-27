/** Live #2259 Postgres proof helpers: Prisma Studio DB query and Dashboard detail masking. */

import { assertNoSecretBytes } from './credential-secret-surfaces.ts';
import { waitForEvaluation, withHeadlessChrome } from './probe-island-hydration.ts';

export const PRISMA_STUDIO_DEFAULT_URL = 'http://127.0.0.1:5555';
export const PRISMA_STUDIO_READ_SQL =
  'SELECT current_database() AS database_name, name FROM "User" WHERE name = \'Seed User\' LIMIT 1';
const STUDIO_RETRY_TIMEOUT_MS = 20_000;
const STUDIO_RETRY_DELAY_MS = 500;
const CONNECTION_ENV_NAMES = ['DATABASE_URL', 'POSTGRES_URI'] as const;

export interface PrismaStudioReadReceipt {
  readonly url: string;
  readonly databaseName: string;
  readonly sampledRecordName: string;
}

export interface DashboardEnvironmentRow {
  readonly name: string;
  readonly valueText: string;
  readonly masked: boolean;
}

export interface DashboardResourceDetailObservation {
  readonly resourceName: string | null;
  readonly html: string;
  readonly text: string;
  readonly envRows: readonly DashboardEnvironmentRow[];
}

export interface DashboardMaskingTarget {
  readonly label: 'users' | 'prisma-studio';
  readonly resourceName: string;
}

/** Execute a read-only SQL query through Prisma Studio's `/bff` endpoint against seeded Postgres data. */
export async function assertPrismaStudioDatabaseRead(
  baseUrl: string = PRISMA_STUDIO_DEFAULT_URL,
  secrets: readonly string[],
  options: {
    readonly fetchImpl?: typeof fetch;
    readonly timeoutMs?: number;
    readonly delayMs?: number;
  } = {},
): Promise<PrismaStudioReadReceipt> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? STUDIO_RETRY_TIMEOUT_MS;
  const delayMs = options.delayMs ?? STUDIO_RETRY_DELAY_MS;
  const endpoint = new URL('/bff', baseUrl);
  const startedAt = Date.now();
  let lastTransientError = 'no attempt recorded';

  while (true) {
    let response: Response;
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          procedure: 'query',
          query: { sql: PRISMA_STUDIO_READ_SQL, parameters: [] },
        }),
      });
    } catch (error) {
      lastTransientError = error instanceof Error ? error.message : String(error);
      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(
          `prisma-studio /bff query failed at ${endpoint.origin}: ${lastTransientError}`,
        );
      }
      if (delayMs > 0) await sleep(delayMs);
      continue;
    }

    const rawText = await response.text();
    assertNoSecretBytes('prisma-studio bff', rawText, secrets);
    if (!response.ok) {
      if (response.status >= 500 && Date.now() - startedAt < timeoutMs) {
        lastTransientError = `HTTP ${response.status}`;
        if (delayMs > 0) await sleep(delayMs);
        continue;
      }
      throw new Error(`prisma-studio /bff returned HTTP ${response.status}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error('prisma-studio /bff returned invalid JSON');
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('prisma-studio /bff response omitted query tuple [error, rows]');
    }
    if (parsed[0] != null) {
      const sqlError = isRecord(parsed[0]) && typeof parsed[0].message === 'string'
        ? parsed[0].message
        : 'query failed';
      if (Date.now() - startedAt < timeoutMs && /connect|timeout|econnrefused/i.test(sqlError)) {
        lastTransientError = sqlError;
        if (delayMs > 0) await sleep(delayMs);
        continue;
      }
      throw new Error(`prisma-studio /bff SQL error: ${sqlError}`);
    }
    if (parsed.length < 2) {
      throw new Error('prisma-studio /bff response omitted query rows');
    }

    const rows = parsed[1];
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('prisma-studio /bff returned zero rows for seeded User query');
    }
    const first = rows[0];
    if (!isRecord(first)) throw new Error('prisma-studio /bff first row is not an object');
    const databaseName = typeof first.database_name === 'string' ? first.database_name.trim() : '';
    const sampledRecordName = typeof first.name === 'string' ? first.name : '';
    if (!databaseName || sampledRecordName !== 'Seed User') {
      throw new Error(
        `prisma-studio /bff returned unexpected row: db=${JSON.stringify(databaseName)} name=${
          JSON.stringify(sampledRecordName)
        }`,
      );
    }
    return { url: endpoint.origin, databaseName, sampledRecordName };
  }
}

/** Validate a rendered Aspire Dashboard resource detail page shows masked connection fields with zero secrets. */
export function verifyDashboardResourceDetailObservation(
  observation: DashboardResourceDetailObservation,
  expectedResourceName: string,
  secrets: readonly string[],
): readonly string[] {
  assertNoSecretBytes(
    `aspire dashboard resource (${expectedResourceName}) html`,
    observation.html,
    secrets,
  );
  assertNoSecretBytes(
    `aspire dashboard resource (${expectedResourceName}) text`,
    observation.text,
    secrets,
  );

  if (observation.resourceName !== expectedResourceName) {
    throw new Error(
      `aspire dashboard detail resource was ${JSON.stringify(observation.resourceName)}, ` +
        `expected ${JSON.stringify(expectedResourceName)}`,
    );
  }
  if (observation.envRows.length === 0) {
    throw new Error(`aspire dashboard detail for ${expectedResourceName} rendered zero env rows`);
  }

  const byName = new Map<string, DashboardEnvironmentRow>();
  for (const row of observation.envRows) {
    if (row.name) byName.set(row.name, row);
  }

  for (const required of CONNECTION_ENV_NAMES) {
    if (!byName.has(required)) {
      throw new Error(
        `aspire dashboard detail for ${expectedResourceName} omitted ${required} (saw ${
          [...byName.keys()].join(', ')
        })`,
      );
    }
  }
  const connectionStrings = observation.envRows.filter((row) =>
    row.name.startsWith('ConnectionStrings__')
  );
  if (connectionStrings.length === 0) {
    throw new Error(
      `aspire dashboard detail for ${expectedResourceName} omitted ConnectionStrings__* (saw ${
        [...byName.keys()].join(', ')
      })`,
    );
  }

  const verifiedNames: string[] = [];
  for (
    const row of [
      byName.get('DATABASE_URL')!,
      byName.get('POSTGRES_URI')!,
      ...connectionStrings,
    ]
  ) {
    if (!row.masked) {
      throw new Error(
        `aspire dashboard detail for ${expectedResourceName} did not mask ${row.name}`,
      );
    }
    if (!row.valueText.trim()) {
      throw new Error(
        `aspire dashboard detail for ${expectedResourceName} rendered empty value for ${row.name}`,
      );
    }
    if (/(?:postgres(?:ql)?:\/\/|password=)/i.test(row.valueText)) {
      throw new Error(
        `aspire dashboard detail for ${expectedResourceName} exposed connection syntax for ${row.name}`,
      );
    }
    verifiedNames.push(row.name);
  }
  return verifiedNames;
}

/** Open Aspire Dashboard in headless Chrome and verify resource details mask connection strings for every target. */
export async function assertDashboardResourceDetailsMasked(
  dashboardUrl: string,
  targets: readonly DashboardMaskingTarget[],
  secrets: readonly string[],
): Promise<readonly string[]> {
  if (targets.length === 0) throw new Error('at least one dashboard masking target is required');
  const parsed = new URL(dashboardUrl);
  const loginToken = parsed.searchParams.get('t');

  return await withHeadlessChrome('dashboard-masking', async (client) => {
    await client.send('Page.navigate', { url: dashboardUrl });
    await client.waitFor('Page.loadEventFired');

    if (loginToken) {
      const authStatus = await client.evaluate<string>(
        `(async () => {
          if (window.location.pathname !== '/login') return 'authenticated';
          const res = await fetch('/api/validatetoken', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: ${JSON.stringify(loginToken)} }),
          });
          const body = await res.text();
          return res.ok && body.trim() === 'true' ? 'validated' : 'failed:' + res.status;
        })()`,
      );
      if (!authStatus || authStatus.startsWith('failed:')) {
        throw new Error(`aspire dashboard token authentication failed (${authStatus ?? 'empty'})`);
      }
    }

    const verifiedResources: string[] = [];
    for (const target of targets) {
      const resourceUrl = new URL(
        `/resources/${encodeURIComponent(target.resourceName)}`,
        parsed.origin,
      )
        .toString();
      await client.send('Page.navigate', { url: resourceUrl });
      await client.waitFor('Page.loadEventFired');

      await waitForEvaluation<{ readonly ready: boolean }>(
        client,
        `(() => {
          const overview = document.querySelector('.resource-overview[data-resource-name]');
          const envSection = document.querySelector('section[aria-labelledby="overview-environment-title"]');
          const cells = envSection ? envSection.querySelectorAll('.env-var-properties .grid-value').length : 0;
          return {
            ready: overview?.getAttribute('data-resource-name') === ${
          JSON.stringify(target.resourceName)
        } && cells > 0,
          };
        })()`,
        (state) => state?.ready === true,
        `Aspire Dashboard resource detail (${target.resourceName})`,
      );

      // Expand preview list via ShowMoreButton if connection variables sit past DetailsPreviewCount (10).
      // Strictly target `> button.overview-show-more` so we never click header unmask eye icons.
      await waitForEvaluation<{ readonly complete: boolean }>(
        client,
        `(() => {
          const envSection = document.querySelector('section[aria-labelledby="overview-environment-title"]');
          if (!envSection) return { complete: false };
          const names = Array.from(envSection.querySelectorAll('.nameColumn .grid-value')).map((el) =>
            (el.textContent ?? '').trim()
          );
          const hasAll = names.includes('DATABASE_URL') &&
            names.includes('POSTGRES_URI') &&
            names.some((name) => name.startsWith('ConnectionStrings__'));
          if (hasAll) return { complete: true };
          const showMore = envSection.querySelector(':scope > button.overview-show-more');
          if (showMore instanceof HTMLButtonElement && !(showMore.textContent ?? '').toLowerCase().includes('show less')) {
            showMore.click();
          }
          return { complete: false };
        })()`,
        (state) => state?.complete === true,
        `Aspire Dashboard environment rows (${target.resourceName})`,
      );

      const observation = await client.evaluate<DashboardResourceDetailObservation>(
        `(() => {
          const overview = document.querySelector('.resource-overview[data-resource-name]');
          const envSection = document.querySelector('section[aria-labelledby="overview-environment-title"]');
          const rows = [];
          if (envSection) {
            for (const row of envSection.querySelectorAll('.env-var-properties [role="row"], .env-var-properties tr')) {
              const nameEl = row.querySelector('.nameColumn .grid-value');
              const valueEl = row.querySelector('.valueColumn .grid-value');
              if (!nameEl || !valueEl) continue;
              rows.push({
                name: (nameEl.textContent ?? '').trim(),
                valueText: (valueEl.textContent ?? '').trim(),
                masked: valueEl.classList.contains('masked'),
              });
            }
          }
          return {
            resourceName: overview?.getAttribute('data-resource-name') ?? null,
            html: document.documentElement?.innerHTML ?? '',
            text: document.body?.innerText ?? '',
            envRows: rows,
          };
        })()`,
      );
      if (!observation) {
        throw new Error(
          `aspire dashboard DOM evaluation returned empty for ${target.resourceName}`,
        );
      }
      verifyDashboardResourceDetailObservation(observation, target.resourceName, secrets);
      verifiedResources.push(target.resourceName);
    }
    return verifiedResources;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
