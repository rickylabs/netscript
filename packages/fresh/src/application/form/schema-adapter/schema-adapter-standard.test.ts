import { z } from 'zod';
import { createStandardSchemaAdapter } from './entry.ts';
import type { StandardSchemaIssue, StandardSchemaV1 } from './entry.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertDeepEquals(actual: unknown, expected: unknown, message?: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(message ?? `Expected ${expectedJson}, received ${actualJson}`);
  }
}

const contactStandardSchema: StandardSchemaV1<
  { email?: unknown; age?: unknown },
  { email: string; age: number }
> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate(input) {
      const values = input as { email?: unknown; age?: unknown };
      const issues: StandardSchemaIssue[] = [];
      const email = typeof values.email === 'string' ? values.email : '';

      if (!email.includes('@')) {
        issues.push({
          path: [{ key: 'email' }],
          message: 'Email is invalid',
        });
      }

      const age = Number(values.age);
      if (!Number.isFinite(age) || age < 18) {
        issues.push({
          path: ['age'],
          message: 'Age must be at least 18',
        });
      }

      if (values.email === 'blocked@example.com') {
        issues.push({
          message: 'This contact is blocked',
        });
      }

      if (issues.length > 0) {
        return { issues };
      }

      return {
        value: {
          email,
          age,
        },
      };
    },
  },
};

Deno.test('createStandardSchemaAdapter safeParse returns parsed output on success', async () => {
  const adapter = createStandardSchemaAdapter(contactStandardSchema);

  const result = await adapter.safeParse({
    email: 'ada@example.com',
    age: '36',
  });

  assertEquals(result.success, true, 'Expected parsing to succeed');

  if (!result.success) {
    throw new Error('Expected safeParse() to succeed');
  }

  assertDeepEquals(result.data, {
    email: 'ada@example.com',
    age: 36,
  });
  assertDeepEquals(adapter.getConstraints(), {});
  assertDeepEquals(adapter.getDefaults(), {});
});

Deno.test('createStandardSchemaAdapter safeParse normalizes field and form errors', async () => {
  const adapter = createStandardSchemaAdapter(contactStandardSchema);

  const result = await adapter.safeParse({
    email: 'blocked@example.com',
    age: '17',
  });

  assertEquals(result.success, false, 'Expected parsing to fail');

  if (result.success) {
    throw new Error('Expected safeParse() to fail');
  }

  assertDeepEquals(result.fieldErrors.age, ['Age must be at least 18']);
  assertDeepEquals(result.fieldErrors._form, ['This contact is blocked']);
  assertDeepEquals(result.formErrors, ['This contact is blocked']);
});

Deno.test('createStandardSchemaAdapter parse throws AggregateError on invalid input', async () => {
  const adapter = createStandardSchemaAdapter(contactStandardSchema);

  let thrown: unknown;
  try {
    await adapter.parse({
      email: 'invalid',
      age: '17',
    });
  } catch (error: unknown) {
    thrown = error;
  }

  assert(thrown instanceof AggregateError, 'Expected AggregateError on invalid input');
  assertEquals(thrown.message, 'Standard Schema validation failed');
  assertEquals(thrown.errors.length, 2);
});

Deno.test('createStandardSchemaAdapter accepts Zod Standard Schema metadata', async () => {
  const adapter = createStandardSchemaAdapter(
    z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Email is invalid'),
    }),
  );

  const result = await adapter.safeParse({
    name: '',
    email: 'invalid-email',
  });

  assertEquals(result.success, false, 'Expected parsing to fail');

  if (result.success) {
    throw new Error('Expected safeParse() to fail');
  }

  const fieldErrors = result.fieldErrors as Record<string, readonly string[] | undefined>;
  assertDeepEquals(fieldErrors.name, ['Name is required']);
  assertDeepEquals(fieldErrors.email, ['Email is invalid']);
});
