import { assert, assertEquals, assertExists } from '@std/assert';
import { h } from 'preact';
import type { ComponentChildren } from 'preact';
import { cn, getToast, Icon, stripToastFromUrl, withToast } from '../../mod.ts';
import { Dialog } from '../../interactive.ts';
import { Show, VisuallyHidden } from '../../primitives.tsx';

const deployButtonClass = cn('ns-button', 'ns-button--primary');

const redirectTo = withToast('/dashboard/deployments', {
  type: 'success',
  title: 'Deployment queued',
  message: 'api-gateway will roll out to three regions.',
});

const toast = getToast(new URL(`https://app.example${redirectTo}`));
const cleanPath = stripToastFromUrl(new URL(`https://app.example${redirectTo}`));
const checkIcon = h(Icon, { name: 'check', size: 18, title: 'Complete' });
const cleanPathStatus = Show({
  when: cleanPath === '/dashboard/deployments',
  children: VisuallyHidden({ children: 'Redirect path is clean' }),
}) as ComponentChildren;

function ConfirmDeployDialog() {
  return h(
    Dialog.Root,
    {
      children: [
        h(Dialog.Trigger, { class: deployButtonClass, children: 'Deploy' }),
        h(Dialog.Content, {
          'aria-label': 'Confirm deployment',
          children: [
            h(Dialog.Title, { children: 'Deploy api-gateway?' }),
            h(Dialog.Description, {
              children: toast?.message ?? 'The deployment will use the selected region plan.',
            }),
            cleanPathStatus,
            h(Dialog.Close, { children: 'Cancel' }),
            h('button', { type: 'submit' }, 'Confirm'),
          ],
        }),
      ],
    },
  );
}

Deno.test('README/getting-started helper flow stays executable', () => {
  assertEquals(deployButtonClass, 'ns-button ns-button--primary');
  assertExists(toast);
  assertEquals(toast.type, 'success');
  assertEquals(toast.title, 'Deployment queued');
  assertEquals(toast.message, 'api-gateway will roll out to three regions.');
  assertEquals(cleanPath, '/dashboard/deployments');
  assertEquals(checkIcon.type, Icon);
  assertEquals(checkIcon.props.name, 'check');
});

Deno.test('README/getting-started runtime component flow stays executable', () => {
  const element = ConfirmDeployDialog();

  assert(element && typeof element === 'object' && 'type' in element);
  assert(element.type === Dialog.Root);
});
