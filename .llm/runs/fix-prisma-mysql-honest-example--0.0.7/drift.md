# Drift Log: prisma-mysql-honest-example (#1112)

No other lane's artifact was edited. This record incorporates the coordinator amendment in place as
explicitly directed; it does not leave the superseded envelope as the current plan.

## 2026-08-28 — Coordinator widened the product envelope 5 → 7

- **What:** The coordinator added `packages/prisma-adapter-mysql/examples/basic-usage.ts` and
  `packages/prisma-adapter-mysql/tests/connection_errors_test.ts` to the frozen product envelope.
- **Source:** coordinator exact-main audit at `cf648f1ff973d74c213bb125a6f5f5b9328e693b`.
- **Reason:** The checked-in example repeats the false Deno-driver story, comments out every Prisma
  operation, substitutes a connected-adapter raw query, and manually disposes it. The existing
  connection-error test already owns injected `FakePoolClient` cleanup behavior and is therefore the
  non-duplicative home for mapping and successful-close evidence.
- **Previous constraint:** The example and focused test were outside the authorized product set, so
  acceptance rows 2 and 5 could not be completed honestly.
- **Current constraint:** Exactly seven named product paths are authorized. An eighth product path
  is still a hard rescope.
- **Severity:** significant
- **Action:** accepted and incorporated
- **Evidence:** `research.md` rows 39-49; direct base example check selected 1 file with zero
  diagnostics while Prisma code remained comments; focused base test passed 33/33 without mapping or
  positive close-count assertions.

## 2026-08-28 — TLS identity mode is accepted but not implemented as named

- **What:** `MySqlConnectionConfig.tls.mode` accepts `'verify_identity'`, but base translation only
  adds `ssl.ca` when custom CAs are non-empty and never sets mysql2 `ssl.verifyIdentity: true`.
- **Source:** `packages/prisma-adapter-mysql/src/types.ts:23-29`;
  `packages/prisma-adapter-mysql/src/adapter.ts:725-743`; installed mysql2 3.22.5 `SslOptions`.
- **Expected:** Every advertised option has observable behavior matching its name.
- **Actual at base:** The mode over-promises identity verification; without non-empty CAs it is a
  silent no-op.
- **Severity:** significant
- **Action:** owned by amended plan
- **Resolution design:** always set `verifyIdentity: true` for the mode; add joined `ca` only when
  supplied; direct-test the pure translator through a source-only export.
- **Boundary:** no public-barrel export and no runtime injection port.

## 2026-08-28 — Exact-pin mysql2 probe transiently modified `deno.lock`

- **What:** The explicit exact-pin mysql2 import probe transiently added this resolution beside the
  existing `npm:mysql2@^3.22.5` entry: `"npm:mysql2@3.22.5": "3.22.5_@types+node@25.9.3",`.
- **Cause:** The worktree was clean before probing; `deno info npm:mysql2@3.22.5` requested the
  exact specifier represented by the added lock entry. This side effect was caused by this research
  turn, not carried in from another owner.
- **Detection:** Existing gate 15, the direct git/lock/path truth check, reported `deno.lock` in
  `git status` and `git diff --name-only` before staging or commit.
- **Action:** Inspected the one-line diff, removed only that generated exact-pin entry, and reran
  the direct comparison against immutable base `cf648f1ff973d74c213bb125a6f5f5b9328e693b`.
- **Final state:** `deno.lock` was byte-identical to base before every commit and never entered the
  branch history. No lockfile or cache was deleted.
- **Severity:** transient process side effect
- **Prevention:** Keep gate 15 as written and run future exact dependency probes with lock writes
  disabled or from an isolated scratch context.

## 2026-08-28 — Explicit artifact allowlist overrides harness supervisor bootstrap

- **What:** Harness activation normally requires `supervisor.md`, but the leaf grant allows creation
  of only `research.md`, `plan.md`, `context-pack.md`, `worklog.md`, and `drift.md` in this run dir.
- **Source:** user task artifact allowlist versus `.llm/harness/workflow/activation.md` mandatory
  artifact list.
- **Expected:** Activated run includes `supervisor.md`.
- **Actual:** Creating it would violate the explicit turn contract.
- **Severity:** significant
- **Action:** accept
- **Evidence:** the run directory contains exactly the five authorized harness artifacts. Evaluator
  routing is stated in plan/worklog instead; this generator does not launch PLAN-EVAL.
