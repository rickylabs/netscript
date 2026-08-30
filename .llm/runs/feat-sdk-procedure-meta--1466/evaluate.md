# Evaluation: #1466 `NetScriptProcedureMeta` — slice 1 (PR #1731)

## Metadata

| Field          | Value                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run ID         | `feat-sdk-procedure-meta--1466`                                                                                                                             |
| Target         | Slice 1 — contracts vocabulary + builder soundness, plus its three repair cycles. Slices 2 and 3 are NOT RUN and are not evaluated here.                     |
| Archetype      | 2 — Integration (`packages/sdk`, governing); `packages/contracts` portion Archetype 1                                                                        |
| Scope overlays | docs (package README/JSDoc + `docs/site/reference/contracts/index.md` inventory only)                                                                       |
| Evaluator      | Claude Fable 5 · medium, `formal_impl_evaluation` lane (`lane-policy.md:46`), fresh separate session, 2026-08-30. Generator: Codex `gpt-5.6-sol` thread `01a0515c`. |
| Worktree       | `/home/agent/projects/netscript/worktrees/ns1466-impleval`, detached at the head below; the author's worktree was not touched                               |

### Immutable identity

- `git rev-parse HEAD` = `fc81e652019c9cebf9bdc7958414082473b3b06d` = `origin/feat/sdk-procedure-meta` = PR #1731 `headRefOid`. PR OPEN, draft, milestone `0.0.7`, labels `type:feat, status:plan, priority:p1, area:sdk, area:contracts, epic:sdk-client-contrib` (exactly one `status:`). Body carries `Closes #1466` / `Part of #1348`.
- Base `21d516224`; `origin/main` = `13878a80a`, three commits ahead. `git log 21d51622..origin/main -- packages/contracts packages/sdk` is empty, and so is the diff for `deno.lock`, `rfcs/`, `docs/site/reference/contracts/`, `.llm/tools/gates/`, `.llm/tools/docs/`. D-3's "inert drift, no rebase" reasoning is correct for every surface this leaf reads or writes.
- Head `fc81e652` is evidence-only (12 files, all under `.llm/runs/`); the content head is `235482767`. The attempt-4 receipts attest `235482767` and that is the correct content head — verified per file below.
- `deno.lock` unchanged across the branch. Tree clean before and after this evaluation (every perturbation below was restored with `git checkout`, and the one scratch test file was deleted).

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                                                                                                       |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle 2 `PASS` at `7db3954bf` (evaluator commit `1df5ff3e4`); first content commit `c9a391811` is after it in the PR commit list.                                                                                                              |
| Design section exists in worklog       | PASS   | `worklog.md:3-50` `## Design`, written before slice 1 (A-8).                                                                                                                                                                                                  |
| Commit slices match design plan        | PASS   | Slice 1 only, as the coordinator scoped this gate. 15 commits on the branch: 4 plan/eval docs, 4 content (`c9a39181`, `3c3f9b7c`, `64350c5a`, `c57cac67`+`bb1a489a`, `23548276`), the rest evidence recuts/archive. Each content head has its PR comment.       |
| Each slice has a passing gate          | PASS (ruled) | Six of eight contracted receipts PASS at `235482767`; the two terminal FAILs are ruled non-blocking in R-1 with independent verification.                                                                                                               |
| No speculative seams (unused files)    | PASS   | Every added file is imported or is a test/fixture under the receipted `test`/`check` gates; `src/domain/procedure-meta.ts` is consumed by `contract-primitives.ts:10` and `public/mod.ts:44-47`.                                                              |
| Constants used for finite vocabularies | PASS   | `NetScriptAuthenticationRequirement` is a type-only literal union as L1 specifies; no runtime vocabulary was introduced in Stage 1b, so no constant is owed.                                                                                                   |
| `supervisor.md` in run dir             | **FAIL** | `.llm/harness/workflow/activation.md:57` requires `supervisor.md` at run start; the run dir has none (`ls`: audit, context-pack, drift, plan-eval, plan, receipts, research, worklog). Lane identity is scattered across `plan-eval.md` and PR comments. Finding F-5. |
| Agent brief carries `## SKILL`         | N/A    | No `implement.md` brief is checked in; the Codex brief is not in the run dir. Not raised as a finding for a Tier-D thread whose brief lives in the daemon transcript, but `supervisor.md` (F-5) is where that thread id belongs.                               |

## Three rulings routed to this gate

### R-1 — the two terminal FAIL receipts do NOT block this slice. Ruled: non-blocking, with conditions.

**`public-doc-lint`.** I re-ran the receipt's exact 16-entrypoint argv (`receipts/public-doc-lint-final.json` `argv`, which matches `packages/contracts/deno.json` and `packages/sdk/deno.json` `exports` exactly) in this worktree at `fc81e652` and in a scratch worktree of `origin/main` `13878a80a`:

- `main`: exit 1, `Found 12 documentation lint errors.`
- this head: exit 1, `Found 12 documentation lint errors.`
- Set diff (ANSI-stripped, sorted): `main` has `BaseContractRoute→BaseContractErrors`, `BaseContractOutputRoute→BaseContractErrors`, `baseContract→oc`; this head instead has `BaseContractErrors→MergedErrorMap`, `baseContract→ContractBuilder`, `baseContract→Schema`. The other nine findings are identical. That is precisely the D-1 sequence (14 → 13 → 12) and the residuals are all upstream oRPC names that AP-14 forbids re-exporting.

The contracted PASS for gate #5 was unsatisfiable on `main` before this leaf existed; incremental cost is 0 by exact set comparison, not by count alone. Ruling: the receipt stands as terminal FAIL and is **reclassified as baseline-red / delta-0 evidence**. Condition: the three-way finding sets (main / head / diff) are recorded here so the next evaluator does not have to re-derive them; any future head of this branch must keep the count at 12 and the set identical to the one above.

**root `test`.** `receipts/test-final.json` stdout: 4248 passed / 1 failed / 19 ignored; the failure is `hybrid-launcher_test.ts:102` "exact MCP permissions cancel a stubborn worker group without an orphan", assertion `worker descendant 523066 survived cancellation`. Verified on this host:

- `ps -o pid,ppid,stat -p 523066` → `523066 1 Z [sleep] <defunct>`: the descendant did exit and is a zombie reparented to PID 1, which is not reaping it. `ps` counts **7,979** PID-1-owned zombies right now.
- Liveness at `hybrid-launcher_test.ts:167` is `Deno.kill(descendantPid, 0)`; I confirmed with a scratch probe that `kill -0` succeeds on a `Z` process (a zombie holds its PID until reaped), so the loop at `:164-176` can never observe `NotFound` on this host.
- `git diff --stat 21d51622..HEAD` touches zero files under `.llm/tools`.

Ruling: host baseline, not a code state; non-blocking for this slice. Condition: no further root-`test` retries on this host (they cannot move it); the receipt is retained as the honest record and the slice-relevant obligations were independently proven green here: `deno test --allow-all packages/contracts` → **15 passed, 0 failed** (includes runtime storage, assertion-budget ×4, doc-JSON independence, inference probe), and `deno check --unstable-kv` of the three type fixtures/tests → exit 0.

Sufficiency stays `INSUFFICIENT` mechanically; that number is honest and the reasons are both external. That is the ruling the mechanism cannot make and I am making it.

### R-2 — `commonErrorMap` as an exported mutable singleton. Ruled: **not acceptable as published.** Finding F-1 (blocking).

Facts, all verified at this head:

- `contract-primitives.ts:75` exports the value with a `Readonly<{…}>` annotation and no `Object.freeze`. Runtime probe: `Object.isFrozen(commonErrorMap)` = false, `Object.isFrozen(commonErrorMap.NOT_FOUND)` = false.
- oRPC `errors()` shallow-merges (`@orpc/contract@1.14.6/dist/shared/contract.D_dZrO__.mjs:12-14` `{ ...errorMap1, ...errorMap2 }`; `dist/index.mjs:174-179`). So `baseContract['~orpc'].errorMap !== commonErrorMap` but `baseContract['~orpc'].errorMap.NOT_FOUND === commonErrorMap.NOT_FOUND`. Probe: `commonErrorMap.NOT_FOUND.status = 599` → `baseContract['~orpc'].errorMap.NOT_FOUND.status` reads **599**, and a route derived afterwards with `.route(...)` reads **599**. Any JavaScript consumer (or a TS consumer via one cast) can rewrite the status/message/data of every NetScript contract in the process through the public root entrypoint.
- Doctrine names the mechanism: `04-modules-and-helpers.md:102` "Immutability → `Object.freeze` + `readonly` types". The same package already follows it for its sibling vocabulary: `src/domain/constants.ts:21,35` freeze `COMMON_ERROR_CODES` and friends. The new export is the only unfrozen public constant object in the package.
- The export exists to clear one `private-type-ref` on `BaseContractErrors = MergedErrorMap<Record<never, never>, typeof commonErrorMap>` (`:123`), not for a consumer need (D-1, PR comment cycle 2). `typeof commonErrorMap` is by annotation exactly `CommonErrorMap`, which is already public.
- Docs (`docs/site/reference/contracts/index.md:22`) document the hazard ("JavaScript mutation is possible at runtime but unsupported") instead of closing it.

Ruling and required fix: write the alias as `MergedErrorMap<Record<never, never>, CommonErrorMap>` and **withdraw the `commonErrorMap` value export** from `src/public/mod.ts` — the doc-lint finding it was published to clear does not return (only the exported type is referenced), the count stays at 12, the `CommonErrorMap` type export stays. Remove its row from the contracts reference inventory and re-run `deno task docs:exports-drift`. If a stated consumer need for the value ever arises, it ships frozen (map and each of the six entries) per doctrine 04 with the existing precedent, not "read-only by contract".

### R-3 — should `docs-exports-drift` join the contracted gate set? Ruled: **yes for the leaf's remaining slices as named supplemental evidence; no plan amendment; catalog change is a coordinator follow-up.**

Facts:

- `deno task docs:exports-drift` (`deno.json:85` → `.llm/tools/docs/check-exports-drift.ts`) re-run by me: **PASS, exit 0 on this head and on `origin/main`**. It is an inventory-by-name check (`check-exports-drift.ts:529-548`), so it detects exactly the class of regression D-7 describes (a public symbol added without a reference row) and nothing about signatures.
- It is **not** a `GATE_CATALOG` name (`.llm/tools/gates/catalog.ts` has no `exports-drift` entry, verified by grep), and `catalog.ts:78-80` rejects non-catalog names, so it cannot become a `run-gate.ts` receipt without a harness tooling change this leaf does not own.
- The plan's supplemental-evidence rule (`plan.md:242-245`) already admits non-receipt evidence by name, so requiring it does not amend the PLAN-EVAL-approved eight.

Ruling: (1) for slice 1 the supplemental `audit/docs-exports-drift.txt` at `235482767` is accepted and independently confirmed; (2) slices 2 and 3 must run `deno task docs:exports-drift` at each content head and record it as named supplemental evidence — the SDK page is `entrypoints-only`, so slice 2's `./ports` / `./query` additions are covered only if the SDK reference's entrypoint rows stay complete; (3) the coordinator files the catalog entry + `gates/archetype-gate-matrix.md` row as a harness follow-up issue (this session may not file issues). `public-doc-lint` stays in the set as contracted; its role for this leaf is the delta-0 baseline record from R-1.

## Substance verification

### The exactness probe (`packages/contracts/tests/procedure-meta-inference_test.ts`)

- Nothing annotates `inferredBaseContract` (`:13`); the compared types are read from the inferred value (`:15-16`) against the public aliases imported from `@netscript/contracts` (`:1-5`). Non-tautological by construction.
- **Made to fail.** Perturbation A: expected type → `Record<never, never>` → `TS2344 [ERROR]: Type 'false' does not satisfy the constraint 'true'`, exit 1. Restored. D-5's reported result is reproduced.
- **What it does not pin (new finding F-2).** Perturbation B: changed the real initializer in `contract-primitives.ts:159` to `oc.$meta<Record<never, never>>({})` with the annotation unchanged. Result: the fixture `procedure-meta_type.ts` exit 0, the SDK doctest exit 0, **and the inference probe exit 0**. Perturbation B2 (`NetScriptProcedureMeta & { readonly extra?: string }`): the same, plus `contract-primitives.ts` itself exit 0. The probe rebuilds the contracted expression instead of observing `baseContract`'s initializer, so the scenario the coordinator describes — an annotation of `Meta1` over an initializer producing `Meta2` — still type-checks across the entire guard set. Impact is bounded: under `isolatedDeclarations` the annotation is the published declaration and the runtime value is `{}` either way, so no consumer-visible type or value changes; what is unguarded is source drift between the initializer and L2. D-5:126-139 states the probe "now supplies the independent T-2 pin" — it pins the alias spelling against oRPC's inference for the contracted expression, which is the T-2 requirement as PLAN-EVAL worded it, but it does not close the divergent-initializer hole D-5 opens with. Required fix: in `assertion-budget_test.ts` (already reads the file as stripped text) assert the stripped source of `contract-primitives.ts` contains the exact initializer `oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` exactly once, and amend D-5 to state the residual honestly.

### The five `…RemainsExact` assertions in `procedure-meta_type.ts:19,27-38` and `_BaseMetaSlotPreserved` in `readme-doctest_test.ts:48`

Perturbation B confirmed they read annotation-derived types on both sides and cannot see an initializer change. But they are not pure tautologies: `Equal<>` is identity, and perturbation A proved `Equal<Record<never, never>, BaseContractMeta>` is `false`, so these six lines fail if anyone edits generic position 4 of `BaseContractRoute` / `BaseContractOutputRoute` / the `baseContract` annotation back to `Record<never, never>` or to a different spelling. They are spelling-consistency guards for L2 across three declarations. Judgement "redundant-but-harmless" is upheld with that correction: harmless, mildly useful, not inference guards. No change required.

### Acceptance points (#1466)

| # | Point                                                      | Result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                       |
| - | ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | Public, versionable NetScript-owned shape                  | PASS   | `src/domain/procedure-meta.ts` (zero imports; scanner asserts it), exported via `public/mod.ts:44-47`; doc-JSON independence test passes (no `@orpc`/`npm:` in the three symbols' subtrees). L1 shape matches verbatim.                                                                                                                                                                                                       |
| 2 | Error literals preserved end to end                        | PASS   | `CommonErrorMap.data` widened to `ContractObjectSchema<T, T>` is type-identical to before: `schemas.ts:90-110` annotate each lower-case schema with exactly that type, and `main`'s `baseContract` annotation already spelled it. Perturbation D (NOT_FOUND `data` → validation schema): `contract-primitives.ts` fails `TS2322` and the SDK doctest fails with **two `TS2344`** from `ContractSchemaOutput<typeof NotFoundErrorSchema>` pins through `safe()` and `isDefinedError` (`readme-doctest_test.ts:63-92`). The #1350 pin is independent of `CommonErrorMap` and would have gone red. Codes pinned at `:26-36`. Runtime `safe` test passes. |
| 3 | No casts or `any` at the metadata boundary                 | PASS   | Committed scanner run at this head: `contract-primitives.ts = 0`, `procedure-meta.ts = 0`, zero angle-bracket casts, zero imports in the metadata file, zero `any` outside comments (my raw `grep` shows the only `as`/`any` tokens are inside JSDoc, which the scanner strips). Baselines equal the plan's pins; SDK baselines belong to slice 2 and are NOT RUN. `quality-gate` receipt PASS.                                     |
| 4 | Positive and negative fixtures exercise real exports       | PASS with F-3 | `procedure-meta_type.ts:1-10`, `procedure-meta_test.ts:2`, `readme-doctest_test.ts:1-8` import `@netscript/contracts`. Negative fixtures fail correctly: dropping the directive → `TS2322`; making the literal valid → `TS2578`. The inference probe imports `commonErrorMap` from `../src/application/contract-primitives.ts:7` — justified when written (`64350c5a`), but since `c57cac67` the value is public and a scratch copy importing it from `@netscript/contracts` checks at exit 0. Under R-2's fix the value goes private again and the internal import becomes the only way to reach it; that is acceptable for a *test* that needs the real value (L5 governs fixtures) and must be stated in the file header. |
| 5 | Public docs explain ownership and compatibility            | PASS with F-4 | `README.md:104-111` states the additive-only rule, no discriminant, unknown-field handling and the semver-major cost — accurate to L1/§4. The six inventory rows in `docs/site/reference/contracts/index.md` are accurate for the symbols they add. The pre-existing `BaseContract` row (`:28`, `ReturnType<typeof oc.errors>`) became stale with this leaf's annotation change (`deno doc` renders `type BaseContract = typeof baseContract`, and the value is now `ContractBuilder<…>`); the drift tool cannot see signatures. The `commonErrorMap` row falls with R-2.                                       |
| 6 | Required gates and IMPL-EVAL pass                          | not yet | Slice 1 only; see verdict. Issue #1466's six acceptance boxes are unchecked (`gh issue view 1466`), which is correct at this stage; the close-gate (protocol rule 12) applies before `status:ready-merge`, not now.                                                                                                                                                                                                              |

### Receipt set integrity

All eight `receipts/*-final.json`: `attempt` = 4, `gitHead == actualGitHead == 235482767…`, distinct `gateId` = the contracted list, `invocationId` = `1466-<gateId>-final`, outcomes PASS ×6 / FAIL ×2 (`test` exit 1, `public-doc-lint` exit 1). `receipts/frozen-c9a391811/` holds the attempt-1 originals unchanged (moved by `9649b349`) and is outside the eight literal paths the worklog computes over. The evidence commit `fc81e652` on top of the content head touches only `.llm/runs/`. No superseded receipt is being counted.

## Static Gates

| Gate             | Command or check                                                      | Result | Evidence                                                                 |
| ---------------- | --------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Narrow typecheck | `deno check --unstable-kv` inference test + fixture + SDK doctest     | PASS   | exit 0 at this head (baseline of the perturbation series)                |
| Slice typecheck  | `receipts/check-final.json`                                           | PASS   | root `check`, attempt 4, `235482767`                                     |
| Format           | `receipts/fmt-check-final.json`                                       | PASS   | attempt 4                                                                |
| Lint             | `receipts/lint-final.json`                                            | PASS   | attempt 4                                                                |
| Doc lint         | exact 16-entrypoint `deno doc --lint`                                 | FAIL (baseline-red, delta 0) | R-1                                                        |
| Publish dry-run  | `receipts/publish-dry-run-final.json`                                 | PASS   | workspace dry-run, no `--member`                                         |
| Exports drift    | `deno task docs:exports-drift` (supplemental, re-run)                 | PASS   | exit 0 on head and on `main`                                             |
| Package tests    | `deno test --allow-all packages/contracts`                            | PASS   | 15 passed, 0 failed                                                      |
| Root test        | `receipts/test-final.json`                                            | FAIL (host baseline) | R-1                                                                |

## Fitness Gates

| Gate | Function                          | Result | Evidence                                                                                         |
| ---- | --------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| F-3  | Layering                          | PASS   | domain file imports nothing; application imports domain; public barrel re-exports. `arch-check` receipt PASS. |
| F-5  | Public surface audit              | FAIL   | +1 unplanned value export (`commonErrorMap`) beyond the plan's +3 types; see R-2 / F-1. `BaseContractErrors`, `CommonErrorMap` additions are NetScript-owned and acceptable. |
| F-6  | JSR publishability                | PASS   | `audit/contracts.json` supplemental: one sanctioned oRPC slow-types INFO, no WARN/FAIL; publish dry-run PASS. |
| F-7  | Doc-score                         | PASS   | zero missing JSDoc on the new symbols; residual `private-type-ref` set is the `main` baseline.    |
| F-15 | Re-export-of-upstream lint (AP-14)| PASS   | `public/mod.ts` exports only NetScript-owned names; upstream `MergedErrorMap`/`ContractBuilder`/`Schema` are referenced, not re-exported. |
| F-19 | Scoped source gate runners        | PASS   | receipts 1–3, 6–7.                                                                               |
| others | —                               | N/A    | no runtime, folder, naming, saga, console, or permission surface changed.                        |

## Runtime / Consumer Gates

| Gate                          | Validation                                                          | Result | Evidence                                                                          |
| ----------------------------- | ------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| Runtime metadata storage (R-1 of PLAN-EVAL) | `procedure-meta_test.ts`                              | PASS   | in the 15 passing contracts tests                                                 |
| Consumer: `@netscript/sdk`    | `readme-doctest_test.ts` real-export error channel + meta slot      | PASS   | exit 0; goes red under perturbation D                                             |
| Consumer: plugins             | `grep commonErrorMap|BaseContractErrors|CommonErrorMap` outside contracts | N/A | no consumer outside `packages/contracts` at this head                          |
| Expensive gates               | `scaffold.runtime`, `fresh-browser`, Aspire, Docker                 | N/A    | not applicable; none run                                                          |

## Anti-Pattern Check

| AP    | Status  | Evidence                                                                                    |
| ----- | ------- | ------------------------------------------------------------------------------------------- |
| AP-14 | CLEAR   | no upstream type re-exported; alias references only                                         |
| others | N/A    | outside this slice's scope                                                                  |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                 |
| --------------------- | ----- | ------------------------------------------------------------------------ |
| New entries           | 0     | `arch-debt.md` has no #1466 entry; plan expected none                    |
| Resolved entries      | 0     |                                                                          |
| Deepened violations   | 0     |                                                                          |
| Unrecorded violations | 0     | F-1 is a doctrine-mechanism deviation fixed by removal, not accepted debt |

## Findings

| ID  | Severity | Finding                                                                                                                                        | Evidence                                                                   | Required action |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------- |
| F-1 | high     | Exported unfrozen `commonErrorMap` singleton; nested mutation rewrites every base route's error map at runtime; contradicts doctrine 04:102 and the package's own `Object.freeze` precedent; published for doc-lint, not a consumer. | R-2 probe (status 599 propagates); `contract-primitives.ts:75,123`; `constants.ts:21,35` | fix: alias on `CommonErrorMap`, withdraw value export, drop docs row, re-run exports-drift |
| F-2 | medium   | Divergent `baseContract` initializer under an unchanged annotation is caught by no guard; D-5 overstates what the inference probe closes.      | Perturbations B/B2 exit 0 across fixture, doctest, probe                   | fix: exact-initializer text assertion in `assertion-budget_test.ts`; amend D-5 |
| F-3 | low      | Inference probe imports `commonErrorMap` from `src/**` although it is public at this head (L5).                                                | `procedure-meta-inference_test.ts:7`; scratch public-import check exit 0   | fix: after F-1 the internal import is the only route and stays — add a one-line header stating why a test (not a fixture) reaches into `src/`; if F-1 were not applied, switch to the public import |
| F-4 | low      | `docs/site/reference/contracts/index.md:28` `BaseContract` row now stale (`ReturnType<typeof oc.errors>`); drift tool is name-only.            | `deno doc --filter BaseContract` → `typeof baseContract`                   | fix: update the row's signature text |
| F-5 | low      | `supervisor.md` missing from the run dir.                                                                                                      | `activation.md:57`; run dir listing                                        | fix: add from `templates/supervisor.md` with the lane table, Codex thread `01a0515c`, both evaluator sessions |

Non-findings, recorded so they are not re-litigated: the two terminal FAIL receipts (R-1); the base-behind-main drift (D-3 verified); the frozen receipt archive; SDK assertion baselines (slice 2).

## Lessons for Promotion

| Lesson                                                                                                   | Pattern                                                                                                                                                | Applies to   | Confidence |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ---------- |
| A gate that is red on `main` cannot be contracted as PASS; contract the delta and name the green sibling | Record base/head finding sets for baseline-red gates; add a green branch-sensitive check (`docs:exports-drift`) to the catalog for public-surface slices | Archetypes 1–2 | high     |
| "Inference probe" must observe the real initializer, not a copy of the expression                        | Pair any unannotated inference probe with a source-text pin of the initializer it claims to guard                                                      | Archetype 1  | medium     |
| Never publish a value to satisfy a doc linter                                                            | Reference the public *type* in aliases; if a value must be public, freeze it (doctrine 04)                                                             | all packages | high       |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `FAIL_FIX`                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Rationale | The plan is valid and slice 1's substance is real: the probe breaks when it should, negative fixtures fail correctly, the #1350 pin goes red independently of `CommonErrorMap`, baselines match the scanner, docs state the compatibility rule accurately, and both terminal reds are ruled external (R-1). What blocks is F-1: an unfrozen mutable singleton on the public root, published to clear a linter, that provably rewrites every contract's error map at runtime — a doctrine-mechanism deviation with a bounded, non-debt fix. F-2–F-5 ride the same cycle. Re-evaluation scope for cycle 2: F-1…F-5 as written, doc-lint count still 12 with the R-1 set, `docs:exports-drift` exit 0, contracts tests green, receipts recut at the new content head. No ruling is reopened. |

Failure count for this leaf's IMPL-EVAL loop: 1 of 2.
