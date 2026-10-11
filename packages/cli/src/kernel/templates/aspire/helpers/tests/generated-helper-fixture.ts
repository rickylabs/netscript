/** @module Canonical generated modules for Aspire helper execution fixtures. */

import { assert } from '@std/assert';
import { dirname, join } from '@std/path';
import * as posix from '@std/path/posix';
import type { NetScriptConfig } from '@netscript/aspire/types';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { type GeneratedFile, generateHelpers } from '../helpers-generator-pipeline.ts';

/** Require every literal relative module import, except the restored SDK, to be emitted. */
export function assertHelperImportsEmitted(files: readonly GeneratedFile[]): void {
  const emitted = new Set(files.map((file) => file.path));
  for (const file of files) {
    // Generated static imports/re-exports and literal dynamic imports share these specifiers.
    const imports = file.content.matchAll(
      /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"](\.[^'"]+)['"]/g,
    );
    for (const match of imports) {
      const target = posix.normalize(posix.join(posix.dirname(file.path), match[1]));
      if (target.startsWith('.aspire/modules/')) continue;
      assert(emitted.has(target), `${file.path} imports ${target}, but no module was emitted`);
    }
  }
}

/** Write the generator's complete module set before a fixture replaces its SDK/compat seams. */
export async function writeGeneratedHelperFixture(
  root: string,
  config: NetScriptConfig,
): Promise<GeneratedFile[]> {
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  const files = await generateHelpers({ config });
  assertHelperImportsEmitted(files);
  for (const file of files) {
    const path = join(root, file.path);
    await Deno.mkdir(dirname(path), { recursive: true });
    await Deno.writeTextFile(path, file.content);
  }
  return files;
}
