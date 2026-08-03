import { assertEquals } from '@std/assert';
import { indexOpenApiOperations, resolveCanonicalOperation } from '../openapi-projection.ts';
import ambiguityFixture from './fixtures/openapi/identity-ambiguity.json' with { type: 'json' };

const index = indexOpenApiOperations(ambiguityFixture);

Deno.test('canonical identity resolves exact operation id before exact method path', () => {
  const byId = resolveCanonicalOperation(index, 'v1.health.updateStatus');
  assertEquals(byId.status, 'resolved');
  if (byId.status === 'resolved') {
    assertEquals(byId.matchedBy, 'operationId');
    assertEquals(byId.operation.methodPath, 'POST /health/status');
  }

  const byMethodPath = resolveCanonicalOperation(index, 'DELETE /anonymous');
  assertEquals(byMethodPath.status, 'resolved');
  if (byMethodPath.status === 'resolved') {
    assertEquals(byMethodPath.matchedBy, 'methodPath');
    assertEquals(byMethodPath.operation.canonicalId, 'DELETE /anonymous');
  }
});

Deno.test('canonical identity refuses a case-variant id and offers it only as a suggestion', () => {
  const result = resolveCanonicalOperation(index, 'V1.HEALTH.UPDATESTATUS');
  assertEquals(result.status, 'unknown');
  if (result.status === 'unknown') {
    assertEquals(result.suggestions.map((candidate) => candidate.operationId), [
      'v1.health.updateStatus',
    ]);
  }
});

Deno.test('canonical identity refuses an exact id shared by more than one operation', () => {
  const result = resolveCanonicalOperation(index, 'v1.health.list');
  assertEquals(result.status, 'ambiguous');
  if (result.status === 'ambiguous') {
    assertEquals(result.candidates.map((candidate) => candidate.methodPath), [
      'GET /health',
      'GET /health/archive',
    ]);
  }
});

Deno.test('substring matches remain non-executing suggestions', () => {
  const result = resolveCanonicalOperation(index, 'health');
  assertEquals(result.status, 'unknown');
  if (result.status === 'unknown') {
    assertEquals(result.suggestions.length, 3);
  }
});
