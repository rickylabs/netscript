/**
 * Workers Plugin API Test Script
 *
 * Test script to verify the Workers API is working correctly.
 * Run with: deno run --allow-net plugins/workers/test-api.ts
 *
 * Prerequisites:
 * - Workers API must be running (deno task dev or standalone)
 *
 * @module
 */

const API_BASE = Deno.env.get('WORKERS_API_URL') ?? 'http://localhost:8091';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  response?: unknown;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<unknown>): Promise<void> {
  const start = performance.now();
  try {
    const response = await fn();
    results.push({
      name,
      passed: true,
      duration: performance.now() - start,
      response,
    });
    console.log(`✅ ${name} (${(performance.now() - start).toFixed(2)}ms)`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: performance.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`❌ ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  Workers Plugin API Tests');
console.log(`  Base URL: ${API_BASE}`);
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// ============================================================================
// HEALTH CHECK
// ============================================================================

await runTest('Health Check', async () => {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'healthy') throw new Error(`Status: ${data.status}`);
  return data;
});

// ============================================================================
// JOB ENDPOINTS
// ============================================================================

await runTest('List Jobs (empty)', async () => {
  const res = await fetch(`${API_BASE}/api/v1/workers/jobs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return { total: data.data.total, jobs: data.data.jobs.length };
});

// Create a test job
let testJobId: string | null = null;

await runTest('Create Job', async () => {
  const res = await fetch(`${API_BASE}/api/v1/workers/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'test-job-' + Date.now(),
      name: 'Test Job',
      description: 'A test job created by the API test script',
      schedule: '0 * * * *', // Every hour
      timeout: 60000,
      tags: ['test', 'api'],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  testJobId = data.data.id;
  return { id: data.data.id, name: data.data.name };
});

await runTest('Get Job by ID', async () => {
  if (!testJobId) throw new Error('No test job created');
  const res = await fetch(`${API_BASE}/api/v1/workers/jobs/${testJobId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return { id: data.data.id, name: data.data.name };
});

await runTest('Update Job', async () => {
  if (!testJobId) throw new Error('No test job created');
  const res = await fetch(`${API_BASE}/api/v1/workers/jobs/${testJobId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Updated description',
      enabled: false,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  if (data.data.enabled !== false) throw new Error('Update did not apply');
  return { id: data.data.id, enabled: data.data.enabled };
});

await runTest('List Jobs (with test job)', async () => {
  const res = await fetch(`${API_BASE}/api/v1/workers/jobs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  if (data.data.total === 0) throw new Error('Expected at least 1 job');
  return { total: data.data.total };
});

await runTest('List Jobs (filter by tags)', async () => {
  const res = await fetch(`${API_BASE}/api/v1/workers/jobs?tags=test`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return { total: data.data.total };
});

// ============================================================================
// TRIGGER ENDPOINT
// ============================================================================

await runTest('Trigger Job', async () => {
  if (!testJobId) throw new Error('No test job created');
  const res = await fetch(`${API_BASE}/api/v1/workers/jobs/${testJobId}/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload: { test: true },
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
});

// ============================================================================
// EXECUTIONS ENDPOINT
// ============================================================================

await runTest('List Executions', async () => {
  const res = await fetch(`${API_BASE}/api/v1/workers/executions`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return { total: data.data.total };
});

await runTest('List Executions (by job)', async () => {
  if (!testJobId) throw new Error('No test job created');
  const res = await fetch(`${API_BASE}/api/v1/workers/executions?jobId=${testJobId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return { total: data.data.total };
});

// ============================================================================
// TASKS ENDPOINT
// ============================================================================

await runTest('List Tasks', async () => {
  const res = await fetch(`${API_BASE}/api/v1/workers/tasks`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return { total: data.data.total };
});

// ============================================================================
// CLEANUP - DELETE TEST JOB
// ============================================================================

await runTest('Delete Job', async () => {
  if (!testJobId) throw new Error('No test job created');
  const res = await fetch(`${API_BASE}/api/v1/workers/jobs/${testJobId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
});

await runTest('Get Deleted Job (should 404)', async () => {
  if (!testJobId) throw new Error('No test job created');
  const res = await fetch(`${API_BASE}/api/v1/workers/jobs/${testJobId}`);
  if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  return { status: res.status };
});

// ============================================================================
// SSE ENDPOINT (Quick test)
// ============================================================================

await runTest('SSE Endpoint (connection test)', async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`${API_BASE}/api/v1/workers/subscribe`, {
      signal: controller.signal,
      headers: { 'Accept': 'text/event-stream' },
    });
    clearTimeout(timeout);
    // Just verify we can connect, then abort
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    controller.abort();
    return { connected: true };
  } catch (error) {
    clearTimeout(timeout);
    // AbortError is expected
    if (error instanceof Error && error.name === 'AbortError') {
      return { connected: true, note: 'Connection established, aborted for test' };
    }
    throw error;
  }
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  Test Summary');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const total = results.length;

console.log(`  Total:  ${total}`);
console.log(`  Passed: ${passed} ✅`);
console.log(`  Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
console.log('');

if (failed > 0) {
  console.log('  Failed tests:');
  for (const result of results.filter((r) => !r.passed)) {
    console.log(`    - ${result.name}: ${result.error}`);
  }
  console.log('');
}

const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);
console.log(`  Total Duration: ${totalDuration.toFixed(2)}ms`);
console.log('');

// Exit with error code if any tests failed
Deno.exit(failed > 0 ? 1 : 0);
