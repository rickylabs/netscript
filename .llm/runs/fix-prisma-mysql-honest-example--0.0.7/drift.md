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
  adds joined `ssl.ca` when custom CAs are non-empty and does not enable mysql2 hostname identity
  verification.
- **Source:** `packages/prisma-adapter-mysql/src/types.ts:23-29`;
  `packages/prisma-adapter-mysql/src/adapter.ts:725-743`; installed mysql2 3.22.5 `SslOptions`.
- **Expected:** Every advertised option has observable behavior matching its name.
- **Actual at base:** Without non-empty `caCerts`, `ssl` is left unset, so the connection is
  plaintext and no TLS is requested. With non-empty `caCerts`, only joined `ssl.ca` is forwarded;
  mysql2 hostname identity verification is not enabled.
- **Severity:** significant
- **Action:** deprecate the existing public member and document/characterize its exact legacy
  behavior without changing runtime semantics.
- **Resolution design:** add a JSDoc `@deprecated` tag in the existing `src/types.ts` surface and
  aligned documentation; direct-test both legacy translator branches through the source-only export.
  Do not add a replacement mode or change the generated mysql2 options.
- **Boundary:** no public-barrel export and no runtime injection port.
- **Deferred:** any behavior change or removal requires a separately scoped breaking change.

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

## 2026-08-28 — Artifact allowlist omitted harness supervisor bootstrap, then was amended

- **What:** Harness activation requires `supervisor.md`, but the original leaf grant allowed
  creation of only `research.md`, `plan.md`, `context-pack.md`, `worklog.md`, and `drift.md` in this
  run dir.
- **Source:** user task artifact allowlist versus `.llm/harness/workflow/activation.md` mandatory
  artifact list.
- **Expected:** Activated run includes `supervisor.md`.
- **Actual at discovery:** Creating it would have violated the explicit turn contract, so the file
  was not created and the omission was recorded here and in `context-pack.md`.
- **Severity:** significant
- **Initial action:** Preserve the five-file allowlist and record the activation variance rather
  than silently exceeding scope or claiming a waiver.
- **Coordinator ruling:** No waiver. The allowlist was amended by exactly one control-plane path,
  `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/supervisor.md`. This is not an eighth product
  path and does not widen the seven-path product envelope.
- **Resolution:** Resolved by the bounded allowlist amendment. `supervisor.md` now pins topic and
  leaf ownership, author route, seven-path ceiling, stop line, TLS ruling, seam boundary, both
  Tier-A passes, and the reverted lock-probe history.
- **Current evidence:** the run directory contains the six authorized harness artifacts, including
  the mandatory supervisor identity record. No product path or `deno.lock` was changed.

## 2026-08-28 — PLAN-EVAL cycle 1 rejected the unresolved generated-client import

- **What:** PLAN-EVAL cycle 1 returned `FAIL_PLAN` at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`. D3
  named a “real generated client” but neither fixed the package example's import specifier nor
  proved that the actual file could resolve it without an eighth committed path.
- **Source:** fresh opposite-family evaluator comment on draft PR #1711, F1; evaluator also returned
  F2 (hard-coded driver-claim count), F3 (missing research/plan PR comments), and F4 (incomplete JSR
  audit path).
- **Severity:** blocking plan defect for F1; advisory record/gate defects for F2-F4.
- **Probe:** In a detached scratch worktree at the evaluated head, the prospective actual example
  imported exactly `./.generated/client.ts`. An uncommitted `.llm/tmp` schema generated a real
  Prisma 7.8.0 Deno client into that location, and the structured actual-file checker was used as
  the verdict source. No ambient declaration, `// @ts-ignore`, or ungenerated `@prisma/client` `any`
  stub was used.
- **Finding inside F1:** The real client rejected `PrismaMySqlAdapterFactory` because
  `PrismaMySqlResultSet.columnTypes` was declared as `number[]`, wider than Prisma's
  `SqlResultSet.columnTypes`. The implementation already maps to Prisma column types.
- **Resolution design:** Keep exact `./.generated/client.ts`; generate it only as uncommitted gate
  output from `.llm/tmp`; narrow the declaration in approved `src/adapter.ts` to
  `SqlResultSet['columnTypes']`. The same structured check then exited 0 with one selected file and
  zero diagnostics. No runtime behavior changes.
- **Scope result:** The seven approved paths are sufficient. No schema, generated client, import
  map, config, or other eighth product path is added. The detached scratch worktree and generated
  output were removed, and the leaf worktree/lock remained clean.
- **Other repairs:** Census acceptance now applies every `Correct`/`Delete` table row and permits
  only the legacy debug namespace to remain; the JSR gate names
  `.llm/tools/fitness/audit-jsr-package.ts`; research and plan PR comments are required on the
  repaired head.
- **Stop line:** Cycle 2 has not been launched. Formal PLAN-EVAL remains selected for #1112 under
  the critical/complex/decision-heavy policy, pending a separate coordinator grant; no product
  implementation is authorized.
