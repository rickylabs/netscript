# @netscript/fresh-ui

The NetScript design system for Fresh: a theme-driven `--ns-*` token vocabulary, a copy-source component registry, and a small package-owned runtime of accessible interactive primitives.

## Install

```sh
deno add jsr:@netscript/fresh-ui
```

The package runtime exposes stable helpers and accessible interactive primitives through three
subpath exports:

```ts
import { cn, getToast, stripToastFromUrl, withToast } from '@netscript/fresh-ui';
import { Dialog } from '@netscript/fresh-ui/interactive';
import { Show, VisuallyHidden } from '@netscript/fresh-ui/primitives';
```

Copy-source registry components and themes are installed with the NetScript CLI
(`netscript ui:init`, `netscript ui:add <item>`); once copied, that code is yours to own and evolve.

## Quick example

Merge classes, carry a redirect-flash toast across a redirect, and read it back:

```ts
import { cn, getToast, stripToastFromUrl, withToast } from '@netscript/fresh-ui';

const buttonClass = cn('ns-button', 'ns-button--primary');

const redirectTo = withToast('/dashboard/deployments', {
  type: 'success',
  title: 'Deployment queued',
  message: 'api-gateway will roll out to three regions.',
});

const url = new URL(`https://app.example${redirectTo}`);
const toast = getToast(url);
const cleanPath = stripToastFromUrl(url);
```

Interactive primitives (`Dialog`, `Drawer`, `Popover`, `Sheet`, `Tabs`, `Tooltip`, `Accordion`)
emit `data-part`, `data-state`, and ARIA attributes; styling comes from the copied registry CSS,
which targets those attributes and the semantic `--ns-*` vocabulary.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/fresh-ui/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
- [Fresh documentation](https://fresh.deno.dev/docs/)
