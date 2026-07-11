#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env
/**
 * Doctrine readiness evaluator.
 *
 * Evaluates a package against the Architecture Doctrine
 * (docs/architecture/doctrine/) — axioms A1..A14,
 * anti-patterns AP-1..AP-25, and fitness gates F-1..F-19 — at the granularity that can be checked
 * mechanically.
 *
 * Findings are tagged with the doctrine reference (A##/AP-##/F-##) so an
 * evaluator can cross-reference doctrine docs without re-reading them.
 *
 * Mechanically checkable items only — semantic axioms (A1, A2, A11) emit
 * informational findings the human evaluator must verify by reading
 * `mod.ts`.
 *
 * Usage:
 *   deno run -A .llm/tools/fitness/check-doctrine.ts \
 *     --root packages/streams \
 *     --out  .llm/tmp/run/<run-id>/audit/doctrine/streams.json
 */
import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { parseArgs } from 'jsr:@std/cli@^1.0.0/parse-args';
import { join, relative } from 'jsr:@std/path@^1.0.0';

const args = parseArgs(Deno.args, {
  string: ['root', 'out'],
  boolean: ['text'],
  default: { root: '.', text: false },
});
const ROOT = args.root as string;

interface Finding {
  ref: string; // doctrine reference, e.g. A4, AP-15, F-16
  level: 'PASS' | 'WARN' | 'FAIL' | 'INFO';
  message: string;
  path?: string;
  line?: number;
}
const findings: Finding[] = [];

async function exists(p: string) {
  try {
    await Deno.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function readText(p: string) {
  try {
    return await Deno.readTextFile(p);
  } catch {
    return '';
  }
}

function stripStringLiterals(line: string) {
  return line.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""');
}

function isTestPath(repoPath: string) {
  const normalized = repoPath.replaceAll('\\', '/');
  return normalized.includes('/tests/') ||
    normalized.endsWith('_test.ts') ||
    normalized.endsWith('.test.ts');
}

// ─────────────────────────────────────────────────────────────────────────
// A1 / A2 — public types first, simple over easy at boundaries
// (Mechanical proxy: mod.ts has @module + every export has explicit return type)
// ─────────────────────────────────────────────────────────────────────────
const modPath = join(ROOT, 'mod.ts');
if (await exists(modPath)) {
  const text = await readText(modPath);
  if (!/@module\b/.test(text.slice(0, 4096))) {
    findings.push({
      ref: 'A1',
      level: 'FAIL',
      message: 'mod.ts must lead with `@module` JSDoc block (Public Types First)',
      path: 'mod.ts',
    });
  }
  if (text.length > 200 * 80) {
    findings.push({
      ref: 'A2',
      level: 'WARN',
      message: 'mod.ts is too large; barrels must stay ≤ 200 lines (Simple over Easy)',
      path: 'mod.ts',
    });
  }
  // Wildcard re-exports from internal layers
  for (
    const m of text.matchAll(
      /^export\s+\*\s+from\s+['"](\.\/(?:src\/)?(?:internal|adapters|application|runtime|state|domain)\/[^'"]*)['"]/gm,
    )
  ) {
    findings.push({
      ref: 'A1',
      level: 'WARN',
      message: `mod.ts wildcard re-exports internal layer ${
        m[1]
      } — curate via src/public/mod.ts instead`,
      path: 'mod.ts',
    });
  }
} else {
  findings.push({
    ref: 'A1',
    level: 'FAIL',
    message: 'mod.ts missing — required canonical entrypoint',
  });
}

// ─────────────────────────────────────────────────────────────────────────
// A3 — 80% path is one chained call (proxy: README has copy-pasteable example)
// ─────────────────────────────────────────────────────────────────────────
const readmeText = await readText(join(ROOT, 'README.md'));
if (readmeText) {
  const codeFences = (readmeText.match(/```ts/g) || []).length +
    (readmeText.match(/```typescript/g) || []).length;
  if (codeFences < 2) {
    findings.push({
      ref: 'A3',
      level: 'WARN',
      message:
        `README has only ${codeFences} TS code fences — needs ≥ 2 (basic + advanced) for the 80% path`,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// A4 — Base classes are stub-only contracts
// Heuristic: any `export abstract class` MUST declare ≥ 1 abstract member, and
// concrete implementations MUST live in a sibling `*.default.ts` or `*.impl.ts`
// rather than the base file. An abstract member is an abstract method, an
// abstract accessor, OR an `abstract readonly` identity field — doctrine file
// 03 ("The stub-only rule") explicitly counts `abstract readonly id/kind/...`
// fields as the contract a spine base imposes on its subtypes.
// Exception: a class with a `protected constructor` is a deliberate layer-2
// abstract (doctrine file 03, "Spine versus layer-2 abstracts" / R-BASE-L2) —
// a non-instantiable sub-base that may carry concrete shared behavior. The
// stub-only rule applies to the spine, not to layer-2 abstracts, so a
// protected-ctor base is not flagged for "no abstract members".
// ─────────────────────────────────────────────────────────────────────────
const tsFiles: string[] = [];
for await (
  const entry of walk(ROOT, {
    match: [/\.ts$/],
    skip: [
      /node_modules/,
      /_test\.ts$/,
      /\.test\.ts$/,
      /tests\//,
      /examples\//,
      /src\/scaffold\/templates\//,
      /_fresh/,
      /\.deploy/,
    ],
  })
) tsFiles.push(entry.path);

for (const f of tsFiles) {
  const text = await readText(f);
  for (const m of text.matchAll(/export\s+abstract\s+class\s+(\w+)([^{]*)\{([\s\S]*?)\n\}/gm)) {
    const [, cls, , body] = m;
    // Abstract method (incl. generic `<` and async), abstract accessor
    // (`abstract get/set foo()`), or abstract field (`abstract readonly axis:`,
    // `abstract name:`, `abstract foo?:`) — all satisfy the stub-only contract.
    const hasAbstract = /\babstract\s+(?:async\s+)?\w+\s*</.test(body) ||
      /\babstract\s+(?:async\s+)?\w+\s*\(/.test(body) ||
      /\babstract\s+(?:get|set)\s+\w+\s*\(/.test(body) ||
      /\babstract\s+(?:readonly\s+)?\w+\s*[?:]/.test(body);
    // A `protected constructor` marks a deliberate layer-2 / non-instantiable
    // base (R-BASE-L2); such bases need not declare abstract members.
    const isLayer2Base = /\bprotected\s+constructor\s*\(/.test(body);
    if (!hasAbstract && !isLayer2Base) {
      findings.push({
        ref: 'A4',
        level: 'FAIL',
        message:
          `abstract class ${cls} declares no abstract members — bases are stub-only contracts`,
        path: relative(ROOT, f),
      });
    }
    // Public mutable fields on a base — anti-pattern
    if (/\n\s*public\s+\w+\s*[=:]/.test(body)) {
      findings.push({
        ref: 'A4',
        level: 'WARN',
        message:
          `abstract class ${cls} has a public mutable field — base classes should expose state via getter methods only`,
        path: relative(ROOT, f),
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// A5 — Composition over inheritance.
// AP-5 / F-4: deep inheritance.
// Heuristic: any class chain ≥ 3 deep (extends Foo extends Bar) flagged.
// ─────────────────────────────────────────────────────────────────────────
// Approximated: count chains that say `extends X` where X also extends Y in same package.
const extendsMap = new Map<string, string>();
for (const f of tsFiles) {
  const text = await readText(f);
  for (const m of text.matchAll(/class\s+(\w+)\s+extends\s+(\w+)/g)) {
    extendsMap.set(m[1], m[2]);
  }
}
for (const [cls, parent] of extendsMap) {
  let depth = 1;
  let cur = parent;
  const seen = new Set<string>([cls]);
  while (extendsMap.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    cur = extendsMap.get(cur)!;
    depth++;
    if (depth >= 3) {
      findings.push({
        ref: 'A5/AP-5/F-4',
        level: 'WARN',
        message:
          `class ${cls} sits ${depth}+ levels deep in inheritance chain — prefer composition`,
      });
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// A6 / A7 — Helpers must be justified; std/web first.
// AP-16 / F-11 forbidden generic folder names.
// ─────────────────────────────────────────────────────────────────────────
const FORBIDDEN_DIRS = new Set(['utils', 'helpers', 'common', 'lib', 'interfaces']);
for await (
  const entry of walk(ROOT, {
    includeDirs: true,
    includeFiles: false,
    skip: [/node_modules/, /_fresh/, /\.deploy/, /docs/, /examples/, /tests/, /\.git/],
  })
) {
  const seg = entry.path.split('/').pop()!;
  if (FORBIDDEN_DIRS.has(seg) && entry.path !== ROOT) {
    findings.push({
      ref: 'AP-16/F-11',
      level: 'WARN',
      message:
        `forbidden folder name '${seg}' — split into domain/, application/, or adapters/ aligned to a real concern`,
      path: relative(ROOT, entry.path),
    });
  }
}
// Inline result contracts: local Result/Option-style types are allowed when
// they are package-specific boundary contracts. They should stay intentional
// and documented instead of being forced through a removed shared package.
for (const f of tsFiles) {
  const text = await readText(f);
  if (
    /export\s+type\s+(Result|Either|Option|Maybe)\b/.test(text)
  ) {
    findings.push({
      ref: 'A1/A2/A7',
      level: 'WARN',
      message:
        `exports Result/Either/Option-style contract — keep it package-specific, documented, and inline unless multiple real consumers justify a shared contract`,
      path: relative(ROOT, f),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// A8 — One concern per folder, one reason per file.
// F-16 cardinality (>12 children).
// AP-1 / F-1 mega files (>500 lines for application/runtime; >300 for domain).
// ─────────────────────────────────────────────────────────────────────────
for (const f of tsFiles) {
  const text = await readText(f);
  const lines = text.split(/\r?\n/).length;
  const rel = relative(ROOT, f);
  let cap = 500;
  if (rel.includes('/domain/') || rel.endsWith('schemas.ts') || rel.endsWith('types.ts')) cap = 300;
  if (rel.includes('/runtime/') || rel.includes('/application/')) cap = 500;
  if (lines > cap) {
    findings.push({
      ref: 'A8/AP-1/F-1',
      level: 'WARN',
      message: `file is ${lines} lines (cap ${cap}) — split into smaller single-reason files`,
      path: rel,
    });
  }
}
const childCounts = new Map<string, number>();
for await (
  const entry of walk(ROOT, {
    includeDirs: true,
    includeFiles: true,
    skip: [/node_modules/, /\.git/, /_fresh/, /\.deploy/, /docs/, /examples/, /tests/],
  })
) {
  const parent = entry.path.split('/').slice(0, -1).join('/');
  if (parent.startsWith(ROOT)) {
    childCounts.set(parent, (childCounts.get(parent) ?? 0) + 1);
  }
}
for (const [path, count] of childCounts) {
  if (count > 12) {
    findings.push({
      ref: 'F-16',
      level: 'WARN',
      message: `directory has ${count} immediate children; doctrine cap is 12`,
      path: relative(ROOT, path),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// A9 — Archetype drives package shape.
// Mechanical check: deno.json description SHOULD declare archetype in its docs/architecture.md.
// ─────────────────────────────────────────────────────────────────────────
const archDocPath = join(ROOT, 'docs/architecture.md');
if (await exists(archDocPath)) {
  const t = await readText(archDocPath);
  if (!/Archetype\s*[:#-]\s*\d/.test(t)) {
    findings.push({
      ref: 'A9',
      level: 'WARN',
      message: 'docs/architecture.md must declare archetype number (1–6)',
      path: 'docs/architecture.md',
    });
  }
} else {
  // INFO only — small contract packages may skip docs/
  findings.push({
    ref: 'A9',
    level: 'INFO',
    message: 'docs/architecture.md missing — required when public symbols > 25',
  });
}

// ─────────────────────────────────────────────────────────────────────────
// A10 — Composition root over container. Detect global mutable singletons.
// AP-11: module-level `let` exporting mutable state.
// ─────────────────────────────────────────────────────────────────────────
for (const f of tsFiles) {
  const text = await readText(f);
  for (const m of text.matchAll(/^export\s+let\s+(\w+)/gm)) {
    findings.push({
      ref: 'A10/AP-11',
      level: 'FAIL',
      message: `module-level \`export let ${
        m[1]
      }\` — global mutable state forbidden; use composition root`,
      path: relative(ROOT, f),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// A12 — Durable workflows are state machines.
// (Semantic — INFO only when package name contains saga/workflow/trigger/worker)
// ─────────────────────────────────────────────────────────────────────────
const pkgName = ROOT.split('/').pop() || '';
if (/sagas?|workflow|triggers?|workers?/i.test(pkgName)) {
  findings.push({
    ref: 'A12',
    level: 'INFO',
    message:
      'package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md',
  });
}

// ─────────────────────────────────────────────────────────────────────────
// A13 — Crash boundaries explicit. Detect raw `process.exit` / `Deno.exit`
// outside of `bin/`.
// ─────────────────────────────────────────────────────────────────────────
for (const f of tsFiles) {
  const text = await readText(f);
  if (/(?:Deno\.exit|process\.exit)\s*\(/.test(text) && !relative(ROOT, f).startsWith('bin/')) {
    findings.push({
      ref: 'A13',
      level: 'WARN',
      message:
        `Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead`,
      path: relative(ROOT, f),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// A14 — Tests preserve doctrine. Detect Jest leftovers / forbidden patterns.
// ─────────────────────────────────────────────────────────────────────────
const testFiles: string[] = [];
for await (
  const entry of walk(ROOT, {
    match: [/_test\.ts$/, /\.test\.ts$/],
    skip: [/node_modules/],
  })
) testFiles.push(entry.path);
for (const f of testFiles) {
  const text = await readText(f);
  // Match only *bare* Jest/Vitest globals, never method invocations: a leading
  // `.` or word char means it is a method call (e.g. the `defineAiTool(...)
  // .describe(...)` fluent tool builder), not a forbidden test global.
  if (/(?<![.\w])(?:describe|it|expect|jest|vitest)\s*\(/.test(text)) {
    findings.push({
      ref: 'A14',
      level: 'FAIL',
      message: 'Jest/Vitest globals (describe/it/expect) — only Deno.test allowed',
      path: relative(ROOT, f),
    });
  }
  if (
    /Deno\.test\s*\(\s*["']\s*(?:should work|happy path|basic|works|test\s*\d+)["']/i.test(text)
  ) {
    findings.push({
      ref: 'A14',
      level: 'WARN',
      message:
        'test name lacks behavioural specificity — name as "<symbol>: <condition> <expectation>"',
      path: relative(ROOT, f),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// AP-15 / F-12 — `IFoo` Hungarian prefix
// ─────────────────────────────────────────────────────────────────────────
for (const f of tsFiles) {
  const text = await readText(f);
  text.split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(/\b(?:interface|type)\s+(I[A-Z][A-Za-z0-9_]*)\b/g)) {
      findings.push({
        ref: 'AP-15/F-12',
        level: 'FAIL',
        message: `forbidden I-prefix declaration ${m[1]}`,
        path: relative(ROOT, f),
        line: i + 1,
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────
// F-5 / F-6 — `default` export hurts public-surface docs and JSR publishability
// ─────────────────────────────────────────────────────────────────────────
for (const f of tsFiles) {
  const text = await readText(f);
  text.split(/\r?\n/).forEach((line, i) => {
    if (/^export\s+default\b/.test(line)) {
      findings.push({
        ref: 'F-5/F-6',
        level: 'WARN',
        message: '`export default` — JSR penalises (no auto-doc); use named exports',
        path: relative(ROOT, f),
        line: i + 1,
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────
// A1 / F-5 — `any` in published surface
// ─────────────────────────────────────────────────────────────────────────
for (const f of tsFiles) {
  if (relative(ROOT, f).startsWith('src/internal/')) continue;
  const text = await readText(f);
  text.split(/\r?\n/).forEach((line, i) => {
    if (
      /^export\s+(?:async\s+)?function[^{(]*:\s*any\b/.test(line) ||
      /^export\s+(?:async\s+)?function[^{(]*\([^)]*:\s*any\b/.test(line) ||
      /^export\s+(?:type|interface)\s+\w+[^=]*=[^=]*\bany\b/.test(line)
    ) {
      findings.push({
        ref: 'A1/F-5',
        level: 'WARN',
        message: '`any` in exported declaration — use `unknown` or a specific type',
        path: relative(ROOT, f),
        line: i + 1,
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────
// AS7 auth doctrine gates — public surface, port factories, casts, and contracts.
// These are intentionally scoped to the finished auth layer so broad historical
// doctrine debt elsewhere in the repo does not redline this slice.
// ─────────────────────────────────────────────────────────────────────────
const AUTH_SURFACE_ROOTS = [
  'packages/plugin-auth-core',
  'packages/auth-workos',
  'packages/auth-better-auth',
  'packages/auth-kv-oauth',
  'plugins/auth',
  'packages/service/src/auth',
];

const AUTH_BACKEND_FACTORIES = [
  {
    path: 'packages/auth-workos/src/workos-backend.ts',
    name: 'createWorkosBackend',
    returnType: 'AuthBackendPort',
  },
  {
    path: 'packages/auth-better-auth/src/better-auth-backend.ts',
    name: 'createBetterAuthBackend',
    returnType: 'AuthBackendPort',
  },
  {
    path: 'packages/auth-kv-oauth/src/backend.ts',
    name: 'createKvOAuthBackend',
    returnType: 'Promise<KvOAuthBackend>',
  },
];

const authScanFiles: string[] = [];
for await (
  const entry of walk(ROOT, {
    match: [/\.ts$/],
    skip: [/node_modules/, /src\/scaffold\/templates\//, /_fresh/, /\.deploy/],
  })
) authScanFiles.push(entry.path);

const authFiles = authScanFiles
  .map((path) => ({ path, repoPath: relative('.', path) }))
  .filter((file) => AUTH_SURFACE_ROOTS.some((root) => file.repoPath.startsWith(`${root}/`)));

if (authFiles.length > 0) {
  const contractTestPath = 'packages/plugin-auth-core/src/contracts/v1/auth.contract_test.ts';
  if (!(await exists(contractTestPath))) {
    findings.push({
      ref: 'AS7/F-AUTH-CONTRACT',
      level: 'FAIL',
      message: 'auth oRPC contract compile-time regression test is missing',
      path: contractTestPath,
    });
  }

  for (const file of authFiles) {
    const text = await readText(file.path);
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      const lineNumber = index + 1;
      const codeLine = stripStringLiterals(line.replace(/\/\/.*$/, ''));
      const isAllowedContractCast = file.repoPath ===
          'packages/plugin-auth-core/src/contracts/v1/auth.contract.ts' &&
        /\}\s+as\s+unknown\s+as\s+Parameters\s*<\s*typeof\s+oc\.errors\s*>\s*\[0\]/.test(
          codeLine,
        );
      const isAllowedRouterAny = file.repoPath === 'plugins/auth/services/src/router.ts' &&
        (/\bas\s+any\b/.test(codeLine) || /:\s*any\b/.test(codeLine));
      if (
        !/^\s*(?:\*|\/\*|\/\/|import\b|export\s+\{)/.test(line) &&
        !/^\s*(?:type\s+)?[A-Za-z0-9_]+\s+as\s+[A-Za-z0-9_]+,?\s*$/.test(line) &&
        /\bas\s+(?!const\b)(?:unknown\s+as\s+|never\b|any\b|[A-Za-z_{[(])/.test(codeLine) &&
        !isTestPath(file.repoPath) &&
        !isAllowedContractCast &&
        !isAllowedRouterAny
      ) {
        findings.push({
          ref: 'AS7/F-AUTH-CAST',
          level: 'FAIL',
          message:
            'auth layer permits only the centralized contract cast and the router any exemplar',
          path: file.repoPath,
          line: lineNumber,
        });
      }
      if (/@ts-(?:ignore|expect-error|nocheck|check)\b/.test(line) && !isTestPath(file.repoPath)) {
        findings.push({
          ref: 'AS7/F-AUTH-CAST',
          level: 'FAIL',
          message: 'auth layer must not use @ts-* directives',
          path: file.repoPath,
          line: lineNumber,
        });
      }
      if (/&\s*Record\s*<\s*string\s*,\s*unknown\s*>/.test(codeLine)) {
        findings.push({
          ref: 'AS7/F-AUTH-CAST',
          level: 'FAIL',
          message: 'auth layer must not widen contract types with & Record<string, unknown>',
          path: file.repoPath,
          line: lineNumber,
        });
      }
      if (/from\s+['"]@netscript\/[^'"]+\/src\//.test(codeLine)) {
        findings.push({
          ref: 'AS7/F-AUTH-IMPORT',
          level: 'FAIL',
          message: 'auth layer must import internal packages through public entrypoints/subpaths',
          path: file.repoPath,
          line: lineNumber,
        });
      }
      if (/\babstract\s+class\b/.test(codeLine)) {
        findings.push({
          ref: 'AS7/F-AUTH-INHERITANCE',
          level: 'FAIL',
          message: 'auth backend and port layer uses structural ports, not inheritance',
          path: file.repoPath,
          line: lineNumber,
        });
      }
    }
  }

  for (const factory of AUTH_BACKEND_FACTORIES) {
    const factoryText = await readText(factory.path);
    const declaration = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${factory.name}\\s*\\([^)]*\\)\\s*:\\s*${
        factory.returnType.replace(/[()<>]/g, String.raw`\$&`)
      }`,
      's',
    );
    if (!declaration.test(factoryText)) {
      findings.push({
        ref: 'AS7/F-AUTH-BACKEND-FACTORY',
        level: 'FAIL',
        message:
          `${factory.name} must declare : ${factory.returnType} so backend factories satisfy AuthBackendPort without return casts`,
        path: factory.path,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Roll-up
// ─────────────────────────────────────────────────────────────────────────
const summary = {
  root: ROOT,
  pkg: pkgName,
  totals: {
    fail: findings.filter((f) => f.level === 'FAIL').length,
    warn: findings.filter((f) => f.level === 'WARN').length,
    info: findings.filter((f) => f.level === 'INFO').length,
  },
  findings,
};

if (args.out) {
  await Deno.mkdir((args.out as string).split('/').slice(0, -1).join('/'), { recursive: true });
  await Deno.writeTextFile(args.out as string, JSON.stringify(summary, null, 2));
}

if (args.text || !args.out) {
  console.log(`# Doctrine readiness — ${pkgName}`);
  console.log(
    `  FAIL=${summary.totals.fail} WARN=${summary.totals.warn} INFO=${summary.totals.info}`,
  );
  for (const f of findings) {
    console.log(
      `  ${f.level} ${f.ref}: ${f.message}${
        f.path ? ` (${f.path}${f.line ? ':' + f.line : ''})` : ''
      }`,
    );
  }
}

if (summary.totals.fail > 0) Deno.exit(1);
