import { assertEquals, assertNotStrictEquals } from '@std/assert';
import {
  applyIntentOperation,
  collectionIntent,
  INTENT_FIELD_NAME,
  parseFormIntent,
  submitIntent,
} from './intent.ts';

interface DemoItem {
  id: string;
}

interface DemoValues {
  items: DemoItem[];
}

Deno.test('parseFormIntent handles plain submit intents', () => {
  assertEquals(parseFormIntent({ [INTENT_FIELD_NAME]: submitIntent() }), {
    type: 'submit',
  });
});

Deno.test('parseFormIntent handles encoded collection intents', () => {
  assertEquals(
    parseFormIntent({
      [INTENT_FIELD_NAME]: collectionIntent('add', 'items', {
        defaultValue: { id: 'new' },
      }),
    }),
    {
      type: 'collection:add',
      payload: {
        name: 'items',
        defaultValue: { id: 'new' },
      },
    },
  );
});

Deno.test('applyIntentOperation adds collection items without mutating the source value', () => {
  const values: DemoValues = { items: [{ id: 'a' }] };
  const nextValues = applyIntentOperation(
    parseFormIntent({
      [INTENT_FIELD_NAME]: collectionIntent('add', 'items', {
        defaultValue: { id: 'b' },
      }),
    }),
    values,
  );

  assertNotStrictEquals(nextValues, values);
  assertEquals(values.items, [{ id: 'a' }]);
  assertEquals(nextValues.items, [{ id: 'a' }, { id: 'b' }]);
});

Deno.test('applyIntentOperation removes collection items', () => {
  const values: DemoValues = { items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
  const nextValues = applyIntentOperation(
    parseFormIntent({
      [INTENT_FIELD_NAME]: collectionIntent('remove', 'items', { index: 1 }),
    }),
    values,
  );

  assertEquals(nextValues.items, [{ id: 'a' }, { id: 'c' }]);
});

Deno.test('applyIntentOperation duplicates collection items', () => {
  const values: DemoValues = { items: [{ id: 'a' }, { id: 'b' }] };
  const nextValues = applyIntentOperation(
    parseFormIntent({
      [INTENT_FIELD_NAME]: collectionIntent('duplicate', 'items', { index: 0 }),
    }),
    values,
  );

  assertEquals(nextValues.items, [{ id: 'a' }, { id: 'a' }, { id: 'b' }]);
});

Deno.test('applyIntentOperation reorders collection items', () => {
  const values: DemoValues = { items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
  const nextValues = applyIntentOperation(
    parseFormIntent({
      [INTENT_FIELD_NAME]: collectionIntent('reorder', 'items', { from: 0, to: 2 }),
    }),
    values,
  );

  assertEquals(nextValues.items, [{ id: 'b' }, { id: 'c' }, { id: 'a' }]);
});
