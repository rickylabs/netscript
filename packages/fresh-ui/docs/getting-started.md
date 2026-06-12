# Getting Started

This guide covers the supported first install path for `@netscript/fresh-ui`: initialize the
copy-source registry in a Fresh app, add the runtime package imports, and render one package-owned
interactive component.

## 1. Initialize the registry

Use the NetScript CLI from the consuming app root:

```sh
netscript ui:init --project-root .
netscript ui:add button --project-root .
netscript ui:add forms-core --project-root .
netscript ui:add dashboard-blocks --project-root .
```

`ui:init` installs the NS One theme seed and creates the app-owned styles aggregator. `ui:add`
copies registry source files into the app, resolves registry dependencies, rewrites relative import
depths, and merges required `deno.json` imports.

After copying, the files belong to the app. Keep them content-identical to the registry copy while
you want CLI reconciliation; treat edited copies as app-owned L4 code.

## 2. Add the runtime package import

Registry files are copied. Interactive runtime modules are imported from the package:

```jsonc
{
  "imports": {
    "@netscript/fresh-ui": "jsr:@netscript/fresh-ui@^0.1",
    "@netscript/fresh-ui/interactive": "jsr:@netscript/fresh-ui@^0.1/interactive",
    "@netscript/fresh-ui/primitives": "jsr:@netscript/fresh-ui@^0.1/primitives"
  }
}
```

## 3. Use helpers and runtime components

The doctest fixture in `tests/_fixtures/docs-examples_test.ts` executes this flow against the local
package entrypoints so README and getting-started examples stay honest.

```tsx
import { cn, getToast, stripToastFromUrl, withToast } from '@netscript/fresh-ui';
import { Dialog } from '@netscript/fresh-ui/interactive';
import { Show, VisuallyHidden } from '@netscript/fresh-ui/primitives';

const deployButtonClass = cn('ns-button', 'ns-button--primary');

const redirectTo = withToast('/dashboard/deployments', {
  type: 'success',
  title: 'Deployment queued',
  message: 'api-gateway will roll out to three regions.',
});

const toast = getToast(new URL(`https://app.example${redirectTo}`));
const cleanPath = stripToastFromUrl(new URL(`https://app.example${redirectTo}`));

export function ConfirmDeployDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger class={deployButtonClass}>Deploy</Dialog.Trigger>
      <Dialog.Content aria-label='Confirm deployment'>
        <Dialog.Title>Deploy api-gateway?</Dialog.Title>
        <Dialog.Description>
          {toast?.message ?? 'The deployment will use the selected region plan.'}
        </Dialog.Description>
        <Show when={cleanPath === '/dashboard/deployments'}>
          <VisuallyHidden>Redirect path is clean</VisuallyHidden>
        </Show>
        <Dialog.Close>Cancel</Dialog.Close>
        <button type='submit'>Confirm</button>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

Runtime components emit ARIA and `data-*` attributes. The copied registry CSS and the active theme
own visual styling.

## 4. Validate in the app

For package development, run from `packages/fresh-ui`:

```sh
deno task check
deno task test
deno task tokens:check
```

For a consuming app, keep the living reference routes wired:

- `/design/tokens`
- `/design/components`
- `/design/composition`

See [`recipes/living-design-routes.md`](recipes/living-design-routes.md) for the route-level checks
used by the NetScript playground.
