import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

// The owned webServer invokes this from its generated app before starting Vite.
const app = process.cwd();
const repository = fileURLToPath(new URL('../../', import.meta.url));
for (const item of ['message', 'markdown']) {
  const result = spawnSync('deno', [
    'run',
    '-A',
    '--frozen',
    'packages/cli/bin/netscript-dev.ts',
    'ui:add',
    item,
    '--force',
    '--project-root',
    app,
  ], { cwd: repository, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Cannot install browser fixture dependency ${item}`);
}
const config = JSON.parse(readFileSync(join(app, 'deno.json'), 'utf8')) as {
  imports: Record<string, string>;
};
if (config.imports['highlight.js'] !== 'npm:highlight.js@^11') {
  throw new Error('Message/CodeBlock and Markdown must share the highlight.js ^11 import mapping');
}
mkdirSync(join(app, 'browser-fixtures'), { recursive: true });
writeFileSync(
  join(app, 'browser-fixtures/test-code-block.ts'),
  readFileSync(new URL('./fixtures/code-block-rerender.ts.template', import.meta.url)),
);

const negative = process.env.FRESH_UI_CODE_NEGATIVE_CONTROL;
if (negative !== undefined && negative !== '1') {
  throw new Error('FRESH_UI_CODE_NEGATIVE_CONTROL must be 1 when set');
}
if (negative === '1') {
  // Mutate only the generated fixture copy; the unchanged call-count assertions must go red.
  const path = join(app, 'components/ui/code-block.tsx');
  const source = readFileSync(path, 'utf8');
  const withoutMemo = source.replace(
    /const highlighted = useMemo\(\s*\(\)\s*=>\s*([\s\S]*?),\s*\[code, lang\],\s*\);/,
    'const highlighted = $1;',
  );
  if (withoutMemo === source) throw new Error('No-memo negative control did not match CodeBlock');
  writeFileSync(path, withoutMemo);
}
