import { assertEquals, assertRejects } from '@std/assert';
import { checkJsrPublishBudget } from './check-jsr-publish-budget.ts';

const response = (usage: number, limit: number): Response =>
  Response.json({
    quotas: { publishAttemptsPerWeekUsage: usage, publishAttemptsPerWeekLimit: limit },
  });

Deno.test('publish budget admits a full coordinated workspace before minting', async () => {
  const result = await checkJsrPublishBudget(
    'token',
    31,
    'netscript',
    () => Promise.resolve(response(900, 1000)),
  );
  assertEquals(result, { usage: 900, limit: 1000, remaining: 100, requiredAttempts: 31 });
});

Deno.test('publish budget fails clearly when remaining attempts cannot cover the workspace', async () => {
  await assertRejects(
    () =>
      checkJsrPublishBudget('token', 31, 'netscript', () => Promise.resolve(response(975, 1000))),
    Error,
    'Canary refused before version minting',
  );
});

Deno.test('publish budget fails closed on unauthenticated or malformed quota data', async () => {
  await assertRejects(() => checkJsrPublishBudget('', 31), Error, 'JSR_API_TOKEN is required');
  await assertRejects(
    () => checkJsrPublishBudget('token', 31, 'netscript', () => Promise.resolve(Response.json({}))),
    Error,
    'missing integer usage/limit',
  );
});
