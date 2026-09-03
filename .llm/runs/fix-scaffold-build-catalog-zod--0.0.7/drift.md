# Drift Log: scaffold Fresh production build catalog resolution

No drift recorded. Append entries only when implementation reality diverges from the locked plan,
issue contract, brief ceiling, or doctrine.

## 2026-09-03 — Prisma rejects a non-empty seeded output directory

- **What:** The first GREEN consumer codegen attempt rejected `.generated` because the newly seeded
  `zod/crud.ts` left Prisma's output directory non-empty after the existing seeded-client cleanup.
- **Source:** Exact post-init `deno task db:generate`, exit 1.
- **Expected:** Plan D3 expected real codegen to overwrite the seeded Zod barrel.
- **Actual:** Prisma validates its output directory before the later Zod-barrel writer runs.
- **Severity:** minor
- **Action:** fix — extend the existing pre-generation cleanup task to remove both known scaffold
  placeholders and the empty seeded Zod directory, without recursively deleting generated/user files.
- **Evidence:** Raw error: `.generated exists and is not empty but doesn't look like a generated Prisma Client`.

## 2026-09-03 — requested CLI lint/fmt wrappers are excluded by root policy

- **What:** The exact requested `--root packages/cli --ext ts,tsx` lint and format wrappers refuse
  coverage because root `deno.json` excludes the entire `packages/cli/` tree from both tools.
- **Source:** Required local lint/fmt gate commands, each exit 2.
- **Expected:** Plan validation rows expected both wrappers to exit 0.
- **Actual:** Lint selected 979 files, processed 233, and dropped the rest; fmt reported the same
  policy exclusion class with zero findings. Direct one-file probes return `No target files found.`
- **Severity:** baseline
- **Action:** record — changing root validation policy is outside this issue's ceiling. Supplemental
  `deno lint --no-config` passed all six changed TypeScript files. A no-config format check reported
  only two pre-existing formatter deltas outside this patch's changed lines.
