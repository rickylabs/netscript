/**
 * Rendering tests for the site's Markdown extensions: fenced `tree` blocks, `> [!TYPE]`
 * alerts, and their Markdown twins. They need the site's import map (markdown-it, the DOM
 * parser and Vento), so the site task runs this file directly and root CI reaches it through
 * `markdown-render_test.ts`.
 */
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { markdownIt } from 'lume/deps/markdown_it.ts';
import { DOMParser } from 'lume/deps/dom.ts';
import { autotrim, engine } from 'lume/deps/vento.ts';
import {
  CALLOUT_ICONS,
  CALLOUT_TYPES,
  type CalloutType,
  calloutType,
} from '../../../tools/docs-site/callout-types.ts';
import { articleToMarkdown } from './ai-tooling.ts';
import { fileTreeFence, renderFileTree } from './file-tree.ts';
import { markdownAlerts } from './markdown-alerts.ts';

const ORIGIN = new URL('https://docs.example.test/netscript/');

const TREE = `my-app/
├── AGENTS.md              # [guidance] added by \`agent init\`
├── apps/dashboard/
│   └── .generated/        # [generated] Fresh manifest and route types
├── database/postgres/
│   └── migrations/        # [generated history] review and commit
└── deno.json              # [owned config] workspace, imports, and tasks`;

function site(warnings: string[] = []) {
  const md = markdownIt({ html: true });
  md.disable('code');
  md.use(fileTreeFence);
  md.use(markdownAlerts, { warn: (message: string) => warnings.push(message) });
  return md;
}

function article(html: string): Element {
  const document = new DOMParser().parseFromString(
    `<!doctype html><html><body><article class="ns-prose">${html}</article></body></html>`,
    'text/html',
  );
  const element = document?.querySelector('article.ns-prose');
  if (!element) throw new Error('Could not parse rendered fixture');
  return element as unknown as Element;
}

function twin(html: string): string {
  return articleToMarkdown(article(html), ORIGIN);
}

/** Compare markup while ignoring formatting whitespace between tags. */
function normalize(html: string): string {
  return html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

async function renderComponent(name: string, data: Record<string, unknown>): Promise<string> {
  const env = engine({ dataVarname: 'it', autoescape: false, useWith: true });
  env.use(autotrim());
  // The same filters `_config.ts` registers for these components.
  env.filters.calloutType = calloutType;
  env.filters.ic = (value: unknown) =>
    typeof value === 'string' ? value.replace(/`([^`]+)`/g, '<code>$1</code>') : (value ?? '');
  env.filters.fileTreeHtml = (nodes: unknown, nested?: boolean) =>
    renderFileTree(Array.isArray(nodes) ? nodes : [], { nested: Boolean(nested) });
  const source = await Deno.readTextFile(new URL(`../_components/${name}.vto`, import.meta.url));
  const result = await env.runString(source, {
    calloutTypes: CALLOUT_TYPES,
    calloutIcons: CALLOUT_ICONS,
    ...data,
  });
  return result.content;
}

Deno.test('a tree fence renders the fileTree component and leaves other fences alone', () => {
  const html = site().render(`\`\`\`tree\n${TREE}\n\`\`\`\n\n\`\`\`text\nplain\n\`\`\`\n`);
  const root = article(html);
  const tree = root.querySelector('ul.ns-file-tree.ns-file-tree--root');
  ok(tree, html);
  strictEqual(tree.getAttribute('aria-label'), 'Project files');
  strictEqual(tree.getAttribute('tabindex'), '0');
  strictEqual(tree.getAttribute('data-tree-source'), TREE);
  strictEqual(root.querySelectorAll('.ns-file-tree__item').length, 7);
  deepStrictEqual(
    [...root.querySelectorAll('[data-ownership]')].map((item) =>
      item.getAttribute('data-ownership')
    ),
    ['guidance', 'generated', 'generated history', 'owned config'],
  );
  strictEqual(root.querySelector('.ns-file-tree__comment code')?.textContent, 'agent init');
  ok(!root.querySelector('code.language-tree'), 'no tree code block reaches the highlighter');
  strictEqual(root.querySelector('pre code.language-text')?.textContent, 'plain\n');
});

Deno.test('a tree fence renders exactly what comp.fileTree renders for the same nodes', async () => {
  const fence = article(site().render(`\`\`\`tree\n${TREE}\n\`\`\`\n`));
  const tree = fence.querySelector('.ns-file-tree--root')!;
  tree.removeAttribute('data-tree-source');
  const component = await renderComponent('fileTree', {
    items: [{
      name: 'my-app/',
      children: [
        { name: 'AGENTS.md', ownership: 'guidance', comment: 'added by `agent init`' },
        {
          name: 'apps/dashboard/',
          children: [{
            name: '.generated/',
            ownership: 'generated',
            comment: 'Fresh manifest and route types',
          }],
        },
        {
          name: 'database/postgres/',
          children: [{
            name: 'migrations/',
            ownership: 'generated history',
            comment: 'review and commit',
          }],
        },
        { name: 'deno.json', ownership: 'owned config', comment: 'workspace, imports, and tasks' },
      ],
    }],
  });
  strictEqual(normalize(tree.outerHTML), normalize(article(component).innerHTML));
});

Deno.test('comp.fileTree still accepts a single root `tree` argument', async () => {
  const html = await renderComponent('fileTree', {
    tree: { name: 'runtime', children: [{ name: 'current', comment: 'version pointer' }] },
  });
  const root = article(html);
  deepStrictEqual(
    [...root.querySelectorAll('.ns-file-tree__name')].map((name) => name.textContent),
    ['runtime', 'current'],
  );
});

Deno.test('the Markdown twin keeps a tree fence as its ASCII text', () => {
  const markdown = twin(site().render(`Intro.\n\n\`\`\`tree\n${TREE}\n\`\`\`\n`));
  strictEqual(markdown, `Intro.\n\n\`\`\`text\n${TREE}\n\`\`\`\n`);
});

const ALERTS: ReadonlyArray<[string, CalloutType]> = [
  ['NOTE', 'note'],
  ['TIP', 'tip'],
  ['IMPORTANT', 'important'],
  ['WARNING', 'warning'],
  ['CAUTION', 'caution'],
  ['DANGER', 'danger'],
  ['ERROR', 'error'],
];

Deno.test('each alert type renders the callout markup', () => {
  for (const [marker, kind] of ALERTS) {
    const html = site().render(`> [!${marker}]\n> Read \`deno.json\` first.\n`);
    const root = article(html);
    const callout = root.querySelector('aside.ns-callout');
    const definition = CALLOUT_TYPES[kind];
    ok(callout, `${marker}: ${html}`);
    ok(!root.querySelector('blockquote'), marker);
    deepStrictEqual(
      {
        variant: callout.getAttribute('data-variant'),
        tone: callout.getAttribute('data-tone'),
        role: callout.getAttribute('role'),
        name: callout.getAttribute('aria-label'),
        icon: callout.querySelector('.ns-callout__icon svg')?.getAttribute('data-icon'),
        label: callout.querySelector('.ns-callout__label')?.textContent,
        body: callout.querySelector('.ns-callout__body')?.innerHTML.trim(),
        alert: callout.getAttribute('data-alert'),
      },
      {
        variant: kind,
        tone: definition.tone,
        role: 'note',
        name: definition.label,
        icon: definition.icon,
        label: definition.label,
        body: '<p>Read <code>deno.json</code> first.</p>',
        alert: marker,
      },
    );
  }
});

Deno.test('an alert renders the same markup as comp.callout', async () => {
  for (const [marker, kind] of ALERTS) {
    for (const title of [undefined, 'Use `deno task`']) {
      const head = title ? `> [!${marker}] ${title}` : `> [!${marker}]`;
      const html = site().render(`${head}\n> Body text.\n`);
      const fromAlert = article(html).querySelector('aside')!;
      fromAlert.removeAttribute('data-alert');
      const component = await renderComponent('callout', {
        type: kind,
        title,
        content: '<p>Body text.</p>',
      });
      strictEqual(
        normalize(fromAlert.outerHTML),
        normalize(article(component).innerHTML),
        `${marker} ${title}`,
      );
    }
  }
});

Deno.test('alerts take a title, lists and several paragraphs', () => {
  const root = article(
    site().render(
      '> [!warning] Before you migrate\n>\n> First paragraph.\n>\n> - one\n> - two\n',
    ),
  );
  const callout = root.querySelector('aside.ns-callout')!;
  strictEqual(callout.getAttribute('data-variant'), 'warning');
  strictEqual(callout.querySelector('.ns-callout__label')?.textContent, 'Before you migrate');
  strictEqual(callout.querySelectorAll('.ns-callout__body > p').length, 1);
  strictEqual(callout.querySelectorAll('.ns-callout__body li').length, 2);
});

Deno.test('an unknown alert type stays a plain blockquote and warns', () => {
  const warnings: string[] = [];
  const html = site(warnings).render('> [!NOTES]\n> Not a supported type.\n');
  const root = article(html);
  ok(!root.querySelector('aside'), html);
  ok(root.querySelector('blockquote')?.textContent?.includes('[!NOTES]'), html);
  strictEqual(warnings.length, 1);
  ok(warnings[0].includes('[!NOTES]'), warnings[0]);
});

Deno.test('ordinary blockquotes are untouched', () => {
  const warnings: string[] = [];
  const html = site(warnings).render('> A quotation.\n>\n> > [!NOTE]\n> > Nested.\n');
  const root = article(html);
  ok(root.querySelector('blockquote > p'), html);
  ok(root.querySelector('blockquote > aside.ns-callout'), 'a nested alert still renders');
  strictEqual(warnings.length, 0);
});

Deno.test('the Markdown twin writes alerts back as authored', () => {
  const source = [
    '> [!NOTE]',
    '> Read `deno.json` first.',
    '',
    '> [!DANGER] Destroys data',
    '> Drops every table.',
    '>',
    '> - back up first',
  ].join('\n');
  strictEqual(twin(site().render(`${source}\n`)), `${source}\n`);
});
