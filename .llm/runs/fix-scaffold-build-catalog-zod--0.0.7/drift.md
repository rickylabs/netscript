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

## 2026-09-03 — emitted cleanup referenced a non-existent Deno error class

- **What:** Hosted e2e-cli run 33706833254 failed all three tiers because the generated cleanup
  script referenced `Deno.errors.DirectoryNotEmpty`, which is absent from Deno 2.9.
- **Source:** Supervisor steer plus `generated.service-check` in scaffold-static/runtime tiers.
- **Expected:** The generated cleanup script would type-check and ignore a non-empty Zod directory.
- **Actual:** TypeScript failed first with TS2339, before the cleanup behavior could run.
- **Severity:** minor
- **Action:** fix — remove the generated Zod directory recursively and treat only `NotFound` as
  benign. Add an emitted-sample `deno check --no-config --no-lock` assertion so future invalid
  `Deno.errors` members fail the focused scaffolder test.
- **Evidence:** The new test reproduced TS2339 at the prior head; the exact local
  `scaffold.service` tier then passed all 5 gates, including `generated.service-check`.
