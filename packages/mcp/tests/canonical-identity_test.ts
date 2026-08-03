import { assertEquals } from '@std/assert';
import { indexOpenApiOperations, resolveCanonicalOperation } from '../openapi-projection.ts';
import ambiguityFixture from './fixtures/openapi/identity-ambiguity.json' with { type: 'json' };

const index = indexOpenApiOperations(ambiguityFixture);

Deno.test('canonical identity resolves exact operation id before exact method path', () => {
  const byId = resolveCanonicalOperation(index, 'v1.health.check');
  assertEquals(byId.status, 'resolved');
  if (byId.status === 'resolved') {
    assertEquals(byId.matchedBy, 'operationId');
    assertEquals(byId.operation.methodPath, 'GET /health/check');
  }

  const byMethodPath = resolveCanonicalOperation(index, 'DELETE /anonymous');
  assertEquals(byMethodPath.status, 'resolved');
  if (byMethodPath.status === 'resolved') {
    assertEquals(byMethodPath.matchedBy, 'methodPath');
    assertEquals(byMethodPath.operation.canonicalId, 'DELETE /anonymous');
  }
});

Deno.test('canonical identity refuses case-variant ids as ambiguous candidates', () => {
  const result = resolveCanonicalOperation(index, 'v1.health.updateStatus');
  assertEquals(result.status, 'ambiguous');
  if (result.status === 'ambiguous') {
    assertEquals(result.candidates.map((candidate) => candidate.methodPath), [
      'POST /health/status',
      'PUT /health/status-alias',
    ]);
  }
});

Deno.test('a differently cased unique id remains a non-executing suggestion', () => {
  const result = resolveCanonicalOperation(index, 'V1.HEALTH.CHECK');
  assertEquals(result.status, 'unknown');
  if (result.status === 'unknown') {
    assertEquals(result.suggestions.map((candidate) => candidate.operationId), [
      'v1.health.check',
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
    assertEquals(result.suggestions.length, 5);
  }
});
