import { Fragment, h } from 'npm:preact@^10.29.2';
globalThis.React = { createElement: h, Fragment };
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { toFileUrl } from 'jsr:@std/path@^1';
const root = Deno.args[0], output = Deno.args[1];
const cases = [];
async function component(file, symbol) {
  const m = await import(
    toFileUrl(`${root}/registry/components/ui/${file}.tsx`).href
  );
  return m[symbol];
}
const add = (name, C, props, children) => cases.push({ name, html: render(h(C, props, children)) });
const Button = await component('button', 'Button');
for (
  const variant of ['primary', 'secondary', 'outline', 'ghost', 'destructive']
) {
  for (const size of ['sm', 'md', 'lg', 'icon']) {
    for (const state of ['rest', 'disabled', 'loading']) {
      add(`button/${variant}/${size}/${state}`, Button, {
        variant,
        size,
        disabled: state === 'disabled',
        loading: state === 'loading',
        icon: '★',
      }, 'Action');
    }
  }
}
for (
  const variant of ['primary', 'secondary', 'outline', 'ghost', 'destructive']
) {
  add(`button/link/${variant}`, Button, {
    variant,
    type: 'link',
    href: '/example',
  }, 'Navigate');
}
const IconButton = await component('icon-button', 'IconButton');
add('icon-button', IconButton, { icon: '★', label: 'Action' });
const Badge = await component('badge', 'Badge');
for (
  const variant of [
    'primary',
    'secondary',
    'success',
    'warning',
    'destructive',
    'muted',
  ]
) add('badge/' + variant, Badge, { variant }, 'Status');
const Avatar = await component('avatar', 'Avatar');
for (const size of ['sm', 'md', 'lg']) {
  for (const agent of [false, true]) {
    add(`avatar/${size}/${agent}`, Avatar, {
      name: 'Ada Lovelace',
      size,
      agent,
      presence: 'online',
    });
  }
}
for (
  const [file, symbol, props] of [
    ['input', 'Input', {}],
    ['textarea', 'Textarea', {}],
    ['select', 'Select', { options: [{ value: 'one', label: 'One' }] }],
    ['checkbox', 'Checkbox', {}],
    ['switch', 'Switch', {}],
  ]
) {
  const C = await component(file, symbol);
  for (const error of [false, true]) {
    for (const disabled of [false, true]) {
      add(`${file}/${error}/${disabled}`, C, {
        ...props,
        error,
        disabled,
        description: 'Description',
      }, ['checkbox', 'switch'].includes(file) ? 'Choice' : undefined);
    }
  }
}
const Label = await component('label', 'Label');
for (const required of [false, true]) {
  for (const srOnly of [false, true]) {
    add(`label/${required}/${srOnly}`, Label, { required, srOnly }, 'Name');
  }
}
const Progress = await component('progress', 'Progress');
for (
  const variant of ['primary', 'secondary', 'success', 'warning', 'destructive']
) {
  for (const size of ['sm', 'md', 'lg']) {
    for (const indeterminate of [false, true]) {
      add(`progress/${variant}/${size}/${indeterminate}`, Progress, {
        variant,
        size,
        indeterminate,
        value: 42,
      });
    }
  }
}
const Spinner = await component('spinner', 'Spinner');
for (const size of ['sm', 'md', 'lg']) {
  for (const label of [undefined, 'Loading']) {
    add(`spinner/${size}/${label}`, Spinner, { size, label });
  }
}
const Panel = await component('panel', 'Panel');
for (const tone of ['default', 'muted', 'raised']) {
  add('panel/' + tone, Panel, { tone }, h(Panel.Body, {}, 'Panel content'));
}
const Card = await component('card', 'Card');
for (const interactive of [false, true]) {
  add('card/' + interactive, Card, { interactive }, [
    h(Card.Header, {}, h(Card.Title, {}, 'Title')),
    h(Card.Body, {}, 'Body'),
    h(Card.Footer, {}, 'Footer'),
  ]);
}
const Skeleton = await component('skeleton', 'Skeleton');
for (const variant of ['table', 'stats', 'detail', 'form']) {
  add('skeleton/' + variant, Skeleton, {
    variant,
    rows: 1,
    cards: 1,
    columns: 2,
  });
}
for (
  const [file, symbol] of [['alert', 'Alert'], [
    'inline-notice',
    'InlineNotice',
  ]]
) {
  const C = await component(file, symbol);
  for (const variant of ['info', 'success', 'warning', 'destructive']) {
    add(file + '/' + variant, C, { variant, title: 'Notice' }, 'Description');
  }
}
const Separator = await component('separator', 'Separator');
for (const orientation of ['horizontal', 'vertical']) {
  add('separator/' + orientation, Separator, { orientation });
}
const Citation = await component('citation-chip', 'CitationChip');
for (const active of [false, true]) {
  add('citation/' + active, Citation, { index: 1, source: 'Source', active });
}
const Model = await component('model-selector', 'ModelSelector');
add('model-selector', Model, {
  value: 'first',
  open: true,
  models: [{ id: 'first', label: 'First', desc: 'Description' }, {
    id: 'second',
    label: 'Second',
  }],
});
const ResponsiveTable = await component('responsive-table', 'ResponsiveTable');
for (const empty of [false, true]) {
  add('table/' + empty, ResponsiveTable, {
    columns: [{ key: 'name', label: 'Name', cell: (r) => r.name }],
    rows: empty ? [] : [{ name: 'Ada' }],
    getRowKey: () => 1,
    caption: 'Caption',
  });
}
const Grid = (await import(toFileUrl(`${root}/src/presentation/data-grid.tsx`).href))
  .DataGrid;
add('data-grid', Grid, {
  columns: [{ key: 'name', header: 'Name', cell: 'strong' }, {
    key: 'amount',
    header: 'Amount',
    cell: 'num',
  }],
  rows: [{
    id: 'one',
    data: { name: 'Ada', amount: 42 },
    href: '/one',
    selected: true,
  }, { id: 'two', data: { name: 'Grace', amount: 84 }, onSelect: () => {} }],
});
const Window = await component('desktop-window-chrome', 'DesktopWindowChrome');
add('window-chrome', Window, { title: 'Workspace' });
const Message = await component('message', 'Message');
for (const role of ['user', 'assistant', 'system']) {
  add('message/' + role, Message, {
    message: { role, author: { name: 'Ada' }, body: 'Hello world' },
  });
}
const Toast = (await import(toFileUrl(`${root}/registry/islands/Toast.tsx`).href)).default;
for (const type of ['success', 'error', 'warning', 'info']) {
  add('toast/' + type, Toast, { type, title: 'Notice', message: 'Message' });
}

const Field = await component('form-field', 'FormField');
const Input = await component('input', 'Input');
for (const invalid of [false, true]) {
  add('field/' + invalid, Field, {
    name: 'name',
    label: 'Name',
    required: true,
    helpText: 'Help',
    error: invalid ? 'Required' : undefined,
  }, h(Input, { error: invalid }));
}
const Code = await component('code-block', 'CodeBlock');
add('code-block', Code, { code: 'const value = 42;', filename: 'example.ts', lang: 'ts' });
const Shell = await component('sidebar-shell', 'SidebarShell');
add('app-shell', Shell, {
  pathname: '/',
  navigation: [{
    label: 'Pages',
    items: [{ href: '/', label: 'Home' }, { href: '/other', label: 'Other' }],
  }],
  brand: 'Workspace',
  topbarStart: 'Top bar',
}, 'Content');
for (const [file, name] of [['SidebarToggle', 'sidebar-toggle'], ['ThemeToggle', 'theme-toggle']]) {
  const C = (await import(toFileUrl(`${root}/registry/islands/${file}.tsx`).href)).default;
  add(name, C, {});
}
for (const [file, name] of [['checkbox', 'Checkbox'], ['switch', 'Switch']]) {
  const C = await component(file, name);
  for (const error of [false, true]) {
    for (const disabled of [false, true]) {
      add(`${file}/checked/${error}/${disabled}`, C, { error, disabled, checked: true }, 'Checked');
    }
  }
}

await Deno.writeTextFile(output, JSON.stringify(cases));
console.log(cases.length + ' render cases');
