import { assertEquals, assertRejects } from '@std/assert';
import {
  safeValidate,
  validateOrThrow,
  type ValidationSchema,
  withValidation,
} from '../validation/validation.ts';
import { QueueValidationError } from '../ports/errors.ts';

const stringSchema: ValidationSchema<string> = {
  parse(input: unknown): string {
    if (typeof input !== 'string') {
      throw new Error('Expected string');
    }
    return input;
  },
  safeParse(input: unknown) {
    if (typeof input !== 'string') {
      return {
        success: false as const,
        error: { message: 'Expected string' },
      };
    }

    return {
      success: true as const,
      data: input,
    };
  },
};

Deno.test('safeValidate returns parsed data on success', () => {
  assertEquals(safeValidate(stringSchema, 'hello'), {
    success: true,
    data: 'hello',
  });
});

Deno.test('safeValidate returns error message on failure', () => {
  assertEquals(safeValidate(stringSchema, 42), {
    success: false,
    error: 'Expected string',
  });
});

Deno.test('validateOrThrow wraps schema failures in QueueValidationError', () => {
  assertEquals(validateOrThrow(stringSchema, 'ok'), 'ok');

  try {
    validateOrThrow(stringSchema, 42, { queueName: 'jobs' });
  } catch (error) {
    assertEquals(error instanceof QueueValidationError, true);
    assertEquals((error as QueueValidationError).context?.queueName, 'jobs');
  }
});

Deno.test('withValidation validates before running the handler', async () => {
  let received = '';
  const handler = withValidation(stringSchema, (message) => {
    received = message;
    return Promise.resolve();
  });

  await handler('validated');
  assertEquals(received, 'validated');

  await assertRejects(
    () => handler(false),
    QueueValidationError,
    'Message validation failed',
  );
});
