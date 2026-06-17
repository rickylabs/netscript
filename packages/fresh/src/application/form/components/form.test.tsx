import { assert, assertEquals } from '@std/assert';
import { render as renderToString } from 'preact-render-to-string';
import { applyCollectionStrategy, createFormEnhancementSnapshot } from './enhancement.tsx';
import { Form } from './form.tsx';
import { resolveRuntimeFormState } from '../runtime/state.ts';
import { replyFor } from '../runtime/reply.ts';

Deno.test('Form renders framework-owned submission and csrf hidden inputs', () => {
  const runtime = resolveRuntimeFormState(
    replyFor<{ name?: string }>().initial({
      values: { name: 'Ada' },
      initialValues: { name: 'Ada' },
      submissionId: 'sub-1',
      csrfToken: 'csrf-1',
    }),
    {
      id: 'demo-form',
      action: '/dashboard/framework/forms',
    },
  );

  const html = renderToString(
    <Form state={runtime} class='demo-form'>
      <input type='text' name='name' defaultValue='Ada' />
    </Form>,
  );

  assert(html.includes('name="__submission_id__"'), `Expected submission id input in ${html}`);
  assert(html.includes('value="sub-1"'), `Expected submission id value in ${html}`);
  assert(html.includes('name="__csrf__"'), `Expected csrf input in ${html}`);
  assert(html.includes('value="csrf-1"'), `Expected csrf value in ${html}`);
  assert(html.includes('class="demo-form"'), `Expected forwarded class in ${html}`);
});

Deno.test('createFormEnhancementSnapshot strips runtime descriptors to a serializable shape', () => {
  const runtime = resolveRuntimeFormState(
    replyFor<{ name?: string }>().initial({
      values: { name: 'Ada' },
      initialValues: { name: 'Ada' },
      submissionId: 'sub-2',
      csrfToken: 'csrf-2',
    }),
    {
      id: 'snapshot-form',
      action: '/dashboard/framework/forms',
    },
  );

  const snapshot = createFormEnhancementSnapshot(runtime);

  assertEquals(snapshot.id, 'snapshot-form');
  assertEquals(snapshot.submissionId, 'sub-2');
  assertEquals(snapshot.values.name, 'Ada');
  assert(!('fields' in snapshot), 'Expected enhancement snapshot to stay serializable');
});

Deno.test('applyCollectionStrategy adds Fresh partial attrs for server-owned strategies', () => {
  const props = applyCollectionStrategy(
    {
      type: 'submit',
      name: '__intent__',
      value: '{"type":"collection:add"}',
      formNoValidate: true,
      'data-intent': 'collection:add',
    },
    {
      mode: 'server',
      partial: '/dashboard/framework/forms?mode=server',
    },
  );

  assertEquals(props['f-client-nav'], true);
  assertEquals(props['f-partial'], '/dashboard/framework/forms?mode=server');
});
