import { assert, assertEquals } from '@std/assert';
import { z } from 'zod';
import { createZodAdapter } from './schema-adapter.ts';
import { replyFor } from './reply.ts';
import { resolveRuntimeFormState } from './state.ts';

Deno.test('resolveRuntimeFormState builds field descriptors with constraints and errors', () => {
  const schema = createZodAdapter(
    z.object({
      name: z.string().min(2),
      email: z.email(),
      role: z.enum(['user', 'admin']).default('user'),
    }),
  );
  const reply = replyFor<{ name?: string; email?: string; role?: string }>();

  const runtime = resolveRuntimeFormState(
    reply.invalid({
      values: { name: 'A', email: 'ada@example.com', role: 'user' },
      initialValues: { name: 'Ada', email: 'ada@example.com', role: 'user' },
      submissionId: 'sub-1',
      csrfToken: 'csrf-1',
      fieldErrors: {
        _form: [],
        name: ['Name must be at least 2 characters'],
      },
    }),
    {
      id: 'user-form',
      action: '/dashboard/users/new',
      defaultValues: schema.getDefaults(),
      constraints: schema.getConstraints(),
    },
  );

  assert(runtime.submitted, 'Expected POST round-trip state to be marked submitted');
  assert(runtime.hasErrors, 'Expected invalid form state to report errors');
  assertEquals(runtime.formProps.id, 'user-form');
  assertEquals(runtime.csrfInputProps.value, 'csrf-1');
  assertEquals(runtime.fields.name.error, 'Name must be at least 2 characters');
  assert(runtime.fields.name.invalid, 'Expected name field to be invalid');
  assert(runtime.fields.name.dirty, 'Expected changed field to be dirty');
  assertEquals(runtime.fields.name.labelProps.for, 'user-form-name');
  assertEquals(runtime.fields.name.errorProps.id, 'user-form-name-error');

  const controlProps = runtime.fields.name.controlProps({ type: 'text' });
  assertEquals(controlProps.form, 'user-form');
  assertEquals(controlProps.defaultValue, 'A');
  assertEquals(controlProps.minLength, 2);
  assertEquals(controlProps.required, true);
  assertEquals(controlProps['aria-invalid'], true);
  assertEquals(controlProps['aria-describedby'], 'user-form-name-error');
});

Deno.test('resolveRuntimeFormState builds nested field descriptors and success-state baselines', () => {
  const schema = createZodAdapter(
    z.object({
      profile: z.object({
        displayName: z.string().min(1),
      }),
    }),
  );
  const reply = replyFor<{ profile: { displayName: string } }, { ok: boolean }>();

  const runtime = resolveRuntimeFormState(
    reply.success({
      values: { profile: { displayName: 'Ada' } },
      initialValues: { profile: { displayName: 'Ada' } },
      submissionId: 'sub-2',
      csrfToken: 'csrf-2',
      output: { ok: true },
      nextValues: { profile: { displayName: 'Ada Lovelace' } },
    }),
    {
      id: 'profile-form',
      action: '/dashboard/users/profile',
      defaultValues: schema.getDefaults(),
      constraints: schema.getConstraints(),
    },
  );

  assertEquals(runtime.values.profile?.displayName, 'Ada Lovelace');
  assertEquals(runtime.initialValues.profile?.displayName, 'Ada Lovelace');
  assertEquals(runtime.fields.profile.displayName.name, 'profile.displayName');
  assertEquals(runtime.fields.profile.displayName.id, 'profile-form-profile-displayName');
  assertEquals(
    runtime.fields.profile.displayName.controlProps().defaultValue,
    'Ada Lovelace',
  );
  assert(
    !runtime.fields.profile.displayName.dirty,
    'Expected success nextValues to reset dirty state',
  );
});

Deno.test('resolveRuntimeFormState builds collection descriptors and intent button props', () => {
  const schema = createZodAdapter(
    z.object({
      items: z.array(
        z.object({
          label: z.string().min(1),
          quantity: z.string().regex(/^[1-9][0-9]*$/),
        }),
      ).min(1),
    }),
  );
  const reply = replyFor<{
    items: Array<{ label: string; quantity: string }>;
  }>();

  const runtime = resolveRuntimeFormState(
    reply.initial({
      values: {
        items: [{ label: 'Widget', quantity: '2' }],
      },
      initialValues: {
        items: [{ label: 'Widget', quantity: '1' }],
      },
      submissionId: 'sub-3',
      csrfToken: 'csrf-3',
    }),
    {
      id: 'collection-form',
      action: '/dashboard/framework/forms',
      defaultValues: schema.getDefaults(),
      constraints: schema.getConstraints(),
    },
  );

  assertEquals(runtime.fields.items.length, 1);
  assertEquals(runtime.fields.items.list[0]?.fields.label.name, 'items[0].label');
  assertEquals(
    runtime.fields.items.list[0]?.fields.quantity.controlProps({ type: 'number' }).defaultValue,
    '2',
  );
  assert(
    runtime.fields.items.list[0]?.fields.quantity.dirty,
    'Expected changed collection field to be dirty',
  );

  const addButton = runtime.fields.items.addButtonProps({
    defaultValue: { label: '', quantity: '1' },
  });
  assertEquals(addButton.type, 'submit');
  assertEquals(addButton.name, '__intent__');
  assertEquals(addButton['data-intent'], 'collection:add');
  assertEquals(addButton['data-collection-name'], 'items');

  const duplicateButton = runtime.fields.items.duplicateButtonProps(0);
  assertEquals(duplicateButton['data-intent'], 'collection:duplicate');
  assertEquals(duplicateButton['data-collection-index'], '0');
});

Deno.test('resolveRuntimeFormState marks object descriptors dirty when key sets differ', () => {
  const schema = createZodAdapter(
    z.object({
      profile: z.object({
        first: z.string().optional(),
        second: z.string().optional(),
      }).optional(),
    }),
  );
  const reply = replyFor<{
    profile?: { first?: string; second?: string };
  }>();

  const runtime = resolveRuntimeFormState(
    reply.initial({
      values: { profile: { first: undefined } },
      initialValues: { profile: { second: undefined } },
      submissionId: 'sub-4',
      csrfToken: 'csrf-4',
    }),
    {
      id: 'profile-form',
      action: '/dashboard/profile',
      defaultValues: schema.getDefaults(),
      constraints: schema.getConstraints(),
    },
  );

  assert(
    runtime.fields.profile.dirty,
    'Expected object descriptor dirty state to track key-set differences',
  );
  assert(
    'first' in runtime.fields.profile && 'second' in runtime.fields.profile,
    'Expected nested field descriptors to expose both optional field descriptors',
  );
  const profileFields = runtime.fields.profile as {
    first: { dirty: boolean };
    second: { dirty: boolean };
  };
  assert(
    !profileFields.first.dirty && !profileFields.second.dirty,
    'Expected leaf descriptors to stay clean when compared values are both undefined',
  );
});
