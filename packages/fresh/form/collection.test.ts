import { assert, assertEquals } from '@std/assert';
import { z } from 'zod';
import {
  applyCollectionKeyOperation,
  applyIntentOperation,
  collectionIntent,
  INTENT_FIELD_NAME,
  parseFormIntent,
} from './intent.ts';
import { parseFormSubmission } from './pipeline.ts';
import { replyFor } from './reply.ts';
import { createZodAdapter } from './schema-adapter.ts';
import { resolveRuntimeFormState } from './state.ts';

Deno.test('applyIntentOperation supports nested collection paths', () => {
  const values = {
    sections: [
      {
        items: [{ id: 'a' }],
      },
    ],
  };

  const nextValues = applyIntentOperation(
    parseFormIntent({
      [INTENT_FIELD_NAME]: collectionIntent('add', 'sections[0].items', {
        defaultValue: { id: 'b' },
      }),
    }),
    values,
  );

  assertEquals(nextValues.sections[0]?.items, [{ id: 'a' }, { id: 'b' }]);
});

Deno.test('parseFormSubmission strips collection key fields and returns them separately', async () => {
  const adapter = createZodAdapter(
    z.object({
      items: z.array(
        z.object({
          id: z.string(),
          quantity: z.string(),
        }),
      ),
    }),
  );
  const formData = new FormData();
  formData.set('items[0].__key', 'row-a');
  formData.set('items[0].id', 'a');
  formData.set('items[0].quantity', '1');

  const parsed = await parseFormSubmission(formData, adapter);

  assertEquals(parsed.collectionKeys, { 'items[0]': 'row-a' });
  assertEquals(parsed.values, {
    items: [{ id: 'a', quantity: '1' }],
  });
});

Deno.test('applyCollectionKeyOperation mirrors collection reorder and duplicate behavior', () => {
  const intent = parseFormIntent({
    [INTENT_FIELD_NAME]: collectionIntent('reorder', 'sections[0].items', {
      from: 0,
      to: 1,
    }),
  });
  const reorderedKeys = applyCollectionKeyOperation(intent, {
    'sections[0].items[0]': 'row-a',
    'sections[0].items[1]': 'row-b',
  });

  assertEquals(reorderedKeys, {
    'sections[0].items[0]': 'row-b',
    'sections[0].items[1]': 'row-a',
  });

  const duplicateIntent = parseFormIntent({
    [INTENT_FIELD_NAME]: collectionIntent('duplicate', 'sections[0].items', { index: 1 }),
  });
  const duplicatedKeys = applyCollectionKeyOperation(duplicateIntent, reorderedKeys);

  assertEquals(duplicatedKeys['sections[0].items[0]'], 'row-b');
  assertEquals(duplicatedKeys['sections[0].items[1]'], 'row-a');
  assert(!!duplicatedKeys['sections[0].items[2]'], 'Expected duplicate rows to receive a fresh key');
  assert(
    duplicatedKeys['sections[0].items[2]'] !== duplicatedKeys['sections[0].items[1]'],
    'Expected duplicate rows to avoid reusing the source key',
  );
});

Deno.test('collection descriptors expose schema limits and stable item keys', () => {
  const schema = createZodAdapter(
    z.object({
      items: z.array(
        z.object({
          id: z.string().min(1),
          quantity: z.string().regex(/^[1-9][0-9]*$/),
        }),
      ).min(1).max(3),
    }),
  );
  const reply = replyFor<{
    items: Array<{ id: string; quantity: string }>;
  }>();

  const first = resolveRuntimeFormState(
    reply.initial({
      values: {
        items: [
          { id: 'a', quantity: '1' },
          { id: 'b', quantity: '2' },
        ],
      },
      initialValues: {
        items: [
          { id: 'a', quantity: '1' },
          { id: 'b', quantity: '2' },
        ],
      },
      submissionId: 'sub-1',
      csrfToken: 'csrf-1',
      collectionKeys: {
        'items[0]': 'row-a',
        'items[1]': 'row-b',
      },
    }),
    {
      id: 'order-form',
      action: '/dashboard/orders/new',
      defaultValues: schema.getDefaults(),
      constraints: schema.getConstraints(),
    },
  );

  const second = resolveRuntimeFormState(
    reply.initial({
      values: {
        items: [
          { id: 'b', quantity: '2' },
          { id: 'a', quantity: '1' },
        ],
      },
      initialValues: {
        items: [
          { id: 'b', quantity: '2' },
          { id: 'a', quantity: '1' },
        ],
      },
      submissionId: 'sub-2',
      csrfToken: 'csrf-2',
      collectionKeys: {
        'items[0]': 'row-b',
        'items[1]': 'row-a',
      },
    }),
    {
      id: 'order-form',
      action: '/dashboard/orders/new',
      defaultValues: schema.getDefaults(),
      constraints: schema.getConstraints(),
    },
  );

  assertEquals(first.fields.items.minItems, 1);
  assertEquals(first.fields.items.maxItems, 3);
  assertEquals(first.fields.items.list[0]?.keyInputProps.name, 'items[0].__key');
  assertEquals(first.fields.items.list[0]?.keyInputProps.value, 'row-a');

  const firstKeysById = Object.fromEntries(first.fields.items.list.map((item) => [
    item.fields.id.value,
    item.key,
  ]));
  const secondKeysById = Object.fromEntries(second.fields.items.list.map((item) => [
    item.fields.id.value,
    item.key,
  ]));

  assert(first.fields.items.list[0]?.key !== first.fields.items.list[1]?.key, 'Expected unique keys per collection row');
  assertEquals(secondKeysById.a, firstKeysById.a);
  assertEquals(secondKeysById.b, firstKeysById.b);
});
