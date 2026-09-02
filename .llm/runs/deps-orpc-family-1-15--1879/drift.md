# Drift Log: oRPC family 1.15.0

## 2026-09-01 — Strict lock-only scope cannot satisfy the single-copy gate

- **What:** The current tree contains exact `1.14.6` source imports and generated/scaffold source
  specifiers, while `packages/plugin-workers-core/deno.json` is explicitly prohibited from editing.
- **Source:** Root `deno task test` after raising owned manifest ranges; targeted
  `deno update --lockfile-only` after restoring manifests.
- **Expected:** All oRPC v1 packages resolve at `1.15.0`, root gates pass, and no source or
  #1876-owned manifest changes are needed.
- **Actual:** Raised manifests make tests fail on the prohibited manifest and scaffold source;
  restored manifests make the exact compatibility-fixture imports retain `1.14.6`, yielding two
  `@orpc/shared` copies. Explicit lock-only updates report `Updated 0 dependencies`.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** Root test exit 1 (4 conflicting-import failures plus one scaffold catalog mismatch);
  `deno update --lockfile-only` exit 0 with `Updated 0 dependencies`; `deno why @orpc/shared`
  shows `1.14.6` and `1.15.0` after the valid regenerated lock.

## 2026-09-01 — Corrected key-level manifest boundary

- **What:** The owner corrected the #1876 overlap from file ownership to key ownership.
  `@orpc/contract` and `@orpc/server` in `packages/plugin-workers-core/deno.json` belong to #1879;
  only `@netscript/plugin-streams-core` keys in that manifest and `plugins/triggers/deno.json`
  remain owned by #1876.
- **Source:** Owner follow-up in the active harness thread.
- **Expected:** The original brief prohibited the whole manifests.
- **Actual:** All manifest `@orpc/*` keys are authorized for this slice; streams-core keys remain
  prohibited.
- **Severity:** significant
- **Action:** accept
- **Evidence:** Raised `packages/plugin-workers-core/deno.json` oRPC keys to `^1.15.0`; no
  streams-core or source line changed.

## 2026-09-01 — Exact SDK fixture decision remains owner-escalated

- **What:** `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` imports
  `npm:@orpc/client@1.14.6` and `npm:@orpc/tanstack-query@1.14.6` exactly.
- **Source:** Owner follow-up and focused source enumeration.
- **Expected:** No source changes in this implementation pass.
- **Actual:** Whether the fixture is an intentional upstream-compatibility oracle is unresolved and
  expressly reserved for the owner.
- **Severity:** significant
- **Action:** defer
- **Evidence:** The file remains byte-for-byte untouched.

## 2026-09-01 — Raised manifests leave stale 1.14.6 lock package keys

- **What:** After every manifest oRPC key was raised and `deno install --lockfile-only` exited 0,
  the lock still retained old package keys. `deno why` labels `@orpc/shared@1.14.6` as having no
  dependency path, but the exact no-mixed audit still finds five package names at two versions.
- **Source:** Post-correction load-bearing proof commands.
- **Expected:** Exactly one `@orpc/shared@1.15.0` copy and one version per oRPC package.
- **Actual:** Mixed keys remain for `client`, `shared`, `standard-server`,
  `standard-server-fetch`, and `standard-server-peer`.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `deno why @orpc/shared` captured exit 0; no-mixed audit captured exit 1. Per owner
  instruction, stopped before manual pruning, frozen install, check, or a new test run.

## 2026-09-01 — Coordinator approved upstream-tracking fixture update

- **What:** The coordinator ruled that the two exact oRPC imports in
  `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` track current upstream
  compatibility rather than intentionally freezing 1.14.6.
- **Source:** Owner ruling in the active harness thread, supported by the fixture history at
  `82abaa6a1` and `6e2f66b95`.
- **Expected:** The earlier brief prohibited all source edits and therefore left an exact 1.14.6
  lock root after every manifest key moved.
- **Actual:** The two exact imports are now explicitly in scope at 1.15.0; no behavioral source is
  authorized.
- **Severity:** significant
- **Action:** accept
- **Evidence:** The targeted type fixture check exits 0 at 1.15.0; the regenerated lock has only
  1.15.0 oRPC package keys.

## 2026-09-01 — Lock-only framing originated in the brief

- **What:** The initial `lock-only` constraint was incompatible with the load-bearing single-copy
  acceptance gate because workspace ranges and exact fixture imports still selected 1.14.6.
- **Source:** Initial owner brief; disproved by the implementation investigation.
- **Expected:** `deno update --lockfile-only` would move the family without manifest or fixture
  edits.
- **Actual:** With the original carets restored the command exited 0 with `Updated 0 dependencies`;
  raising every dependency declaration was required. This was scope drift in the brief, not an
  implementation assumption or analysis error.
- **Severity:** significant
- **Action:** accept
- **Evidence:** Captured lock-only exit 0/zero-update result, corrected owner ruling, and final
  single-copy/no-mixed/frozen-install proofs.

## 2026-09-01 — Scaffold catalog was direct dependency-catalog fallout

- **What:** After the complete manifest and fixture move, the root suite had one failure in
  `packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog_test.ts`, test
  `scaffold runtime npm imports match workspace, Fresh, and SDK catalogs`.
- **Source:** Root `deno task test` after the coordinator-approved scope correction.
- **Expected:** Generated scaffold dependency declarations match the root catalog.
- **Actual:** Six oRPC-only scaffold catalog constants still declared `^1.14.6`.
- **Severity:** local
- **Action:** accept
- **Evidence:** Updating only those six dependency catalog constants to `^1.15.0` made the focused
  test pass (2/2) and the full root suite pass (4,639 passed, 0 failed, 19 ignored). No behavioral
  failure remained and no behavioral source was changed.

## D — `packages/fresh-ui/deno.lock`: a private lock the family sweep missed (CI-caught, real)

**What happened.** After convergence at `73c554a08`, `fresh-ui-quality` failed:
`Fresh UI private lock is stale`. `packages/fresh-ui` keeps its **own** `deno.lock` and runs its
gates with `--lock=deno.lock --frozen`; it declares no `@orpc` dependency itself, so its oRPC ranges
arrive through the root catalog this slice raised. Its private lock still requested
`@orpc/*@^1.14.6` while the catalog required `^1.15.0`.

**Framing correction (delta IMPL-EVAL, low finding — accepted).** An earlier version of this entry
called `packages/fresh-ui` "not a root workspace member — a standalone package". **That was wrong.**
It *is* a member: the root workspace uses the glob `packages/*`, and the package appears in both
locks' 37-member mirrors with a `catalog:` reference in its `package.json`. The supervisor's
membership check tested for an explicit literal entry and so missed the glob.

The correct defect class is broader and worth stating precisely, because the wrong framing would have
under-scoped future sweeps: **a second `--lock=deno.lock` lockfile covering the same workspace
graph.** Such a file mirrors every member's dependency declarations, so it goes stale whenever the
catalog or any member manifest moves — regardless of whether the package owning it declares the
dependency itself.

**Why neither the author nor the evaluator caught it.** The family-completeness proof enumerated the
**32 root-workspace manifest keys** and the root `deno.lock`. A *second lockfile* over the same graph
is not a manifest key and is not the root lock, so it fell outside the enumeration entirely — a
complete-looking sweep was still incomplete. This is the
blocking instance of the same class as the evaluator's medium finding (caret-pinned literals
desyncing from the catalog) — that finding described a latent variant; this one was load-bearing.

**Fix.** Regenerated exactly as the gate prescribes —
`deno task --cwd packages/fresh-ui lock:update` — `LOCK_UPDATE_REAL_EXIT=0`, type check 150 files /
0 occurrences. No hand-editing.

**Confinement proven, not asserted.** Every package whose version moved is inside the oRPC closure:

| Package | Before → after | Pulled by |
| --- | --- | --- |
| `@orpc/*` (all) | `1.14.6`/`1.14.8` → `1.15.0` | the slice's own move |
| `@opentelemetry/api-logs`, `@opentelemetry/instrumentation` | `0.220.0` → `0.221.0` | `@orpc/otel@1.15.0` |
| `type-fest` | `5.7.0` → `5.8.0` | `@orpc/shared@1.15.0` |
| `import-in-the-middle` | `3.3.1` → `3.3.3` | `@opentelemetry/instrumentation` |
| `cjs-module-lexer`, `es-module-lexer` | `2.2.0`→`2.2.1`, `2.3.1`→`2.3.2` | `import-in-the-middle` |

No package outside that closure changed. Post-fix in the private lock: `@orpc/shared` resolves to
**exactly one** copy at `1.15.0`, **zero** residual `1.14.x` entries, and the frozen gate passes —
`FRESHUI_FROZEN_CHECK_REAL_EXIT=0`.

**Head impact.** This is content the IMPL-EVAL did not see; its family-completeness verification is
now known to have had this hole. The head moves off the evaluated `1914a38c6`/`73c554a08`, so a
bounded delta evaluation is owed before this is presented as a merge packet.

**Delta IMPL-EVAL: PASS** (`delta-impl-eval.md`). It re-derived every load-bearing claim rather than
accepting this entry's: the convergence merge's root-lock delta is byte-exactly the one
`jsr:@netscript/config@0.0.6` line with the `@orpc` set untouched; the fresh-ui version-move set (23
names, machine-diffed and reverse-dependency-checked) sits entirely inside the oRPC closure and
matches the table above row for row; the frozen check passes with an unchanged lock hash, a single
`@orpc/shared@1.15.0` and zero `1.14.x` residue.

**Q4 — no third stale surface exists.** The repo-wide sweep for other surfaces of the second-lockfile
class found none. Two further disclosures worth carrying:

- The regen's diff also contains 7 first-party workspace-mirror lines (6 × `plugin-streams-core@0.0.6`
  from #1876, 1 × `config@0.0.6` from #1874) with **no** third-party drift; the mirrors match the root
  lock exactly. The confinement table above is a *version-move* table and remains accurate as such.
- Fresh-ui's private lock had itself been carrying the two-copy `@orpc/shared` hazard
  (`1.14.6` + `1.14.8`) until this fix — so the regeneration removed a real duplicate, not just a
  gate complaint.

**Latent recurrence, filed as follow-up:** `fresh-ui-quality` does not trigger on member-manifest or
root-`deno.lock` changes, yet the private lock mirrors all 37 members' declarations. A
member-manifest-only PR can therefore stale it without the gate ever running. This slice was caught
only because its catalog raise touched root `deno.json`.
