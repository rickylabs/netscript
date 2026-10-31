import { assert, assertEquals, assertThrows } from '@std/assert';
import { fromFileUrl, toFileUrl } from '@std/path';
import { freshUiRegistryManifest } from '../../registry.manifest.ts';
import { FRESH_UI_RUNTIME_DEPENDENCY } from './post-v1-items.ts';

interface DependencyItem {
  readonly name: string;
  readonly dependencies?: readonly string[];
}
interface ModuleInfo {
  readonly modules: readonly {
    readonly specifier: string;
    readonly dependencies?: readonly { readonly specifier: string }[];
  }[];
}

/** Compare direct compiler graph edges, never import-looking comments or string examples. */
async function importsRuntime(source: URL): Promise<boolean> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      'info',
      '--json',
      '--frozen',
      '--config',
      fromFileUrl(new URL('../../../../deno.json', import.meta.url)),
      source.href,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  const info: ModuleInfo = JSON.parse(new TextDecoder().decode(result.stdout));
  const module = info.modules.find((entry) => entry.specifier === source.href);
  assert(module, 'Source module must be present in its compiler graph');
  return (module.dependencies ?? []).some(({ specifier }) =>
    /^@netscript\/fresh-ui(?:\/|$)/.test(specifier)
  );
}

/** Runtime use and declaration must agree in both directions at the current package release. */
function assertRuntimeDependency(item: DependencyItem, usesRuntime: boolean): void {
  const declared = (item.dependencies ?? []).filter((dependency) =>
    /^(?:jsr:|npm:)?@netscript\/fresh-ui(?:@|\/|$)/.test(dependency)
  );
  assertEquals(
    declared,
    usesRuntime ? [FRESH_UI_RUNTIME_DEPENDENCY] : [],
    `${item.name}: runtime dependency closure`,
  );
}

Deno.test('every copied runtime import has exactly its matching package declaration', async () => {
  const users: DependencyItem[] = [];
  const sourceUses = new Map<string, Promise<boolean>>();
  for (const item of freshUiRegistryManifest.items) {
    let usesRuntime = false;
    for (const file of item.files) {
      if (!/\.tsx?$/.test(file.source)) continue;
      const source = new URL('../../' + file.source, import.meta.url);
      if (!sourceUses.has(source.href)) sourceUses.set(source.href, importsRuntime(source));
      if (await sourceUses.get(source.href)) usesRuntime = true;
    }
    assertRuntimeDependency(item, usesRuntime);
    if (usesRuntime) users.push(item);
  }
  assert(
    users.some((item) => item.name === 'command-palette'),
    'Legacy runtime user must be detected',
  );
  assert(users.some((item) => item.name === 'date-picker'), 'New runtime user must be detected');
  assertThrows(() => assertRuntimeDependency({ ...users[0], dependencies: [] }, true));
  assertThrows(() =>
    assertRuntimeDependency(
      { name: 'unneeded', dependencies: [FRESH_UI_RUNTIME_DEPENDENCY] },
      false,
    )
  );
});

Deno.test('compiler import detection ignores JSDoc, block/line comments and quoted examples', async () => {
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-import-comments-' });
  try {
    const source = toFileUrl(root + '/comments.ts');
    await Deno.writeTextFile(
      source,
      `/** import { Tabs } from '@netscript/fresh-ui/interactive'; */
/*
import { Dialog } from '@netscript/fresh-ui/interactive';
export { Icon } from '@netscript/fresh-ui/primitives';
const lazy = import('@netscript/fresh-ui/interactive');
*/
// import { Popover } from '@netscript/fresh-ui/interactive';
export const example = "import { Tabs } from '@netscript/fresh-ui/interactive';";
`,
    );
    assertEquals(await importsRuntime(source), false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
