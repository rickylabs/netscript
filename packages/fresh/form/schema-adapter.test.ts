import { z } from 'zod';
import { createZodAdapter } from './schema-adapter.ts';
import type { FieldConstraints, FormIntent } from './types.ts';

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

async function assertRejects(
  fn: () => Promise<unknown>,
  expectedConstructor: new (...args: never[]) => Error,
  message?: string,
): Promise<void> {
  let thrown: unknown;

  try {
    await fn();
  } catch (error: unknown) {
    thrown = error;
  }

  if (!(thrown instanceof expectedConstructor)) {
    const actualName = thrown instanceof Error ? thrown.constructor.name : typeof thrown;
    throw new Error(
      message ?? `Expected rejection with ${expectedConstructor.name}, received ${actualName}`,
    );
  }
}

const demoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Name is too long'),
  email: z.string().email('Email is invalid'),
  role: z.enum(['admin', 'user']).default('user'),
  age: z.coerce.number().min(18, 'Must be at least 18').max(120, 'Age is unrealistic'),
  bio: z.string().min(10, 'Bio is too short').max(280, 'Bio is too long').optional(),
  website: z.url().optional(),
  receiveUpdates: z.enum(['yes', 'no']).default('no'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  })).default([]),
});

Deno.test('createZodAdapter safeParse returns parsed output on success', async () => {
  const adapter = createZodAdapter(demoSchema);

  const result = await adapter.safeParse({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'admin',
    age: '36',
    bio: 'Pioneer of analytical computing systems.',
    website: 'https://example.com',
    receiveUpdates: 'yes',
    items: [
      { productId: 'sku-1', quantity: '2' },
      { productId: 'sku-2', quantity: '3' },
    ],
  });

  assertEquals(result.success, true, 'Expected parsing to succeed');

  if (!result.success) {
    throw new Error('Expected safeParse() to succeed');
  }

  assertDeepEquals(result.data, {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'admin',
    age: 36,
    bio: 'Pioneer of analytical computing systems.',
    website: 'https://example.com',
    receiveUpdates: 'yes',
    items: [
      { productId: 'sku-1', quantity: 2 },
      { productId: 'sku-2', quantity: 3 },
    ],
  });
});

Deno.test('createZodAdapter safeParse validates through Standard Schema metadata', async () => {
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
  });
  schema.safeParseAsync = () => {
    throw new Error('safeParseAsync should not be called');
  };
  const adapter = createZodAdapter(schema);

  const result = await adapter.safeParse({ name: '' });

  assertEquals(result.success, false, 'Expected parsing to fail');

  if (result.success) {
    throw new Error('Expected safeParse() to fail');
  }

  assertDeepEquals(result.fieldErrors.name, ['Name is required']);
  assertDeepEquals(result.fieldErrors._form, []);
});

Deno.test('createZodAdapter safeParse returns flattened field and form errors on invalid input', async () => {
  const adapter = createZodAdapter(demoSchema);

  const result = await adapter.safeParse({
    name: '',
    email: 'invalid-email',
    role: 'admin',
    age: '17',
    bio: 'short',
    website: 'not-a-url',
    receiveUpdates: 'yes',
    items: [
      { productId: '', quantity: '0' },
    ],
  });

  assertEquals(result.success, false, 'Expected parsing to fail');

  if (result.success) {
    throw new Error('Expected safeParse() to fail');
  }

  assertEquals(result.formErrors.length, 0, 'Expected no form-level errors');
  assertDeepEquals(result.fieldErrors.name, ['Name is required']);
  assertDeepEquals(result.fieldErrors.email, ['Email is invalid']);
  assertDeepEquals(result.fieldErrors.age, ['Must be at least 18']);
  assertDeepEquals(result.fieldErrors.bio, ['Bio is too short']);
  assertDeepEquals(result.fieldErrors.website, ['Invalid URL']);
  assertDeepEquals(result.fieldErrors.items, [
    'Product is required',
    'Quantity must be at least 1',
  ]);
  assertDeepEquals(result.fieldErrors._form, []);
});

Deno.test('createZodAdapter parse returns parsed output on valid input', async () => {
  const adapter = createZodAdapter(demoSchema);

  const parsed = await adapter.parse({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    age: '42',
    receiveUpdates: 'no',
  });

  assertDeepEquals(parsed, {
    name: 'Grace Hopper',
    email: 'grace@example.com',
    role: 'user',
    age: 42,
    receiveUpdates: 'no',
    items: [],
  });
});

Deno.test('createZodAdapter parse validates through Standard Schema metadata', async () => {
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
  });
  schema.safeParseAsync = () => {
    throw new Error('safeParseAsync should not be called');
  };
  const adapter = createZodAdapter(schema);

  const parsed = await adapter.parse({ name: 'Ada' });

  assertDeepEquals(parsed, { name: 'Ada' });
});

Deno.test('createZodAdapter parse throws on invalid input', async () => {
  const adapter = createZodAdapter(demoSchema);

  await assertRejects(
    () =>
      adapter.parse({
        name: '',
        email: 'invalid-email',
        role: 'user',
        age: '12',
        receiveUpdates: 'yes',
      }),
    z.ZodError,
  );
});

Deno.test('createZodAdapter getDefaults returns schema defaults when available', () => {
  const adapter = createZodAdapter(
    z.object({
      role: z.enum(['admin', 'user']).default('user'),
      receiveUpdates: z.enum(['yes', 'no']).default('no'),
      nested: z.object({
        status: z.enum(['draft', 'published']).default('draft'),
      }).default({ status: 'draft' }),
    }),
  );

  const defaults = adapter.getDefaults();

  assertDeepEquals(defaults, {
    role: 'user',
    receiveUpdates: 'no',
    nested: {
      status: 'draft',
    },
  });
});

Deno.test('createZodAdapter getDefaults falls back to empty object when schema defaults are unavailable', () => {
  const adapter = createZodAdapter(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }),
  );

  const defaults = adapter.getDefaults();

  assertDeepEquals(defaults, {});
});

Deno.test('createZodAdapter getConstraints returns a conservative supported metadata subset', () => {
  const adapter = createZodAdapter(demoSchema);

  const constraints = adapter.getConstraints();

  const name = constraints.name as FieldConstraints | undefined;
  const bio = constraints.bio as FieldConstraints | undefined;
  const age = constraints.age as FieldConstraints | undefined;
  const website = constraints.website as FieldConstraints | undefined;
  const items = constraints.items as FieldConstraints | undefined;

  assertDeepEquals(name, {
    required: true,
    minLength: 1,
    maxLength: 80,
  });

  assertDeepEquals(bio, {
    required: false,
    minLength: 10,
    maxLength: 280,
  });

  assertDeepEquals(age, {
    required: true,
  });

  assertDeepEquals(website, {
    required: false,
  });

  assertDeepEquals(items, {
    required: false,
  });
});

Deno.test('createZodAdapter getConstraints preserves optional-field required semantics', () => {
  const adapter = createZodAdapter(
    z.object({
      avatar: z.url().optional(),
      nickname: z.string().min(2).max(20).optional(),
    }),
  );

  const constraints = adapter.getConstraints();

  const avatar = constraints.avatar as FieldConstraints | undefined;
  const nickname = constraints.nickname as FieldConstraints | undefined;

  assertDeepEquals(avatar, {
    required: false,
  });

  assertDeepEquals(nickname, {
    required: false,
    minLength: 2,
    maxLength: 20,
  });
});

Deno.test('createZodAdapter getConstraints exposes array collection bounds', () => {
  const adapter = createZodAdapter(
    z.object({
      items: z.array(z.object({ id: z.string().min(1) })).min(1).max(3),
    }),
  );

  const constraints = adapter.getConstraints();
  const items = constraints.items as FieldConstraints | undefined;

  assertDeepEquals(items, {
    required: true,
    minItems: 1,
    maxItems: 3,
  });
});

Deno.test('createZodAdapter is intent-agnostic and validates values independently of form intent', async () => {
  const adapter = createZodAdapter(demoSchema);
  const intent: FormIntent = {
    type: 'items:add',
    payload: { defaultValue: { productId: '', quantity: '1' } },
  };

  const result = await adapter.safeParse({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    role: 'user',
    age: '42',
    bio: 'Compiler pioneer and systems architect.',
    website: 'https://example.com',
    receiveUpdates: 'yes',
    items: [
      { productId: 'sku-1', quantity: '1' },
      intent.payload?.defaultValue,
    ],
  });

  assertEquals(intent.type, 'items:add');
  assertEquals(result.success, false, 'Expected validation to fail for incomplete collection item');

  if (result.success) {
    throw new Error('Expected validation to fail');
  }

  assertDeepEquals(result.fieldErrors.items, ['Product is required']);
});

Deno.test('createZodAdapter returns empty _form array when there are only field errors', async () => {
  const adapter = createZodAdapter(
    z.object({
      name: z.string().min(1, 'Name is required'),
    }),
  );

  const result = await adapter.safeParse({ name: '' });

  assertEquals(result.success, false);

  if (result.success) {
    throw new Error('Expected validation failure');
  }

  assertDeepEquals(result.fieldErrors._form, []);
  assertDeepEquals(result.formErrors, []);
});

Deno.test('createZodAdapter clones defaults defensively across calls', () => {
  const adapter = createZodAdapter(
    z.object({
      nested: z.object({
        status: z.enum(['draft', 'published']).default('draft'),
      }).default({ status: 'draft' }),
      items: z.array(z.object({
        productId: z.string().default('sku-1'),
      })).default([{ productId: 'sku-1' }]),
    }),
  );

  const first = adapter.getDefaults();
  const second = adapter.getDefaults();

  assert(first !== second, 'Expected defaults objects to be cloned per call');

  const firstRecord = first as {
    nested?: { status?: string };
    items?: Array<{ productId?: string }>;
  };

  if (!firstRecord.nested || !firstRecord.items) {
    throw new Error('Expected nested defaults to be present');
  }

  firstRecord.nested.status = 'published';
  firstRecord.items[0]!.productId = 'sku-99';

  assertDeepEquals(second, {
    nested: { status: 'draft' },
    items: [{ productId: 'sku-1' }],
  });
});

Deno.test('createZodAdapter getDefaults preserves tuple positions when later items define defaults', () => {
  const adapter = createZodAdapter(
    z.object({
      coordinates: z.tuple([
        z.string().optional(),
        z.string().default('lng'),
      ]),
    }),
  );

  const defaults = adapter.getDefaults() as {
    coordinates?: [string | undefined, string | undefined];
  };

  assert(Array.isArray(defaults.coordinates), 'Expected tuple defaults to resolve to an array');
  assertEquals(defaults.coordinates?.length, 2);
  assertEquals(defaults.coordinates?.[0], undefined);
  assertEquals(defaults.coordinates?.[1], 'lng');
});

Deno.test('createZodAdapter getDefaults respects explicit array defaults through wrapper schemas', () => {
  const adapter = createZodAdapter(
    z.object({
      items: z.array(
        z.object({
          productId: z.string().default('sku-1'),
        }),
      ).default([]).readonly(),
    }),
  );

  const defaults = adapter.getDefaults() as {
    items?: Array<{ productId?: string }>;
  };

  assert(Array.isArray(defaults.items), 'Expected array defaults to resolve to an array');
  assertEquals(defaults.items?.length, 0);
});
