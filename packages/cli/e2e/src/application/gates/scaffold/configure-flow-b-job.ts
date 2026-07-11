const projectRoot = Deno.args[0];
if (!projectRoot) throw new Error('project root argument is required');

const baseUrl = 'http://127.0.0.1:8091/api/v1/workers/jobs/health-check';
const getResponse = await fetch(baseUrl);
if (!getResponse.ok) throw new Error(`Flow-B job read failed: HTTP ${getResponse.status}`);
const current = await getResponse.json();
if (!isRecord(current)) throw new Error('Flow-B job read did not return an object');

const triggerResponse = await fetch(`${baseUrl}/trigger`, { method: 'POST' });
if (!triggerResponse.ok) {
  throw new Error(
    `Flow-B job trigger failed: HTTP ${triggerResponse.status}: ${await triggerResponse.text()}`,
  );
}
console.info(`Flow-B callback job ${String(current.id)} triggered`);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
