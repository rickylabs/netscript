/**
 * Enforceable guard: no volatile constant (model id, tool version, endpoint)
 * is hardcoded anywhere under `.llm/tools/agentic/**` OUTSIDE the central
 * `config/` module. Every value below must be sourced from `config/`.
 *
 * Scope of the scan:
 *  - Includes all `*.ts` under the suite EXCEPT `config/**` (the single source),
 *    `*_test.ts` files (tests legitimately assert literal expected values), and
 *    `lib/__fixtures__/**` (recorded real-world artifacts).
 *
 * When you legitimately introduce a new volatile value, add it to `config/`
 * and reference it — do not silence this test.
 */

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

import {
  MODEL_IDS,
  NODE_TARGET_VERSION,
  OPENROUTER_ANTHROPIC_BASE_URL,
  OPENROUTER_MODEL_IDS,
  OPENROUTER_RESPONSES_BASE_URL,
} from './mod.ts';
import { ANTIGRAVITY_INSTALLER_URL, NODE_DIST_HOST } from './endpoints.ts';
import { COMPAT_PINNED_TOOL_VERSIONS, TEST_COMPONENT_VERSIONS } from './versions.ts';

const suiteRoot = new URL('../', import.meta.url);

/**
 * Literal values that must never appear as a bare string outside `config/`.
 * `MODEL_IDS.antigravity` (`agy`) is deliberately excluded: `agy` is also the
 * legitimate CLI executable name used across `wsl/` and the provider adapters,
 * so it is not a "hardcoded model id" when it appears as an executable path.
 */
const FORBIDDEN_LITERALS: readonly string[] = [
  MODEL_IDS.codexSol,
  MODEL_IDS.codexLuna,
  MODEL_IDS.fable,
  MODEL_IDS.opus,
  ...Object.values(OPENROUTER_MODEL_IDS),
  NODE_TARGET_VERSION,
  TEST_COMPONENT_VERSIONS.claude,
  ...Object.values(COMPAT_PINNED_TOOL_VERSIONS),
  OPENROUTER_ANTHROPIC_BASE_URL,
  OPENROUTER_RESPONSES_BASE_URL,
  ANTIGRAVITY_INSTALLER_URL,
  NODE_DIST_HOST,
];

async function collectSourceFiles(dir: URL): Promise<URL[]> {
  const files: URL[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const child = new URL(`${entry.name}${entry.isDirectory ? '/' : ''}`, dir);
    if (entry.isDirectory) {
      if (entry.name === 'config' || entry.name === '__fixtures__') continue;
      files.push(...await collectSourceFiles(child));
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    if (entry.name.endsWith('_test.ts')) continue;
    files.push(child);
  }
  return files;
}

Deno.test('no volatile constant is hardcoded outside the central config', async () => {
  const files = await collectSourceFiles(suiteRoot);
  assert(files.length > 20, `expected to scan the suite, found ${files.length} files`);
  const offenders: string[] = [];
  for (const file of files) {
    const source = await Deno.readTextFile(file);
    for (const literal of FORBIDDEN_LITERALS) {
      if (source.includes(literal)) {
        offenders.push(`${file.pathname} hardcodes "${literal}" (source it from config/)`);
      }
    }
  }
  assert(offenders.length === 0, `volatile constants leaked:\n${offenders.join('\n')}`);
});
