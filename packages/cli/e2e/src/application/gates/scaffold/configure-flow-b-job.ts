const projectRoot = Deno.args[0];
if (!projectRoot) throw new Error('project root argument is required');

const baseUrl = 'http://127.0.0.1:8091/api/v1/workers/jobs/workers-plugin-health-check';
const getResponse = await fetch(baseUrl);
if (!getResponse.ok) throw new Error(`Flow-B job read failed: HTTP ${getResponse.status}`);
const current = await getResponse.json();
if (!isRecord(current)) throw new Error('Flow-B job read did not return an object');

const sourceUrl = new URL(`file://${projectRoot}/workers/jobs/health-check.ts`).href;
const updateResponse = await fetch(baseUrl, {
  method: 'PUT',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    ...current,
    id: 'workers-plugin-health-check',
    entrypoint: './workers/jobs/health-check.ts',
    sourceUrl,
    permissions: {
      net: true,
      read: true,
      write: false,
      env: true,
      run: false,
      ffi: false,
    },
  }),
});
if (!updateResponse.ok) {
  throw new Error(
    `Flow-B job update failed: HTTP ${updateResponse.status}: ${await updateResponse.text()}`,
  );
}

const triggerResponse = await fetch(`${baseUrl}/trigger`, { method: 'POST' });
if (!triggerResponse.ok) {
  throw new Error(
    `Flow-B job trigger failed: HTTP ${triggerResponse.status}: ${await triggerResponse.text()}`,
  );
}
console.info('Flow-B callback job configured and triggered');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
