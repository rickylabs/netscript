import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert/strict';
import {
  parseAsciiTree,
  type ParsedFileTreeNode,
  renderFileTree,
  renderTreeFence,
} from './file-tree.ts';

/** Root CI and the site's own task both run this file, so it imports nothing bare. */

const QUICKSTART_SHAPE = `my-app/
├── AGENTS.md                  # [guidance] added by \`agent init\`
├── apps/dashboard/
│   ├── lib/                   # [owned] per-service data-layer modules
│   │   └── users.ts           # [owned] users client + query factories
│   └── .generated/            # [generated] Fresh manifest and route types
├── database/postgres/
│   └── migrations/            # [generated history] review and commit
├── plugins/                   # [CLI-managed] installed capability workspaces
└── deno.json                  # [owned config] workspace, imports, and tasks`;

Deno.test('parseAsciiTree nests entries by branch column', () => {
  const [root] = parseAsciiTree(QUICKSTART_SHAPE);
  strictEqual(root.name, 'my-app/');
  deepStrictEqual(root.children.map((node) => node.name), [
    'AGENTS.md',
    'apps/dashboard/',
    'database/postgres/',
    'plugins/',
    'deno.json',
  ]);
  const dashboard = root.children[1];
  deepStrictEqual(dashboard.children.map((node) => node.name), ['lib/', '.generated/']);
  deepStrictEqual(dashboard.children[0].children.map((node) => node.name), ['users.ts']);
  deepStrictEqual(root.children[2].children.map((node) => node.name), ['migrations/']);
});

Deno.test('parseAsciiTree detects folders from a trailing slash or children', () => {
  const tree = parseAsciiTree(`runtime
├── routes/
├── main.ts
└── schema
    └── schema.prisma`);
  const [root] = tree;
  strictEqual(root.folder, true, 'a parent without a slash is still a folder');
  deepStrictEqual(
    root.children.map(({ name, folder }) => [name, folder]),
    [['routes/', true], ['main.ts', false], ['schema', true]],
  );
  strictEqual(root.children[2].children[0].folder, false);
});

Deno.test('parseAsciiTree reads multi-word ownership tags and comments', () => {
  const [root] = parseAsciiTree(QUICKSTART_SHAPE);
  const byName = new Map(
    [root, ...root.children, ...root.children.flatMap((node) => node.children)]
      .map((node) => [node.name, node]),
  );
  deepStrictEqual(
    {
      ownership: byName.get('deno.json')?.ownership,
      comment: byName.get('deno.json')?.comment,
    },
    { ownership: 'owned config', comment: 'workspace, imports, and tasks' },
  );
  strictEqual(byName.get('migrations/')?.ownership, 'generated history');
  strictEqual(byName.get('migrations/')?.comment, 'review and commit');
  strictEqual(byName.get('plugins/')?.ownership, 'CLI-managed');
  strictEqual(byName.get('apps/dashboard/')?.ownership, undefined);
  strictEqual(byName.get('apps/dashboard/')?.comment, undefined);
});

Deno.test('comments keep code spans and render them as inline code', () => {
  const [root] = parseAsciiTree(QUICKSTART_SHAPE);
  const agents = root.children[0];
  deepStrictEqual(
    { ownership: agents.ownership, comment: agents.comment },
    { ownership: 'guidance', comment: 'added by `agent init`' },
  );
  const html = renderFileTree([agents]);
  ok(
    html.includes(
      '<span class="ns-file-tree__comment"> # added by <code>agent init</code></span>',
    ),
    html,
  );
  ok(html.includes('<span class="ns-file-tree__ownership"> [guidance]</span>'), html);
});

Deno.test('a tree without annotations parses names only', () => {
  const tree = parseAsciiTree(`services/users/
├── deno.json
└── src/
    ├── main.ts
    └── routers/
        └── v1.ts
`);
  deepStrictEqual(tree, [{
    name: 'services/users/',
    folder: true,
    children: [
      { name: 'deno.json', folder: false, children: [] },
      {
        name: 'src/',
        folder: true,
        children: [
          { name: 'main.ts', folder: false, children: [] },
          {
            name: 'routers/',
            folder: true,
            children: [{ name: 'v1.ts', folder: false, children: [] }],
          },
        ],
      },
    ],
  }]);
});

Deno.test('a plain comment and odd indentation widths still parse', () => {
  const tree = parseAsciiTree(`ai/
├─ ai.ts   # composition root: ai(), chatModel()
│
└─ routes/
   └─ chat.tsx # island (streams from /api/ai/chat-stream)`);
  const [root] = tree;
  deepStrictEqual(root.children.map((node) => node.name), ['ai.ts', 'routes/']);
  strictEqual(root.children[0].comment, 'composition root: ai(), chatModel()');
  strictEqual(root.children[0].ownership, undefined);
  strictEqual(root.children[1].children[0].name, 'chat.tsx');
});

Deno.test('an empty tree is rejected', () => {
  throws(() => parseAsciiTree('\n│\n'), /no entries/);
});

Deno.test('renderFileTree emits the component markup and escapes author text', () => {
  const html = renderFileTree([{
    name: 'app/',
    children: [{ name: '<Model>.ts', comment: 'a & b', ownership: 'owned' }],
  }]);
  ok(
    html.startsWith(
      '<ul class="ns-file-tree ns-file-tree--root" tabindex="0" aria-label="Project files">' +
        '<li class="ns-file-tree__item"><span class="ns-file-tree__row"><svg class="ns-file-tree__icon"',
    ),
    html,
  );
  ok(
    html.includes(
      '<ul class="ns-file-tree"><li class="ns-file-tree__item" data-ownership="owned">',
    ),
  );
  ok(html.includes('<span class="ns-file-tree__name">&lt;Model&gt;.ts</span>'));
  ok(html.includes('<span class="ns-file-tree__comment"> # a &amp; b</span>'));
  strictEqual(html.match(/tabindex/g)?.length, 1, 'only the root is a keyboard stop');
  strictEqual(html.match(/M3 6h7l2 3h9v11H3z/g)?.length, 1, 'one folder icon');
  strictEqual(html.match(/M14 2H5v20h14V7z/g)?.length, 1, 'one file icon');
});

Deno.test('renderTreeFence keeps the authored ASCII on the root for the twin', () => {
  const html = renderTreeFence(`${QUICKSTART_SHAPE}\n`);
  const source = html.match(/ data-tree-source="([^"]*)"/)?.[1];
  strictEqual(source, QUICKSTART_SHAPE);
  strictEqual(html.match(/data-tree-source/g)?.length, 1, 'nested lists carry no source');
});

Deno.test('every tree fence in the docs site parses one entry per line', async () => {
  const site = new URL('../', import.meta.url);
  let fences = 0;
  async function visit(directory: URL): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;
      const path = new URL(entry.name + (entry.isDirectory ? '/' : ''), directory);
      if (entry.isDirectory) await visit(path);
      else if (/\.(?:md|vto)$/.test(entry.name)) {
        const source = await Deno.readTextFile(path);
        for (const match of source.matchAll(/^```tree[ \t]*\n([\s\S]*?)^```[ \t]*$/gm)) {
          const lines = match[1].split('\n').filter((line) => !/^[\s│]*$/.test(line));
          const count = (nodes: readonly ParsedFileTreeNode[]): number =>
            nodes.reduce((total, node) => total + 1 + count(node.children), 0);
          strictEqual(count(parseAsciiTree(match[1])), lines.length, path.pathname);
          fences++;
        }
      }
    }
  }
  await visit(site);
  ok(fences >= 8, `expected the converted docs trees, found ${fences}`);
});
