/**
 * Rendering tests for the site's Markdown extensions: fenced `tree` blocks, GitHub-style
 * `> [!TYPE]` alerts, and their Markdown twins. They need the site's import map (markdown-it,
 * the DOM parser and Vento), so the site task runs this file directly and root CI reaches it
 * through `markdown-render_test.ts`.
 */
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { markdownIt } from 'lume/deps/markdown_it.ts';
import { Page } from 'lume/core/file.ts';
import { autotrim, engine } from 'lume/deps/vento.ts';
import {
  CALLOUT_TYPES,
  type CalloutType,
  calloutType,
} from '../../../tools/docs-site/callout-types.ts';
import { articleToMarkdown } from './ai-tooling.ts';
import { ALERT_ATTRIBUTE, inlineCode, renderCallout } from './callout.ts';
import { fileTreeFence, renderFileTree } from './file-tree.ts';
import { markdownAlerts } from './markdown-alerts.ts';

const ORIGIN = new URL('https://docs.example.test/netscript/');
const PAGE = 'guide/page.md';

const TREE = `my-app/
├── AGENTS.md              # [guidance] added by \`agent init\`
├── apps/dashboard/
│   └── .generated/        # [generated] Fresh manifest and route types
├── database/postgres/
│   └── migrations/        # [generated history] review and commit
└── deno.json              # [owned config] workspace, imports, and tasks`;

function site(warnings: string[] = []) {
  const warn = (message: string) => warnings.push(message);
  const md = markdownIt({ html: true });
  md.disable('code');
  md.use(fileTreeFence, { warn });
  md.use(markdownAlerts, { warn });
  return { render: (source: string) => md.render(source, { filename: PAGE }) };
}

function article(html: string): Element {
  const document = Page.create({
    url: '/fixture.html',
    content: `<!doctype html><html><body><article class="ns-prose">${html}</article></body></html>`,
  }).document;
  const element = document?.querySelector('article.ns-prose');
  if (!element) throw new Error('Could not parse rendered fixture');
  return element;
}

function twin(html: string): string {
  return articleToMarkdown(article(html), ORIGIN);
}

/** Compare markup while ignoring formatting whitespace between tags. */
function normalize(html: string): string {
  return html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

/** Render a component through Vento with the filters `_config.ts` registers, as Lume does. */
async function renderComponent(name: string, data: Record<string, unknown>): Promise<string> {
  const env = engine({ dataVarname: 'it', autoescape: false, useWith: true });
  env.use(autotrim());
  env.filters.calloutType = calloutType;
  env.filters.calloutHtml = renderCallout;
  env.filters.ic = (value: unknown) => typeof value === 'string' ? inlineCode(value) : value ?? '';
  env.filters.fileTreeHtml = (nodes: unknown, nested?: boolean) =>
    renderFileTree(Array.isArray(nodes) ? nodes : [], { nested: Boolean(nested) });
  const source = await Deno.readTextFile(new URL(`../_components/${name}.vto`, import.meta.url));
  return (await env.runString(source, data)).content;
}

/* ------------------------------------------------------------------ */
/* Tree fences                                                         */
/* ------------------------------------------------------------------ */

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
  deepStrictEqual(
    [...article(html).querySelectorAll('.ns-file-tree__name')].map((name) => name.textContent),
    ['runtime', 'current'],
  );
});

Deno.test('an ASCII tree fence renders the same component as the Unicode one', () => {
  const ascii = TREE.replaceAll('├──', '|--').replaceAll('└──', '`--').replaceAll('│', '|');
  const fromAscii = article(site().render(`\`\`\`tree\n${ascii}\n\`\`\`\n`));
  const fromUnicode = article(site().render(`\`\`\`tree\n${TREE}\n\`\`\`\n`));
  for (const root of [fromAscii, fromUnicode]) {
    root.querySelector('.ns-file-tree--root')!.removeAttribute('data-tree-source');
  }
  strictEqual(fromAscii.innerHTML, fromUnicode.innerHTML);
});

Deno.test('the Markdown twin keeps a tree fence as its ASCII text', () => {
  const markdown = twin(site().render(`Intro.\n\n\`\`\`tree\n${TREE}\n\`\`\`\n`));
  strictEqual(markdown, `Intro.\n\n\`\`\`text\n${TREE}\n\`\`\`\n`);
});

Deno.test('an empty or malformed tree fence warns and renders as plain text', () => {
  const malformed = 'my-app/\n├── a.ts\n    stray continuation';
  const cases: Array<[string, string, string]> = [
    ['', `${PAGE}:3:`, 'no entries'],
    [malformed, `${PAGE}:6:`, 'indented but has no branch'],
  ];
  for (const [body, where, reason] of cases) {
    const warnings: string[] = [];
    const source = `# Page\n\n\`\`\`tree\n${body}${body ? '\n' : ''}\`\`\`\n\nAfter.\n`;
    const html = site(warnings).render(source);
    const root = article(html);
    ok(!root.querySelector('.ns-file-tree'), html);
    strictEqual(root.querySelector('pre code.language-text')?.textContent, body ? `${body}\n` : '');
    strictEqual(root.querySelector('p')?.textContent, 'After.', 'the page keeps rendering');
    strictEqual(warnings.length, 1, JSON.stringify(warnings));
    ok(warnings[0].startsWith(where), warnings[0]);
    ok(warnings[0].includes(reason), warnings[0]);
    if (body) ok(twin(html).includes(`\`\`\`text\n${body}\n\`\`\``), twin(html));
  }
});

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

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
    const warnings: string[] = [];
    const html = site(warnings).render(`> [!${marker}]\n> Read \`deno.json\` first.\n`);
    const root = article(html);
    const callout = root.querySelector('aside.ns-callout');
    const definition = CALLOUT_TYPES[kind];
    ok(callout, `${marker}: ${html}`);
    ok(!root.querySelector('blockquote'), marker);
    strictEqual(warnings.length, 0, marker);
    deepStrictEqual(
      {
        variant: callout.getAttribute('data-variant'),
        tone: callout.getAttribute('data-tone'),
        role: callout.getAttribute('role'),
        name: callout.getAttribute('aria-label'),
        icon: callout.querySelector('.ns-callout__icon svg')?.getAttribute('data-icon'),
        label: callout.querySelector('.ns-callout__label')?.textContent,
        body: callout.querySelector('.ns-callout__body')?.innerHTML.trim(),
        alert: callout.getAttribute(ALERT_ATTRIBUTE),
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

Deno.test('an alert and comp.callout produce byte-identical markup for the same inputs', async () => {
  const content = '<p>Body text.</p>\n';
  for (const [marker, kind] of ALERTS) {
    for (const title of [undefined, 'Before you migrate']) {
      const head = title ? `> [!${marker}]\n> **${title}**\n>\n` : `> [!${marker}]\n`;
      const alert = site().render(`${head}> Body text.\n`)
        .replace(` ${ALERT_ATTRIBUTE}="${marker}"`, '');
      const component = await renderComponent('callout', { type: kind, title, content });
      const shared = renderCallout(content, kind, title);
      strictEqual(alert, `${shared}\n`, `alert ${marker} ${title}`);
      strictEqual(component, `\n\n${shared}\n`, `component ${marker} ${title}`);
    }
  }
});

Deno.test('a bold first paragraph becomes the title, in either GitHub-compatible form', () => {
  const forms = [
    '> [!warning]\n> **Before you migrate**\n>\n> First paragraph.\n>\n> - one\n> - two\n',
    '> [!warning]\n>\n> __Before you migrate__\n>\n> First paragraph.\n>\n> - one\n> - two\n',
  ];
  for (const source of forms) {
    const callout = article(site().render(source)).querySelector('aside.ns-callout')!;
    strictEqual(callout.getAttribute('data-variant'), 'warning');
    strictEqual(callout.querySelector('.ns-callout__label')?.textContent, 'Before you migrate');
    deepStrictEqual(
      [...callout.querySelectorAll('.ns-callout__body > p')].map((p) => p.textContent),
      ['First paragraph.'],
    );
    strictEqual(callout.querySelectorAll('.ns-callout__body li').length, 2);
  }
});

Deno.test('bold text is body, not title, when it is all the body or not the whole paragraph', () => {
  const cases = [
    ['> [!NOTE]\n> **Only bold**\n', '<p><strong>Only bold</strong></p>'],
    ['> [!NOTE]\n> **Bold** then text.\n>\n> More.\n', '<p><strong>Bold</strong> then text.</p>'],
  ];
  for (const [source, firstBody] of cases) {
    const callout = article(site().render(source)).querySelector('aside.ns-callout')!;
    strictEqual(callout.querySelector('.ns-callout__label')?.textContent, 'Note');
    strictEqual(callout.querySelector('.ns-callout__body > p')?.outerHTML, firstBody);
  }
});

Deno.test('quotes GitHub does not render as alerts stay plain blockquotes and warn', () => {
  const cases: Array<[string, string]> = [
    ['> [!NOTE] Read this first.\n', 'alone on the first line'],
    ['> [!NOTE]\n', 'no body'],
    ['> A quotation.\n>\n> > [!NOTE]\n> > Nested.\n', 'cannot be nested'],
    ['- item\n\n  > [!TIP]\n  > In a list.\n', 'cannot be nested'],
    ['> [!NOTES]\n> Not a supported type.\n', 'not a supported alert type'],
  ];
  for (const [source, reason] of cases) {
    const warnings: string[] = [];
    const html = site(warnings).render(source);
    const root = article(html);
    ok(!root.querySelector('aside'), `${source}\n${html}`);
    ok(root.querySelector('blockquote')?.textContent?.includes('[!'), html);
    strictEqual(warnings.length, 1, `${source}: ${JSON.stringify(warnings)}`);
    ok(warnings[0].startsWith(`${PAGE}:`), warnings[0]);
    ok(warnings[0].includes(reason), warnings[0]);
  }
});

Deno.test('alerts inside HTML containers stay plain and warn until the container closes', () => {
  for (
    const container of [
      '<details>\n<summary>More</summary>',
      '<div>',
      '<section>\n<div data-label="a > b">',
      '<custom-panel>',
      '<div>\n<script>const markup = "</div>";</script>',
    ]
  ) {
    const closing = container.startsWith('<details>')
      ? '</details>'
      : container.startsWith('<section>')
      ? '</div>\n</section>'
      : container.startsWith('<custom')
      ? '</custom-panel>'
      : '</div>';
    const warnings: string[] = [];
    const html = site(warnings).render(
      `${container}\n\n> [!NOTE]\n> Inside.\n\n${closing}\n\n> [!TIP]\n> Outside.\n`,
    );
    const root = article(html);
    ok(root.querySelector('blockquote')?.textContent?.includes('[!NOTE]'), html);
    strictEqual(root.querySelectorAll('aside').length, 1, html);
    strictEqual(root.querySelector('aside')?.getAttribute('data-alert'), 'TIP');
    strictEqual(warnings.length, 1);
    ok(warnings[0].startsWith(`${PAGE}:`), warnings[0]);
    ok(warnings[0].includes('cannot be nested'), warnings[0]);
  }
});

Deno.test('void tags, closed tags and HTML comments do not contain later alerts', () => {
  for (const html of ['<hr>', '<div>Closed</div>', '<!-- <details> -->']) {
    const warnings: string[] = [];
    const output = site(warnings).render(`${html}\n\n> [!NOTE]\n> Body.\n`);
    ok(article(output).querySelector('aside'), output);
    strictEqual(warnings.length, 0);
  }
});

Deno.test('escaped strong delimiters and extra inline tokens stay in the body', () => {
  for (const gap of ['', '>\n']) {
    for (
      const [source, expected] of [
        ['**Not bold\\**', '<p>*<em>Not bold*</em></p>'],
        ['**Title***', '<p><strong>Title</strong>*</p>'],
        ['**Title *emphasis***', '<p><strong>Title <em>emphasis</em></strong></p>'],
        ['**Title `code`**', '<p><strong>Title <code>code</code></strong></p>'],
      ]
    ) {
      const html = site().render(`> [!NOTE]\n${gap}> ${source}\n>\n> Body.\n`);
      const callout = article(html).querySelector('aside')!;
      strictEqual(callout.querySelector('.ns-callout__label')?.textContent, 'Note');
      strictEqual(callout.querySelector('.ns-callout__body > p')?.outerHTML, expected);
    }
  }
});

Deno.test('a parsed text title is escaped without interpreting its text again', () => {
  const html = site().render('> [!NOTE]\n> **Use &lt;tag&gt; and \\*text\\***\n>\n> Body.\n');
  const label = article(html).querySelector('.ns-callout__label')!;
  strictEqual(label.textContent, 'Use <tag> and *text*');
  strictEqual(label.querySelectorAll('*').length, 0);
});

Deno.test('ordinary blockquotes are untouched and do not warn', () => {
  const warnings: string[] = [];
  const html = site(warnings).render('> A quotation with [a link](https://example.test).\n');
  ok(article(html).querySelector('blockquote > p > a'), html);
  strictEqual(warnings.length, 0);
});

Deno.test('the Markdown twin writes alerts back as authored', () => {
  const source = [
    '> [!NOTE]',
    '> Read `deno.json` first.',
    '',
    '> [!DANGER]',
    '> **Destroys `data`**',
    '>',
    '> Drops every table.',
    '>',
    '> - back up first',
  ].join('\n');
  strictEqual(twin(site().render(`${source}\n`)), `${source}\n`);
});
