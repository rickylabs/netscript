import { assertEquals } from '@std/assert';
import { normalizeFormError, UNKNOWN_FORM_ERROR_MESSAGE } from './error-normalization.ts';

interface DemoValues {
  email: string;
  name: string;
}

Deno.test('normalizeFormError returns invalid results for schema validation errors', () => {
  const result = normalizeFormError<DemoValues>(
    {
      flatten() {
        return {
          fieldErrors: {
            email: ['Email is required'],
          },
          formErrors: ['Fix the highlighted fields'],
        };
      },
    },
    {
      email: '',
      name: '',
    },
    'submission-1',
    {
      csrfToken: 'csrf-1',
    },
  );

  assertEquals(result.status, 'invalid');
  assertEquals(result.fieldErrors.email, ['Email is required']);
  assertEquals(result.formErrors, ['Fix the highlighted fields']);
  assertEquals(result.submissionId, 'submission-1');
  assertEquals(result.csrfToken, 'csrf-1');
});

Deno.test('normalizeFormError returns error results for Error instances', () => {
  const result = normalizeFormError<DemoValues>(
    new Error('Request failed'),
    {
      email: 'ada@example.com',
      name: 'Ada',
    },
    'submission-2',
  );

  assertEquals(result.status, 'error');
  assertEquals(result.formErrors, ['Request failed']);
});

Deno.test('normalizeFormError returns a safe fallback for unknown thrown values', () => {
  const result = normalizeFormError<DemoValues>(
    { reason: 'mystery' },
    {
      email: 'ada@example.com',
      name: 'Ada',
    },
    'submission-3',
  );

  assertEquals(result.status, 'error');
  assertEquals(result.formErrors, [UNKNOWN_FORM_ERROR_MESSAGE]);
});
