# Context pack — #1466 `NetScriptProcedureMeta`

**Read this first, then `worklog.md`'s tail, then `evaluate.md` (both cycles), then `drift.md`.**
Rewritten at the slice-1 `PASS` to close IMPL-EVAL cycle-2 finding **G-3**: the previous version
still described the cycle-3 head, still called `commonErrorMap` public, and still said IMPL-EVAL had
not run. A resumer reading it alone would have reintroduced the exact premise F-1 was raised to kill.

## Current state

| Field | Value |
| --- | --- |
| Branch | `feat/sdk-procedure-meta`, PR **#1731**, OPEN **draft** |
| Evidence head | `ff4e81cc` — cycle-2 IMPL-EVAL verdict, evidence-only |
| **Content head** | **`42874803e572a5746834880e387501f0948c7362`** — product is byte-identical from here to `ff4e81cc` (`git diff 42874803..ff4e81cc -- packages plugins docs templates` is empty) |
| Base | `21d516224`; `origin/main` `13878a80a` — drift measured inert |
| PLAN-EVAL | cycle 2 `PASS` |
| IMPL-EVAL cycle 1 | **`FAIL_FIX`** — rulings R-1/R-2/R-3, findings F-1…F-5 |
| IMPL-EVAL cycle 2 | **`PASS`** — slice 1 terminal on substance; failure count 1 of 2 |
| Supervisor Tier-A | `ACCEPTED_WITH_FINDINGS` on cycle 4 (AF-1, closed in cycle 5) |
| Labels | exactly one `status:impl-eval` on **both** PR #1731 and issue #1466 |
| Issue reference | **`Refs #1466` — partial, slice 1 of 3.** The closing keyword was removed; it must not return until all three slices land. |

## Slice state — slice 1 of three is done; **2 and 3 are NOT RUN**

- **S1 Contracts vocabulary + builder soundness — COMPLETE**, IMPL-EVAL `PASS`.
- **S2 SDK declaration propagation — NOT RUN.** Direct client, `defineServices` generated client and
  query-factory declarations must retain exact metadata and error literals with no metadata-boundary
  assertion or `any`; `ActionMethod` marker; SDK assertion-budget and doc-json independence tests.
  **S2 also carries G-1.**
- **S3 Publish and compatibility evidence — NOT RUN.** Isolated declarations, export maps, exact
  `@netscript/*` pins. **S3 also carries G-4.**
- Then a **final all-slices separate-session IMPL-EVAL** and the close-gate.

## What is implemented (slice 1 only)

- NetScript-owned authentication and procedure-metadata types with **zero imports**
  (`src/domain/procedure-meta.ts`), exported via `public/mod.ts`.
- `BaseContractMeta = NetScriptProcedureMeta & Record<never, never>` in the base builder annotation
  and both route aliases.
- `BaseContractErrors = MergedErrorMap<Record<never, never>, CommonErrorMap>` — references the
  **public type**, not `typeof commonErrorMap`.
- **`commonErrorMap` is PRIVATE.** It was briefly exported to clear a doc-lint finding; IMPL-EVAL
  ruled that unacceptable (R-2/F-1, an unfrozen mutable singleton backing every route) and the value
  export was withdrawn. `CommonErrorMap` (the type) stays public. **Do not re-export the value.** If a
  consumer need is ever stated, it ships frozen per doctrine 04 — not "read-only by contract".
- Real-export positive/negative fixtures, runtime metadata storage test, contracts assertion-budget
  scanner, doc-JSON independence test.
- An **initializer source-text pin** in `assertion-budget_test.ts` requiring the stripped source of
  `contract-primitives.ts` to contain `oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)`
  exactly once. It is a real tripwire (red under both perturbation B and B2) but **file-wide, not
  anchored to the declaration** — a dead decoy carrying the text defeats it. That is **G-1**, low and
  forgery-only, and slice 2 fixes it by anchoring the regex to `export const baseContract`.
- Contracts README/JSDoc ownership and additive-compatibility docs; the contracts reference inventory
  documents the branch-added public symbols.

## Gate state at the content head

Eight named receipts under `receipts/`, `gitHead == actualGitHead`:

- **PASS**: `check`, `lint`, `fmt-check`, `quality-gate`, `arch-check`, `publish-dry-run`.
- **`public-doc-lint` FAIL — baseline-red on `main`, delta 0.** `main` 12 findings, head 12, nine
  identical; `main`-only `{BaseContractRoute→BaseContractErrors, BaseContractOutputRoute→BaseContractErrors,
  baseContract→oc}`, head-only `{BaseContractErrors→MergedErrorMap, baseContract→ContractBuilder,
  baseContract→Schema}`. **Any future head must keep count 12 and this exact set** (R-1). Do not try
  to "fix" it; the residuals are irreducible upstream references and AP-14 forbids re-exporting them.
- **root `test`** — see the host note below.

Supplemental (R-3): `deno task docs:exports-drift` **exit 0**;
`deno test --allow-all packages/contracts` **16 passed / 0 failed**.

Archives are **append-only**: `receipts/frozen-c9a391811/` and `receipts/frozen-235482767/`, both
verified byte-intact and never modified or deleted.

## The host defect behind D-26/R-1 is FIXED — read this before citing the old ruling

R-1 ruled root `test` a host baseline because `hybrid-launcher_test.ts:167` tests liveness with
`Deno.kill(pid, 0)` and PID 1 was not reaping, so thousands of zombies answered and the assertion
could never pass. **That is no longer true**: PID 1 is now `tini` and the zombie count is **0**
(was ~7,900). Root `deno task test` now runs green — **4250 passed / 0 failed / 19 ignored, exit 0**
— and the receipt has been re-cut from the earlier `SKIPPED` form.

So R-1's "no further retries on this host" condition is **void, because its premise is gone**. Do not
cite it to avoid running the gate. R-1's `public-doc-lint` half is unaffected and still stands.

**Still broken:** `fs.inotify.max_user_instances` is 128, so `.llm/tools/harness/watch-run.ts` dies
in `Deno.watchFs` and the token-free supervisor wake is unavailable (D-29). Supervision polls instead.

## Resume point

1. Verify heads yourself: `git rev-parse HEAD`, `origin/feat/sdk-procedure-meta`, PR `headRefOid`.
2. **Dispatch slice 2** (SDK declaration propagation + **G-1**) — own content head, own Tier-A, own
   exact-head receipt set, `docs:exports-drift` as named supplemental evidence (R-3).
3. **Then slice 3** (publish/compatibility evidence + **G-4**: the `CommonErrorMap` docs row and
   `{@link commonErrorMap}` JSDoc still point at a now-private symbol).
4. **Then the final all-slices separate-session IMPL-EVAL**, then the close-gate.
5. **Do not** flip ready, merge, or restore a closing keyword until all three slices land and the
   close-gate passes. Root `test` must also be green off this host (CI matrix on ready-flip).
