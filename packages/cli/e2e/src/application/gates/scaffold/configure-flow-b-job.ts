import { resolveResourceUrlsFromAppHost } from './generated-app-endpoint.ts';

async function main(): Promise<void> {
  const appHost = Deno.args[0];
  if (!appHost) throw new Error('apphost argument is required');

  const errors: string[] = [];
  for (const resourceUrl of await resolveResourceUrlsFromAppHost(appHost, 'workers-api')) {
    const jobUrl = new URL('/api/v1/workers/jobs/health-check', resourceUrl).toString();
    try {
      const getResponse = await fetch(jobUrl);
      if (!getResponse.ok) throw new Error(`Flow-B job read failed: HTTP ${getResponse.status}`);
      const current: unknown = await getResponse.json();
      if (!isRecord(current)) throw new Error('Flow-B job read did not return an object');

      const triggerResponse = await fetch(`${jobUrl}/trigger`, { method: 'POST' });
      if (!triggerResponse.ok) {
        throw new Error(
          `Flow-B job trigger failed: HTTP ${triggerResponse.status}: ${await triggerResponse
            .text()}`,
        );
      }
      console.info(`Flow-B callback job ${String(current.id)} triggered`);
      return;
    } catch (error) {
      errors.push(`${jobUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(
    `Flow-B job trigger failed for every declared endpoint: ${errors.join('; ')}`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) await main();
