import { assertEquals } from '@std/assert';
import { classifyErrorType, getDefaultMessage, isRetryable } from './classify.ts';

Deno.test('classifyErrorType maps HTTP status families', () => {
  assertEquals(classifyErrorType(404), 'client');
  assertEquals(classifyErrorType(503), 'server');
  assertEquals(classifyErrorType(302), 'unknown');
});

Deno.test('isRetryable allows transient errors', () => {
  assertEquals(isRetryable(429, 'client'), true);
  assertEquals(isRetryable(408, 'client'), true);
  assertEquals(isRetryable(500, 'server'), true);
  assertEquals(isRetryable(400, 'client'), false);
});

Deno.test('getDefaultMessage returns status-specific messages', () => {
  assertEquals(getDefaultMessage(404), 'Resource not found');
  assertEquals(getDefaultMessage(599), 'Server error');
});
