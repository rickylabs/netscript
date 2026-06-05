#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/**
 * Generate per-package plan + evaluate documents from audit data.
 *
 * For every target in `audit/readiness/_summary.md`, write:
 *   .llm/tmp/run/<run-id>/evaluate_<pkg>.md   (concrete current state)
 *   .llm/tmp/run/<run-id>/plan_<pkg>.md       (concrete target state)
 *
 * Existing files are overwritten — the user explicitly asked us not to do
 * "before/after v2 framing": we re-author as if it were the first pass.
 *
 * Usage:
 *   deno run -A .llm/tools/fitness/generate-package-plans.ts \
 *     --run .llm/tmp/run/<run-id>
 */
import { parseArgs } from 'jsr:@std/cli@^1.0.0/parse-args';
import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { relative } from 'jsr:@std/path@^1.0.0';

const args = parseArgs(Deno.args, { string: ['run'], default: { run: '.llm/tmp/run/jsr-alpha' } });
const RUN = args.run as string;
const HARMON = `harmonisation`;

interface JsrReport {
  pkg: { name: string; version: string; description?: string; root: string };
  exports: Record<string, string>;
  files: { total: number; loc: number; entries: { path: string; bytes: number }[] };
  docs: {
    hasReadme: boolean;
    readmeLines: number;
    hasDocsFolder: boolean;
    moduleTagOnEntries: Record<string, boolean>;
    descriptionLen: number;
  };
  surface: Record<string, { exported: string[]; rawCount: number }>;
  tests: { fileCount: number; files: string[] };
  gates: {
    ref?: string;
    gate?: string;
    level: string;
    message: string;
    path?: string;
    line?: number;
  }[];
  slowTypes: { ok: boolean; warnings: string[]; rawTail: string };
}
interface DoctrineReport {
  pkg: string;
  totals: { fail: number; warn: number; info: number };
  findings: { ref: string; level: string; message: string; path?: string; line?: number }[];
}
interface StdReport {
  pkg: string;
  totals: { fail: number; warn: number; info: number };
  findings: { ref: string; level: string; message: string; path?: string; line?: number }[];
}

interface Archetype {
  num: number;
  name: string;
  pattern: string;
}
const ARCHETYPES: Record<string, Archetype> = {
  shared: { num: 1, name: 'A1 — Small Contract', pattern: 'Function family + DSL' },
  contracts: { num: 1, name: 'A1 — Small Contract', pattern: 'Function family + DSL' },
  'runtime-config': { num: 1, name: 'A1 — Small Contract', pattern: 'Function family' },
  streams: { num: 1, name: 'A1 — Small Contract', pattern: 'Function family + DSL' },
  config: { num: 1, name: 'A1 — Small Contract', pattern: 'Function family + Builder' },
  logger: { num: 2, name: 'A2 — Integration', pattern: 'Function family + Ports/Adapters' },
  telemetry: { num: 2, name: 'A2 — Integration', pattern: 'Function family + Ports/Adapters' },
  aspire: { num: 2, name: 'A2 — Integration', pattern: 'Function family + Builder' },
  kv: { num: 2, name: 'A2 — Integration', pattern: 'Function family + Ports/Adapters' },
  database: { num: 2, name: 'A2 — Integration', pattern: 'Function family + Ports/Adapters' },
  'prisma-adapter-mysql': { num: 2, name: 'A2 — Integration', pattern: 'Adapter implementation' },
  queue: { num: 2, name: 'A2 — Integration', pattern: 'Function family + Ports/Adapters' },
  cron: { num: 2, name: 'A2 — Integration', pattern: 'Function family + Ports/Adapters' },
  watchers: {
    num: 3,
    name: 'A3 — Runtime/Behavior',
    pattern: 'Abstract base + Default + Registry',
  },
  triggers: {
    num: 3,
    name: 'A3 — Runtime/Behavior',
    pattern: 'Abstract base + Default + DSL + Registry',
  },
  workers: { num: 3, name: 'A3 — Runtime/Behavior', pattern: 'Abstract base + Default + Registry' },
  sagas: {
    num: 3,
    name: 'A3 — Runtime/Behavior',
    pattern: 'Abstract base + Default + DSL + Registry',
  },
  plugin: { num: 4, name: 'A4 — DSL/Builder', pattern: 'DSL + Registry + Abstract base' },
  sdk: { num: 4, name: 'A4 — DSL/Builder', pattern: 'Builder + Function family' },
  service: { num: 4, name: 'A4 — DSL/Builder', pattern: 'Builder + Registry' },
  fresh: { num: 4, name: 'A4 — DSL/Builder', pattern: 'Builder + Function family + Adapters' },
  'fresh-ui': { num: 4, name: 'A4 — DSL/Builder', pattern: 'Function family + Components' },
  'plugin-streams': { num: 5, name: 'A5 — Plugin', pattern: 'DSL via @netscript/plugin' },
  'plugin-sagas': { num: 5, name: 'A5 — Plugin', pattern: 'DSL via @netscript/plugin' },
  'plugin-triggers': { num: 5, name: 'A5 — Plugin', pattern: 'DSL via @netscript/plugin' },
  'plugin-workers': { num: 5, name: 'A5 — Plugin', pattern: 'DSL via @netscript/plugin' },
  cli: { num: 6, name: 'A6 — Tooling', pattern: 'Builder + Composition root' },
};

const WAVE: Record<string, number> = {
  shared: 0,
  'runtime-config': 1,
  streams: 1,
  config: 1,
  contracts: 1,
  logger: 2,
  telemetry: 2,
  aspire: 2,
  kv: 2,
  database: 2,
  'prisma-adapter-mysql': 2,
  queue: 2,
  cron: 2,
  plugin: 3,
  watchers: 4,
  triggers: 4,
  'plugin-triggers': 4,
  workers: 4,
  'plugin-workers': 4,
  sagas: 4,
  'plugin-sagas': 4,
  'plugin-streams': 4,
  sdk: 5,
  service: 5,
  fresh: 5,
  'fresh-ui': 5,
  cli: 6,
};

async function readJson<T>(p: string): Promise<T | null> {
  try {
    return JSON.parse(await Deno.readTextFile(p)) as T;
  } catch {
    return null;
  }
}

async function getCurrentTree(root: string): Promise<string> {
  const entries: string[] = [];
  for await (
    const e of walk(root, {
      includeDirs: true,
      includeFiles: true,
      maxDepth: 4,
      skip: [/node_modules/, /\.git/, /_fresh/, /\.deploy/, /coverage/],
    })
  ) {
    if (e.path === root) continue;
    const rel = relative(root, e.path);
    if (rel.split('/').length > 4) continue;
    const indent = '  '.repeat(rel.split('/').length - 1);
    entries.push(`${indent}${rel.split('/').pop()}${e.isDirectory ? '/' : ''}`);
  }
  return entries.slice(0, 80).join('\n');
}

async function generate(target: string) {
  const safe = target.replace('/', '__');
  const pkg = target.startsWith('plugins/')
    ? `plugin-${target.split('/')[1]}`
    : target.split('/')[1];
  const arch = ARCHETYPES[pkg] ?? { num: 0, name: 'TBD', pattern: 'TBD' };
  const wave = WAVE[pkg] ?? -1;

  const jsr = await readJson<JsrReport>(`${RUN}/audit/readiness/jsr/${safe}.json`);
  const doc = await readJson<DoctrineReport>(`${RUN}/audit/readiness/doctrine/${safe}.json`);
  const std = await readJson<StdReport>(`${RUN}/audit/readiness/standards/${safe}.json`);
  const dryRunRaw = await Deno.readTextFile(
    `${RUN}/audit/dry-run/${
      target.startsWith('plugins/') ? `plugin-${target.split('/')[1]}` : target.split('/')[1]
    }.txt`,
  ).catch(() => '(no dry-run captured)');
  // Strip ANSI escape codes
  // deno-lint-ignore no-control-regex
  const ansiRe = /\u001b\[[0-9;]*m/g;
  const dryRun = dryRunRaw.replace(ansiRe, '');
  const tree = await getCurrentTree(target);

  const slowTypeMatch = dryRun.match(/error: Found (\d+) problems?/);
  const slowTypeCount = slowTypeMatch ? parseInt(slowTypeMatch[1]) : 0;
  const dryRunOk = /Success Dry run complete/.test(dryRun);

  // ── evaluate_<pkg>.md ──────────────────────────────────────────────
  const evalDoc = `# Evaluate — \`${jsr?.pkg.name ?? `@netscript/${pkg}`}\`

> Wave: **${wave}** · Archetype: **${arch.name}** · Pattern: **${arch.pattern}**
> Source data: \`audit/readiness/{jsr,doctrine,standards}/${safe}.json\` · \`audit/dry-run/${
    target.startsWith('plugins/') ? `plugin-${target.split('/')[1]}` : target.split('/')[1]
  }.txt\`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | ${jsr?.gates.filter((g) => g.level === 'FAIL').length ?? '?'} | ${
    jsr?.gates.filter((g) => g.level === 'WARN').length ?? '?'
  } | — |
| Doctrine | ${doc?.totals.fail ?? '?'} | ${doc?.totals.warn ?? '?'} | ${doc?.totals.info ?? '?'} |
| Standards | ${std?.totals.fail ?? '?'} | ${std?.totals.warn ?? '?'} | ${std?.totals.info ?? '?'} |

\`deno publish --dry-run\`: **${
    dryRunOk ? '✅ Success' : '❌ FAIL'
  }** · slow-type problems: **${slowTypeCount}**

## 2. Package facts

- **Name:** \`${jsr?.pkg.name ?? '?'}\` @ \`${jsr?.pkg.version ?? '?'}\`
- **Description:** ${jsr?.pkg.description ? `"${jsr.pkg.description}"` : '*(missing)*'}
- **Files / LOC:** ${jsr?.files.total ?? '?'} \`.ts\` files, ${jsr?.files.loc ?? '?'} lines
- **Exports:** ${jsr ? Object.keys(jsr.exports).map((k) => `\`${k}\``).join(', ') : '?'}
- **README:** ${jsr?.docs.hasReadme ? `${jsr.docs.readmeLines} lines` : '*(missing)*'}
- **\`docs/\` folder:** ${jsr?.docs.hasDocsFolder ? 'present' : '*(missing)*'}
- **\`@module\` JSDoc tags on entrypoints:** ${
    jsr
      ? Object.entries(jsr.docs.moduleTagOnEntries).map(([k, v]) => `${k}: ${v ? '✓' : '✗'}`).join(
        ', ',
      )
      : '?'
  }
- **Test files:** ${jsr?.tests.fileCount ?? '?'}
- **Public surface size:** ${
    jsr ? Object.entries(jsr.surface).map(([k, v]) => `${k}=${v.rawCount}`).join(', ') : '?'
  }

## 3. Current folder tree (\`${target}/\`, depth 4, capped at 80 entries)

\`\`\`
${tree}
\`\`\`

## 4. \`deno publish --dry-run\` output (tail)

\`\`\`
${dryRun.split(/\r?\n/).slice(-25).join('\n')}
\`\`\`

## 5. Top JSR audit findings

${
    (jsr?.gates ?? []).slice(0, 15).map((g) =>
      `- **${g.level}** \`${g.gate ?? ''}\` — ${g.message}${
        g.path ? ` (\`${g.path}${g.line ? ':' + g.line : ''}\`)` : ''
      }`
    ).join('\n') || '*(none)*'
  }

## 6. Top doctrine findings

${
    (doc?.findings ?? []).slice(0, 15).map((f) =>
      `- **${f.level}** \`${f.ref}\` — ${f.message}${
        f.path ? ` (\`${f.path}${f.line ? ':' + f.line : ''}\`)` : ''
      }`
    ).join('\n') || '*(none)*'
  }

## 7. Top standards findings

${
    (std?.findings ?? []).slice(0, 20).map((f) =>
      `- **${f.level}** \`${f.ref}\` — ${f.message}${
        f.path ? ` (\`${f.path}${f.line ? ':' + f.line : ''}\`)` : ''
      }`
    ).join('\n') || '*(none)*'
  }

## 8. Code-quality verdict

${verdict(jsr, doc, std, slowTypeCount, dryRunOk, pkg)}

## 9. Test coverage assessment

${testAssessment(jsr, pkg)}

---

*Cross-references:* [\`PLAN.md\`](./PLAN.md) §3, ${HARMON}/STANDARDS.md, ${HARMON}/DOCS-STRUCTURE.md, ${HARMON}/PUBLIC-SURFACE-PATTERNS.md.
`;
  await Deno.writeTextFile(`${RUN}/evaluate_${pkg}.md`, evalDoc);

  // ── plan_<pkg>.md ──────────────────────────────────────────────────
  const planDoc = `# Plan — \`${jsr?.pkg.name ?? `@netscript/${pkg}`}\`

> Wave **${wave}** · Archetype **${arch.name}** · Pattern **${arch.pattern}**
> Pair: [\`evaluate_${pkg}.md\`](./evaluate_${pkg}.md) · master: [\`PLAN.md\`](./PLAN.md)
> Standards: [\`${HARMON}/STANDARDS.md\`](./${HARMON}/STANDARDS.md) · Surface: [\`${HARMON}/PUBLIC-SURFACE-PATTERNS.md\`](./${HARMON}/PUBLIC-SURFACE-PATTERNS.md) · Docs: [\`${HARMON}/DOCS-STRUCTURE.md\`](./${HARMON}/DOCS-STRUCTURE.md)

## 1. Concept of done (alpha quality bar)

This package is publish-ready at \`0.0.1-alpha.0\` when **all nine** PLAN.md § 12 criteria hold:

- [ ] Public surface is immediately understandable, naming follows STANDARDS § 4.
- [ ] Every export carries JSDoc with \`@param\`/\`@returns\`/\`@example\`; \`mod.ts\` opens with the 80%-path \`@module\` block.
- [ ] README has all 12 STANDARDS § 6 sections, ≥ 150 lines, code samples are doctest-imported.
- [ ] \`deno publish --dry-run --allow-dirty\` succeeds (slow-types: ${slowTypeCount} → 0).
- [ ] Doctrine FAILs = 0; archetype declared in \`docs/architecture.md\`.
- [ ] Tests follow STANDARDS § 8 (doctest + unit + port contract + adapter conformance).
- [ ] Logger fields + OTEL spans + metric names match telemetry standard.
- [ ] \`mod.ts\` exports an \`inspect<Noun>(target): InspectionReport\`.
- [ ] Internal layering passes \`check-doctrine.ts\`; files within size cap; no global mutable state.

## 2. Target folder tree

${targetTree(pkg, arch.num)}

## 3. Target public surface (\`mod.ts\`)

${targetSurface(pkg, arch.num)}

## 4. Test coverage plan

${testPlan(pkg, arch.num)}

## 5. Slice list (mechanical sequence)

${sliceList(pkg, jsr, doc, std, slowTypeCount)}

## 6. Gate matrix

| Gate | Source | Today | Target |
|---|---|---:|---:|
| JSR FAIL | \`audit/readiness/jsr/${safe}.json\` | ${
    jsr?.gates.filter((g) => g.level === 'FAIL').length ?? '?'
  } | 0 |
| JSR WARN | same | ${jsr?.gates.filter((g) => g.level === 'WARN').length ?? '?'} | ≤ 2 |
| Doctrine FAIL | \`audit/readiness/doctrine/${safe}.json\` | ${doc?.totals.fail ?? '?'} | 0 |
| Doctrine WARN | same | ${doc?.totals.warn ?? '?'} | ≤ 5 |
| Standards FAIL | \`audit/readiness/standards/${safe}.json\` | ${std?.totals.fail ?? '?'} | 0 |
| Standards WARN | same | ${std?.totals.warn ?? '?'} | ≤ 10 |
| \`deno publish --dry-run\` | \`audit/dry-run/${
    target.startsWith('plugins/') ? `plugin-${target.split('/')[1]}` : target.split('/')[1]
  }.txt\` | ${dryRunOk ? 'OK' : 'FAIL'} | OK |
| Slow types | same | ${slowTypeCount} | 0 |

## 7. Naming map (current → target)

${namingMap(pkg, jsr)}

## 8. Documentation deliverables

- \`README.md\` — all 12 STANDARDS § 6 sections (currently ${
    jsr?.docs.hasReadme ? `${jsr.docs.readmeLines} lines` : '*missing*'
  })
- \`docs/README.md\` (ToC)
- \`docs/architecture.md\` (archetype declaration + ascii diagram + axiom call-outs)
- \`docs/concepts.md\` (glossary)
- \`docs/getting-started.md\` (10-min walk-through)
- \`docs/recipes/\` (≥ 3 task recipes; required for ${
    arch.num >= 2 ? 'this package' : 'optional but recommended'
  })
- \`docs/reference/\` (auto-generated stub at alpha; Wave 0 generator lands later)

## 9. References

- PLAN.md — wave ${wave}, archetype ${arch.name}
- doctrine — \`.llm/research/architecture-doctrine-docs-v2/doctrine/\`
- standards — \`${HARMON}/STANDARDS.md\`
- patterns — \`${HARMON}/PUBLIC-SURFACE-PATTERNS.md\`
- docs spec — \`${HARMON}/DOCS-STRUCTURE.md\`
- audit data — \`audit/readiness/{jsr,doctrine,standards}/${safe}.json\`
`;
  await Deno.writeTextFile(`${RUN}/plan_${pkg}.md`, planDoc);
}

function verdict(
  jsr: JsrReport | null,
  _doc: DoctrineReport | null,
  std: StdReport | null,
  slow: number,
  ok: boolean,
  _pkg: string,
): string {
  const parts: string[] = [];
  if (ok && slow === 0 && (jsr?.gates.filter((g) => g.level === 'FAIL').length ?? 1) === 0) {
    parts.push('**Publish-clean today.**');
  } else if (slow === 0 && !ok) {
    parts.push('Dry-run blocked by license / metadata only — trivial fix.');
  } else if (slow > 0 && slow <= 6) {
    parts.push(
      `**Small slow-type refactor (${slow} problems).** Add explicit return types on the published functions.`,
    );
  } else if (slow > 6 && slow <= 30) {
    parts.push(
      `**Medium refactor (${slow} slow-type problems).** Public surface needs explicit types; some types should move from inferred (\`z.infer\`) to declared interfaces with slot generics.`,
    );
  } else if (slow > 30) {
    parts.push(
      `**Heavy restructure (${slow} slow-type problems).** Indicates the public DSL leaks generic accumulators across chained methods. Move to the abstract-base / DSL-with-explicit-Definition-type pattern (PUBLIC-SURFACE-PATTERNS § 3, § 4).`,
    );
  }
  if (!jsr?.docs.hasReadme) parts.push('README missing — blocks DX bar.');
  if (jsr && Object.values(jsr.docs.moduleTagOnEntries).some((v) => !v)) {
    parts.push('Some entrypoints lack `@module` JSDoc — required for JSR scoring.');
  }
  if (jsr && jsr.tests.fileCount === 0) {
    parts.push('No tests today — meaningful test plan needed (see § 9).');
  }
  const stdWarnTop = std?.findings.filter((f) => f.level === 'WARN').slice(0, 3).map((f) => f.ref);
  if (stdWarnTop && stdWarnTop.length) {
    parts.push(`Top STANDARDS warnings: \`${stdWarnTop.join('\`, \`')}\`.`);
  }
  return parts.join(' ') || '*(see findings above)*';
}

function testAssessment(jsr: JsrReport | null, _pkg: string): string {
  const c = jsr?.tests.fileCount ?? 0;
  if (c === 0) {
    return `No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.`;
  }
  if (c < 3) {
    return `${c} test file(s) today — likely insufficient. Doctrine § 8 requires layered coverage (domain → ports → adapters → application). Audit results show the existing tests should be re-evaluated for meaningfulness (no \`should work\` style names; no internal imports).`;
  }
  return `${c} test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from \`src/internal/\`, (c) no Jest globals, (d) port contracts shared via \`./testing\` entrypoint. Promote/rewrite as the plan's § 4 dictates.`;
}

function targetTree(pkg: string, arch: number): string {
  // Generic per-archetype tree. Specifics live in the per-package overrides
  // human-edited later; this gives a doctrine-aligned starting point.
  const common = `\`\`\`
packages/${pkg}/
├── README.md
├── deno.json
├── mod.ts                            # barrel only — re-export from src/public/
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── concepts.md
│   ├── getting-started.md
│   ├── recipes/
│   └── reference/
├── src/
│   ├── public/
│   │   └── mod.ts                    # curated re-exports
│   ├── domain/                       # Zod schemas, errors, value objects, invariants
│   ├── ports/                        # interfaces consumed by adapters
│   ├── application/                  # use-cases composing ports
│   ├── adapters/                     # implementations of ports (per backend)
${
    arch >= 3
      ? '│   ├── runtime/                       # supervisors, lifecycle, state machines\n'
      : ''
  }${
    arch >= 4
      ? '│   ├── presentation/                  # builders, fluent surface, DSL helpers\n'
      : ''
  }│   ├── diagnostics/                  # inspect<Noun>(), redactors
│   ├── testing/                      # public test fixtures (re-exported via ./testing)
│   └── internal/                     # private — never exported
├── tests/
│   ├── _fixtures/
│   │   └── readme-examples_test.ts   # imports README code blocks
│   ├── domain/                       # unit tests aligned with src/domain
│   ├── ports/                        # contract tests per port
│   ├── adapters/                     # adapter conformance — invokes port contracts
│   └── application/                  # use-case tests
└── examples/                         # runnable examples referenced from README
\`\`\``;
  return common;
}

function targetSurface(pkg: string, arch: number): string {
  // Per-archetype skeleton stub
  if (arch === 1) {
    return `\`\`\`ts
// mod.ts — A1 small contract: function family + DSL
/**
 * @module
 *
 * <One-sentence purpose>.
 *
 * @example Basic
 * \`\`\`ts
 * import { create${cap(pkg)}, define${cap(pkg)} } from "jsr:@netscript/${pkg}@^0.0.1-alpha.0";
 * const x = create${cap(pkg)}({ ... });
 * \`\`\`
 */

// ── Definitions (DSL) ──
export { define${cap(pkg)}, type ${cap(pkg)}Definition, type ${
      cap(pkg)
    }Spec } from "./src/public/mod.ts";

// ── Factories ──
export { create${cap(pkg)}, type ${cap(pkg)}, type Create${
      cap(pkg)
    }Options } from "./src/public/mod.ts";

// ── Types ──
export type { ${cap(pkg)}Schema } from "./src/public/mod.ts";

// ── Errors ──
export { ${cap(pkg)}Error, ${cap(pkg)}ValidationError } from "./src/public/mod.ts";

// ── Diagnostics ──
export { inspect${cap(pkg)} } from "./src/public/mod.ts";
\`\`\`
`;
  }
  if (arch === 2) {
    return `\`\`\`ts
// mod.ts — A2 integration: function family + ports + adapters
/**
 * @module
 *
 * <One-sentence purpose>.
 *
 * @example Basic
 * \`\`\`ts
 * import { open${cap(pkg)} } from "jsr:@netscript/${pkg}@^0.0.1-alpha.0";
 * const ${pkg.replace('-', '')} = await open${cap(pkg)}({ ... });
 * \`\`\`
 *
 * @example With custom adapter
 * \`\`\`ts
 * const ${pkg.replace('-', '')} = await open${cap(pkg)}({
 *   adapter: my${cap(pkg)}Adapter,
 * });
 * \`\`\`
 */

// ── Factories / acquisition ──
export { open${cap(pkg)}, create${cap(pkg)}, type ${cap(pkg)}, type Open${
      cap(pkg)
    }Options } from "./src/public/mod.ts";

// ── Ports ──
export type { ${cap(pkg)}Port } from "./src/public/mod.ts";

// ── Adapters (re-exports of canonical implementations) ──
// Specific adapters live in sub-entrypoints — \`./adapters/<backend>\`

// ── Errors ──
export { ${cap(pkg)}Error, ${cap(pkg)}ConnectionError } from "./src/public/mod.ts";

// ── Diagnostics ──
export { inspect${cap(pkg)} } from "./src/public/mod.ts";
\`\`\`

The \`./testing\` entrypoint exports \`run${
      cap(pkg)
    }Contract({ make: () => Port })\` so consumers can verify their custom adapter against the canonical contract.
`;
  }
  if (arch === 3) {
    return `\`\`\`ts
// mod.ts — A3 runtime: abstract base + default + DSL + registry
/**
 * @module
 *
 * <One-sentence purpose>. Subclass {@link Base${cap(pkg)}} or use {@link Default${cap(pkg)}}.
 *
 * @example Use the default
 * \`\`\`ts
 * import { Default${cap(pkg)}, define${cap(pkg)} } from "jsr:@netscript/${pkg}@^0.0.1-alpha.0";
 * const def = define${cap(pkg)}({ name: "demo", ... });
 * const runtime = new Default${cap(pkg)}({ definition: def });
 * await runtime.start();
 * \`\`\`
 *
 * @example Subclass for custom behaviour
 * \`\`\`ts
 * class My${cap(pkg)} extends Base${cap(pkg)}<MyPayload> {
 *   protected async execute(payload, ctx) { ... }
 *   protected onError(err, payload) { return { retry: false }; }
 * }
 * \`\`\`
 */

// ── Definitions (DSL) ──
export { define${cap(pkg)}, type ${cap(pkg)}Definition, type ${
      cap(pkg)
    }Spec } from "./src/public/mod.ts";

// ── Runtime base + default ──
export {
  Base${cap(pkg)},
  type Base${cap(pkg)}Options,
  type ExecutionContext,
  type RetryDecision,
} from "./src/public/mod.ts";
export { Default${cap(pkg)}, type Default${cap(pkg)}Options } from "./src/public/mod.ts";

// ── Registry ──
export { ${cap(pkg)}Registry, type ${cap(pkg)}RegistryOptions } from "./src/public/mod.ts";

// ── Errors ──
export { ${cap(pkg)}Error, ${cap(pkg)}AlreadyStartedError, Unknown${
      cap(pkg)
    }Error } from "./src/public/mod.ts";

// ── Diagnostics ──
export { inspect${cap(pkg)} } from "./src/public/mod.ts";
\`\`\`

Composition:

1. \`define${cap(pkg)}\` produces a frozen \`${cap(pkg)}Definition\` (declarative).
2. \`new Default${cap(pkg)}({ definition })\` or \`class My extends Base${cap(pkg)}<P>\`.
3. \`${cap(pkg)}Registry\` registers/resolves definitions for the framework supervisor.
`;
  }
  if (arch === 4) {
    return `\`\`\`ts
// mod.ts — A4 DSL/Builder
/**
 * @module
 *
 * <One-sentence purpose>.
 *
 * @example Build
 * \`\`\`ts
 * import { build${cap(pkg)} } from "jsr:@netscript/${pkg}@^0.0.1-alpha.0";
 * const result = build${cap(pkg)}("name")
 *   .with...(...)
 *   .build();
 * \`\`\`
 */

// ── Builders ──
export { build${cap(pkg)}, type ${cap(pkg)}Builder, type ${cap(pkg)} } from "./src/public/mod.ts";

// ── DSL / definitions ──
export { define${cap(pkg)}, type ${cap(pkg)}Definition, type ${
      cap(pkg)
    }Spec } from "./src/public/mod.ts";

// ── Registry (when applicable) ──
export { ${cap(pkg)}Registry } from "./src/public/mod.ts";

// ── Errors ──
export { ${cap(pkg)}Error } from "./src/public/mod.ts";

// ── Diagnostics ──
export { inspect${cap(pkg)} } from "./src/public/mod.ts";
\`\`\`
`;
  }
  if (arch === 5) {
    return `\`\`\`ts
// mod.ts — A5 plugin: thin DSL wrapper around @netscript/plugin
/**
 * @module
 *
 * <One-sentence purpose>. Loaded by \`@netscript/plugin\` runtime.
 *
 * @example Register in app
 * \`\`\`ts
 * import { ${pkg.replace('plugin-', '')}Plugin } from "jsr:@netscript/${pkg}@^0.0.1-alpha.0";
 * registry.register(${pkg.replace('plugin-', '')}Plugin);
 * \`\`\`
 */

// ── Plugin definition ──
export { ${pkg.replace('plugin-', '')}Plugin } from "./src/public/mod.ts";

// ── Types (re-export of definition shape) ──
export type { ${cap(pkg.replace('plugin-', ''))}PluginConfig } from "./src/public/mod.ts";

// ── Diagnostics ──
export { inspect${cap(pkg.replace('plugin-', ''))}Plugin } from "./src/public/mod.ts";
\`\`\`
`;
  }
  if (arch === 6) {
    return `\`\`\`ts
// mod.ts — A6 cli: function family + builder + composition root
/**
 * @module
 *
 * Public NetScript CLI command tree, embeddable into host applications.
 */

// ── Public CLI factory ──
export { createPublicCli, type PublicCliOptions, type PublicCli } from "./src/public/mod.ts";

// ── Maintainer entrypoint (sub-entrypoint './maintainer') ──
// Separate sub-entrypoint to keep public surface minimal.

// ── Scaffolding (sub-entrypoint './scaffolding') ──
// ── Testing (sub-entrypoint './testing') ──
\`\`\`

CLI keeps three sub-entrypoints: \`./scaffolding\`, \`./testing\`, plus the
default. The internal \`./maintainer\` mode is intentionally NOT a JSR
entrypoint — it ships in the binary only.
`;
  }
  return '*(archetype unknown — author manually)*';
}

function testPlan(pkg: string, arch: number): string {
  const lines = [
    '**Required test layers** (STANDARDS § 8):',
    '',
    `1. **Doctest of README examples** — \`tests/_fixtures/readme-examples_test.ts\` imports each \`\`\`ts\`\`\` block from README to prevent doc rot.`,
    `2. **Domain unit tests** — every Zod schema, error class, and pure function in \`src/domain/\` has a unit test asserting the invariant it embodies.`,
  ];
  if (arch >= 2) {
    lines.push(
      `3. **Port contract tests** — for each interface in \`src/ports/\`, write \`tests/ports/<port>_contract_test.ts\` exporting \`run<Port>Contract({ make })\`. Adapter tests invoke this suite to prove conformance.`,
      `4. **Adapter conformance** — for each adapter in \`src/adapters/\`, \`tests/adapters/<backend>_test.ts\` runs the port contract suite with that adapter wired.`,
    );
  }
  if (arch >= 3) {
    lines.push(
      `5. **Runtime lifecycle tests** — every abstract base / default class has tests for \`start\` → \`execute\` → \`stop\`, crash → \`onError\` → retry, and idempotence.`,
      `6. **Supervision tests** — registry resolves, freezes, rejects duplicates; runtime supervisor wires definition + adapter correctly.`,
    );
  }
  if (arch === 4 || arch === 5) {
    lines.push(
      `7. **DSL / builder ergonomics tests** — \`define${
        cap(pkg)
      }\` rejects malformed specs; \`build${
        cap(pkg)
      }\` enforces required steps (typed at compile time and at runtime).`,
    );
  }
  if (arch === 6) {
    lines.push(
      `7. **CLI E2E** — \`tests/e2e/<command>_test.ts\` invokes the compiled binary against a fixture project and asserts on output + exit code.`,
    );
  }
  lines.push(
    '',
    '**Forbidden patterns** (see STANDARDS § 8):',
    '- imports from `src/internal/` in tests',
    '- Jest/Vitest globals (`describe`, `it`, `expect`)',
    '- test names like `"happy path"`, `"works"`, `"basic"`',
    '- shared global mutable state across `Deno.test` blocks',
    '- assertions on log strings (assert structured fields instead)',
    '',
    `**Coverage target:** 100% of public symbols invoked at least once via doctest + dedicated test, plus every error path triggered at least once.`,
  );
  return lines.join('\n');
}

function namingMap(_pkg: string, jsr: JsrReport | null): string {
  if (!jsr) return '_(no audit data)_';
  const surface = Object.values(jsr.surface).flatMap((s) => s.exported);
  const violations: { name: string; reason: string; suggestion: string }[] = [];
  for (const name of surface) {
    if (/^I[A-Z]/.test(name)) {
      violations.push({ name, reason: 'I-prefix interface', suggestion: name.slice(1) });
    }
    if (/Args|Params$/.test(name)) {
      violations.push({
        name,
        reason: 'non-standard suffix',
        suggestion: name.replace(/(?:Args|Params)$/, 'Options'),
      });
    }
    if (/^get[A-Z]/.test(name) && !/^get(?:OrCreate|Random|Default|Module|Type)/.test(name)) {
      violations.push({
        name,
        reason: '`get` prefix used for non-property accessor',
        suggestion: 'consider `read…`/`resolve…`/`load…`',
      });
    }
  }
  if (violations.length === 0) {
    return '_(no obvious naming violations detected from public surface scan — verify manually against STANDARDS § 4)_';
  }
  return [
    '| Current | Issue | Suggested |',
    '|---|---|---|',
    ...violations.slice(0, 25).map((v) => `| \`${v.name}\` | ${v.reason} | \`${v.suggestion}\` |`),
  ].join('\n');
}

function sliceList(
  pkg: string,
  jsr: JsrReport | null,
  doc: DoctrineReport | null,
  std: StdReport | null,
  slow: number,
): string {
  const slices: string[] = [];
  let n = 1;
  if (jsr && !jsr.docs.hasReadme) {
    slices.push(`${n++}. **README scaffold** — write all 12 STANDARDS § 6 sections, ≥ 150 lines.`);
  }
  if (jsr && jsr.docs.descriptionLen === 0) {
    slices.push(
      `${n++}. **Description** — add \`"description"\` to deno.json (≤ 250 chars, ends with period).`,
    );
  }
  if (jsr && jsr.gates.some((g) => /license/i.test(g.message))) {
    slices.push(`${n++}. **License** — add \`"license": "MIT"\` to deno.json.`);
  }
  if (jsr && Object.values(jsr.docs.moduleTagOnEntries).some((v) => !v)) {
    slices.push(`${n++}. **Module tags** — add \`@module\` JSDoc block to every entrypoint.`);
  }
  if (slow > 0) {
    slices.push(
      `${n++}. **Slow-types refactor** (${slow} problems) — add explicit return types to every published function; replace inferred \`z.infer\` chains with declared \`<Noun>Definition\` interfaces with slot generics. See PUBLIC-SURFACE-PATTERNS § 4.`,
    );
  }
  if (doc && doc.findings.some((f) => /AP-7|F-DOCT-4/.test(f.ref))) {
    slices.push(
      `${n++}. **Folder vocabulary** — migrate forbidden folders (\`utils/\`, \`helpers/\`, \`interfaces/\`) into doctrine-aligned folders (\`domain/\`, \`application/\`, \`adapters/\`).`,
    );
  }
  if (doc && doc.findings.some((f) => /A4/.test(f.ref) && f.level === 'FAIL')) {
    slices.push(
      `${n++}. **Abstract-base discipline** — flagged abstract classes have no abstract members; either declare abstract methods or split into \`<noun>.base.ts\` + \`<noun>.default.ts\`.`,
    );
  }
  if (doc && doc.findings.some((f) => /AP-15|F-DOCT-7/.test(f.ref))) {
    slices.push(`${n++}. **I-prefix purge** — rename \`I<Foo>\` → \`<Foo>\` (codemod available).`);
  }
  if (doc && doc.findings.some((f) => /A10|AP-22/.test(f.ref))) {
    slices.push(
      `${n++}. **Eliminate global mutable state** — replace \`export let\` with composition root.`,
    );
  }
  if (jsr && jsr.tests.fileCount === 0) {
    slices.push(
      `${n++}. **Test scaffold** — write doctest + domain unit + port contract tests per § 4 of this plan.`,
    );
  }
  if (std && std.findings.some((f) => /NS-S-3/.test(f.ref) && f.level === 'WARN')) {
    slices.push(
      `${n++}. **Barrel discipline** — \`mod.ts\` is too large or has logic; curate via \`src/public/mod.ts\` and re-export named symbols only.`,
    );
  }
  if (std && std.findings.some((f) => /NS-S-7/.test(f.ref))) {
    slices.push(
      `${n++}. **\`docs/\` folder** — author per DOCS-STRUCTURE.md (architecture.md is mandatory).`,
    );
  }
  if (jsr && !jsr.gates.some((g) => /publish.include/i.test(g.message))) {
    // No explicit complaint, but check if publish include exists
  }
  slices.push(
    `${n++}. **Inspection diagnostic** — export \`inspect${
      cap(pkg)
    }(target): InspectionReport\` from mod.ts.`,
  );
  slices.push(`${n++}. **Final dry-run** — \`deno publish --dry-run --allow-dirty\` must succeed.`);
  slices.push(
    `${n++}. **Pin version** — set \`"version": "0.0.1-alpha.0"\`; run \`release-readiness.ts\` and confirm 0 fail.`,
  );
  return slices.join('\n');
}

function cap(s: string): string {
  return s.split(/[-_]/).map((w) => w[0]?.toUpperCase() + w.slice(1)).join('');
}

const targets = [
  'packages/shared',
  'packages/contracts',
  'packages/runtime-config',
  'packages/streams',
  'packages/config',
  'packages/logger',
  'packages/telemetry',
  'packages/aspire',
  'packages/kv',
  'packages/database',
  'packages/prisma-adapter-mysql',
  'packages/queue',
  'packages/cron',
  'packages/plugin',
  'packages/watchers',
  'packages/triggers',
  'packages/workers',
  'packages/sagas',
  'packages/sdk',
  'packages/service',
  'packages/fresh',
  'packages/fresh-ui',
  'packages/cli',
  'plugins/streams',
  'plugins/sagas',
  'plugins/triggers',
  'plugins/workers',
];

for (const t of targets) {
  console.log(
    `generating ${t} → ${RUN}/{evaluate,plan}_${
      t.startsWith('plugins/') ? 'plugin-' + t.split('/')[1] : t.split('/')[1]
    }.md`,
  );
  await generate(t);
}
console.log(`\nDone. ${targets.length} packages × 2 docs = ${targets.length * 2} files written.`);
