/**
 * Enforceable guard: no volatile constant (model id, tool version, endpoint) is
 * hardcoded in the suite's PRODUCTION TypeScript sources outside the central
 * `config/` module. Two layers:
 *
 *  - LAYER A (exact, authoritative): the forbidden set is DERIVED from ALL
 *    exported string values of `config/models.ts` + `config/versions.ts` +
 *    `config/endpoints.ts` (via `mod.ts`) — not a hand-maintained subset. Any
 *    such value appearing in a production source is a violation. The one
 *    documented exclusion is `agy` (also the legitimate Antigravity CLI
 *    executable name, used as a path/argv token across `wsl/` and the adapters).
 *
 *  - LAYER B (structural): flags model-/version-/endpoint-SHAPED literals in
 *    production sources even if the exact string is not (yet) in `config/`. This
 *    is what fails when someone introduces a NEW hardcoded model id.
 *
 * SCOPE — what "production sources" means here (the claim this test actually
 * enforces): every `*.ts` under the suite EXCEPT `config/**` (the single
 * source) and `*_test.ts`. Test files are NOT blanket-excluded: they are scanned
 * against Layer A and may contain a config value ONLY if explicitly listed in
 * `TESTS_ALLOWED_TO_PIN_CONTRACT_LITERALS`, so the "single source" claim stays
 * truthful and a new test cannot silently smuggle a literal. The suite
 * `README.md` is also scanned (Layer A) with an explicit illustrative allowlist.
 * Non-`.ts` operational docs elsewhere are out of scope by design.
 */

import { assert } from '@std/assert';
import * as config from './mod.ts';
import { MODEL_IDS } from './models.ts';
import { OPENCODE_TOOL } from './versions.ts';

const suiteRoot = new URL('../', import.meta.url);

// --- Derive the exact forbidden set from ALL exported config string values ----
function collectStrings(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') out.add(value);
  else if (value && typeof value === 'object') {
    for (const inner of Object.values(value)) collectStrings(inner, out);
  }
}
const configValues = new Set<string>();
collectStrings(config, configValues);

/**
 * `agy` (=`MODEL_IDS.antigravity`) is also the Antigravity CLI executable name,
 * used as a path/argv token across `wsl/` and the adapters — it is not a
 * "hardcoded model id" in those non-config sources.
 */
const OVERLOADED_EXCLUSIONS = new Set<string>([
  MODEL_IDS.antigravity,
  // These OpenCode values are also finite domain vocabulary used in typed
  // contracts and policy data, not independently pinned volatile values.
  OPENCODE_TOOL.binary,
  OPENCODE_TOOL.defaultVariant,
]);
const EXACT_FORBIDDEN = [...configValues].filter((v) => !OVERLOADED_EXCLUSIONS.has(v));

// --- Layer B: structural shapes of model ids / versions / endpoints -----------
// Precise forms that cannot collide with the suite's domain vocabulary (provider
// profile ids use dash forms like `codex-design-glm-5-2`; model ids use dot
// versions like `glm-5.2` and provider slugs like `z-ai/glm-5.2`).
const STRUCTURAL_PATTERNS: readonly { name: string; re: RegExp }[] = [
  { name: 'model:gpt', re: /\bgpt-\d+\.\d+/i },
  { name: 'model:opus', re: /\bopus-\d+\.\d+/i },
  { name: 'model:fable', re: /\bfable-\d+\b/i },
  { name: 'model:claude-family', re: /\bclaude-(?:opus|sonnet|haiku)-\d/i },
  { name: 'model:grok', re: /\bgrok-\d+\.\d+/i },
  { name: 'model:glm', re: /\bglm-\d+\.\d+/i },
  { name: 'model:gemini', re: /\bgemini-\d+\.\d+/i },
  { name: 'model:slug', re: /\b(?:minimax|z-ai|x-ai|openrouter)\/[a-z0-9]/i },
  { name: 'version:semver', re: /(['"`])\d+\.\d+\.\d+\1/ },
  { name: 'endpoint:url', re: /https?:\/\//i },
  {
    name: 'endpoint:host',
    re: /\b(?:registry\.npmjs\.org|antigravity\.google|api\.github\.com)\b/,
  },
];

/**
 * Production sources (by suite-relative path) allowed to contain a specific
 * structural match, with the reason. Keep this tiny and justified.
 */
const STRUCTURAL_ALLOWLIST: Readonly<Record<string, readonly string[]>> = {
  // Illustrative-only help text and doc-comment example of a caller-supplied
  // LiteLLM model id; there is no default and it is not a routing binding.
  'openhands/dispatch-openhands.ts': ['openrouter/qwen/qwen3.7-max'],
};

/**
 * Test files that legitimately pin config-derived contract literals (asserting
 * observed behavior). Explicit, not a blanket corpus exclusion — a new test
 * that pins a literal must be added here deliberately.
 */
const TESTS_ALLOWED_TO_PIN_CONTRACT_LITERALS = new Set<string>([
  'wsl/wsl-foundation_test.ts',
  'runtime/launch-route-identity_test.ts',
  'runtime/provider-profiles_test.ts',
  'runtime/routing-policy_test.ts',
  'runtime/runner-provider-profiles_test.ts',
  'runtime/deferred-boundaries_test.ts',
  'runtime/routing-signal-classifier_test.ts',
  'runtime/provider-canary_test.ts',
  'runtime/antigravity-compat_test.ts',
  'runtime/child-process-environment-adapter_test.ts',
]);

/**
 * The suite README, scanned by Layer A with an explicit illustrative allowlist.
 * `codexSol` is the marked illustrative `--model` example; `codex`
 * (`gpt-5.6`) is only ever present as a substring of that same example.
 */
const README_ILLUSTRATIVE_ALLOWLIST = new Set<string>([
  MODEL_IDS.codexSol,
  config.NATIVE_CANARY_MODEL_ARGS.codex,
  config.OPENCODE_MODEL_IDS.visionEval,
  OPENCODE_TOOL.openRouterEnvRelativePath,
]);

interface SourceFile {
  readonly rel: string;
  readonly abs: URL;
  readonly kind: 'production' | 'test';
}

async function collectTsFiles(dir: URL, prefix: string): Promise<SourceFile[]> {
  const files: SourceFile[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory) {
      if (entry.name === 'config' || entry.name === '__fixtures__') continue;
      files.push(...await collectTsFiles(new URL(`${entry.name}/`, dir), rel));
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    files.push({
      rel,
      abs: new URL(entry.name, dir),
      kind: entry.name.endsWith('_test.ts') ? 'test' : 'production',
    });
  }
  return files;
}

Deno.test('config exports resolve to a non-trivial forbidden set', () => {
  assert(EXACT_FORBIDDEN.length >= 15, `derived only ${EXACT_FORBIDDEN.length} forbidden values`);
});

Deno.test('Layer A — no config value is hardcoded outside config/ (exact, derived)', async () => {
  const files = await collectTsFiles(suiteRoot, '');
  assert(files.length > 20, `expected to scan the suite, found ${files.length} files`);
  const offenders: string[] = [];
  for (const file of files) {
    const source = await Deno.readTextFile(file.abs);
    for (const literal of EXACT_FORBIDDEN) {
      if (!source.includes(literal)) continue;
      if (file.kind === 'test' && TESTS_ALLOWED_TO_PIN_CONTRACT_LITERALS.has(file.rel)) continue;
      offenders.push(`${file.rel} hardcodes config value "${literal}" (source it from config/)`);
    }
  }
  assert(offenders.length === 0, `Layer A violations:\n${offenders.join('\n')}`);
});

Deno.test('Layer A — suite README references config or marks illustratives', async () => {
  const readme = await Deno.readTextFile(new URL('README.md', suiteRoot));
  const offenders = EXACT_FORBIDDEN.filter((literal) =>
    readme.includes(literal) && !README_ILLUSTRATIVE_ALLOWLIST.has(literal)
  );
  assert(offenders.length === 0, `README hardcodes: ${offenders.join(', ')}`);
});

Deno.test('Layer B — no model/version/endpoint-shaped literal in production (structural)', async () => {
  const files = (await collectTsFiles(suiteRoot, '')).filter((f) => f.kind === 'production');
  const offenders: string[] = [];
  for (const file of files) {
    const source = await Deno.readTextFile(file.abs);
    const allowed = STRUCTURAL_ALLOWLIST[file.rel] ?? [];
    for (const line of source.split('\n')) {
      if (allowed.some((token) => line.includes(token))) continue;
      for (const { name, re } of STRUCTURAL_PATTERNS) {
        if (re.test(line)) {
          offenders.push(`${file.rel}: ${name} shape in \`${line.trim().slice(0, 100)}\``);
        }
      }
    }
  }
  assert(offenders.length === 0, `Layer B structural violations:\n${offenders.join('\n')}`);
});
