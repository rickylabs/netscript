import { resolveResourceUrlsFromAppHost } from './generated-app-endpoint.ts';

type ProbeAction =
  | 'get'
  | 'post'
  | 'workers-trigger'
  | 'workers-executions'
  | 'trigger-webhook'
  | 'trigger-events';

const ATTEMPTS = 30;
const RETRY_DELAY_MS = 1_000;

/** Probe a plugin resource through URLs allocated by the running Aspire AppHost. */
export async function probePluginResource(
  appHost: string,
  resourceName: string,
  action: ProbeAction,
  path?: string,
): Promise<void> {
  const baseUrls = await resolveResourceUrlsFromAppHost(appHost, resourceName);
  const errors: string[] = [];

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    for (const baseUrl of baseUrls) {
      try {
        await runAction(baseUrl, action, path);
        console.info(`${resourceName} ${action} probe passed via ${baseUrl}`);
        return;
      } catch (error) {
        errors.push(
          `${baseUrl}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    if (attempt < ATTEMPTS) await delay(RETRY_DELAY_MS);
  }

  throw new Error(
    `${resourceName} ${action} probe failed after ${ATTEMPTS} attempts: ${errors.at(-1)}`,
  );
}

async function runAction(
  baseUrl: string,
  action: ProbeAction,
  path?: string,
): Promise<void> {
  switch (action) {
    case 'get':
      await expectOk(baseUrl, requiredPath(path), 'GET');
      return;
    case 'post':
      await expectOk(baseUrl, requiredPath(path), 'POST');
      return;
    case 'workers-trigger':
      await triggerWorkerHealthJob(baseUrl);
      return;
    case 'workers-executions':
      await validateWorkerExecutions(baseUrl);
      return;
    case 'trigger-webhook':
      await acceptTriggerWebhook(baseUrl);
      return;
    case 'trigger-events':
      await validateTriggerEvents(baseUrl);
      return;
  }
}

async function expectOk(
  baseUrl: string,
  path: string,
  method: 'GET' | 'POST',
): Promise<Response> {
  const url = resourceUrl(baseUrl, path);
  const response = await fetch(url, { method });
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} from ${url}: ${(await response.text()).slice(0, 200)}`,
    );
  }
  return response;
}

async function triggerWorkerHealthJob(baseUrl: string): Promise<void> {
  const path = '/api/v1/workers/jobs/health-check';
  const currentResponse = await expectOk(baseUrl, path, 'GET');
  const current: unknown = await currentResponse.json();
  if (!isRecord(current)) {
    throw new Error('Flow-B job read did not return an object');
  }
  await expectOk(baseUrl, `${path}/trigger`, 'POST');
  console.info(`Flow-B callback job ${String(current.id)} triggered`);
}

async function validateWorkerExecutions(baseUrl: string): Promise<void> {
  const response = await expectOk(
    baseUrl,
    '/api/v1/workers/executions?limit=10',
    'GET',
  );
  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.executions)) {
    throw new Error('workers executions response is missing executions[]');
  }
  const completed = body.executions.filter(isRecord).some((execution) =>
    execution.jobId === 'health-check' && execution.status === 'completed'
  );
  if (!completed) {
    throw new Error('health-check execution has not completed yet');
  }
}

async function acceptTriggerWebhook(baseUrl: string): Promise<void> {
  const url = resourceUrl(baseUrl, '/api/v1/webhooks/inbound/generic');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: 'e2e-trigger-gate',
      timestamp: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} from ${url}: ${(await response.text()).slice(0, 200)}`,
    );
  }
}

async function validateTriggerEvents(baseUrl: string): Promise<void> {
  const response = await expectOk(baseUrl, '/api/v1/events?limit=10', 'GET');
  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.events)) {
    throw new Error('events response is missing events[]');
  }
  if (typeof body.total !== 'number') {
    throw new Error('events response is missing total');
  }
  if (body.total < 1) {
    throw new Error('expected at least one trigger event after webhook gate');
  }
}

function resourceUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
    .toString();
}

function requiredPath(path: string | undefined): string {
  if (!path) throw new Error('probe path argument is required');
  return path;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

if (import.meta.main) {
  const appHost = Deno.args[0];
  const resourceName = Deno.args[1];
  const action = Deno.args[2];
  const path = Deno.args[3];
  if (!appHost) throw new Error('apphost argument is required');
  if (!resourceName) throw new Error('resource name argument is required');
  if (!isProbeAction(action)) {
    throw new Error(`unsupported plugin probe action: ${action}`);
  }
  await probePluginResource(appHost, resourceName, action, path);
}

function isProbeAction(value: string | undefined): value is ProbeAction {
  return value === 'get' || value === 'post' || value === 'workers-trigger' ||
    value === 'workers-executions' || value === 'trigger-webhook' ||
    value === 'trigger-events';
}
