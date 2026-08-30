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

---

# Evaluation — cycle 2: #1466 slice 1 (PR #1731) after repair cycles 4–5

This section is appended by the cycle-2 IMPL-EVAL session. Nothing above this rule was modified;
`git diff` of this commit shows only additions at the end of the file.

## Metadata

| Field          | Value                                                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run ID         | `feat-sdk-procedure-meta--1466`                                                                                                                                                                             |
| Target         | Slice 1 re-evaluation at the scope fixed by cycle 1: F-1…F-5 as written, doc-lint 12 = 12 with the R-1 set, `docs:exports-drift` exit 0, contracts tests green, receipts recut at the new content head. Slices 2 and 3 remain NOT RUN and are not evaluated. |
| Archetype      | 2 — Integration (`packages/sdk`, governing); `packages/contracts` portion Archetype 1 (unchanged from cycle 1)                                                                                              |
| Scope overlays | docs (package README/JSDoc + `docs/site/reference/contracts/index.md` inventory only)                                                                                                                       |
| Evaluator      | Claude Fable 5 · medium, `formal_impl_evaluation` (`lane-policy.md:46`, native opposite-family for Codex work), fresh separate session, 2026-08-30. Generator of the evaluated content: Codex `gpt-5.6-sol` · medium, thread `01a051d1-e622-74c1-8b2f-1ad80a540c29`. Cycle-1 evaluator session `00ec0e55-…` is a different session from this one. |
| Worktree       | `/home/agent/projects/netscript/worktrees/ns1466-impleval-c2`, detached; `007-leaf-1731` (author) was not touched. A scratch detached worktree of `origin/main` was created under the job tmp dir for the doc-lint baseline and removed afterwards. |

### Immutable identity

- `git rev-parse HEAD` = `origin/feat/sdk-procedure-meta` = PR #1731 `headRefOid` = `369928cf7ca7125fd6e8e94b4975f29fa187e400`. All three agree. PR OPEN, draft, milestone `0.0.7`, labels `type:feat, status:plan, priority:p1, area:sdk, area:contracts, epic:sdk-client-contrib`; body carries `Closes #1466` / `Part of #1348`.
- Branch since the cycle-1 verdict: `74483f02` (cycle-1 verdict, evidence) → `42874803` (**content head**, cycle 4) → `dd201816` (cycle-4 evidence: receipts, audit, worklog) → `369928cf` (cycle-5 evidence: `supervisor.md`, worklog). `git diff --name-only 42874803..HEAD` lists only `.llm/runs/` paths — the content head is genuinely `42874803`.
- Content delta `235482767..42874803` outside the run dir: `contract-primitives.ts` (1 line), `public/mod.ts` (export withdrawn), `assertion-budget_test.ts` (+1 test), `procedure-meta-inference_test.ts` (+1 header comment), `docs/site/reference/contracts/index.md` (row deleted, row corrected).
- `deno.lock`: `git hash-object deno.lock` = `a1522e6e…` = `origin/main:deno.lock` = `21d51622:deno.lock`. Byte-unchanged across the branch.
- Merge base `21d516224`; `origin/main` still `13878a80a` — the cycle-1 D-3 analysis (inert drift) is unchanged.
- Tree clean before and after: every perturbation below was restored with `git checkout -- <file>` and `git status --short` was empty afterwards (0 dirty files).

## Process verification

| Check                                  | Result | Evidence                                                                                                                                                                                                                                                  |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | unchanged from cycle 1 (`plan-eval.md` cycle 2 `PASS`)                                                                                                                                                                                                    |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design`, unchanged                                                                                                                                                                                                                       |
| Commit slices match design plan        | PASS   | cycle 4 is one bounded repair commit (`42874803`) followed by evidence-only commits, as the Tier-A brief (`impl-1466-repair-4-impleval.md`) specified                                                                                                     |
| Each slice has a passing gate          | PASS (ruled) | seven receipts at `42874803` (6 PASS, `public-doc-lint` FAIL baseline-red/delta-0 per R-1), `test` SKIPPED — ruled below (Ruling 1)                                                                                                                  |
| No speculative seams (unused files)    | PASS   | no files added; the new test is executed by the contracts suite (16 passed, includes it by name)                                                                                                                                                          |
| Constants used for finite vocabularies | PASS   | unchanged; no new vocabulary                                                                                                                                                                                                                              |
| `supervisor.md` in run dir             | PASS with G-5 | present since `42874803`, corrected at `369928cf`; residuals in G-5                                                                                                                                                                                   |
| Agent briefs carry `## SKILL`          | PASS   | `impl-1466-repair-4-impleval.md:22` and `impl-1466-repair-5-identity.md:15` (features orchestration run, `orchestrator/release-0.0.7-features`) both carry `## SKILL`                                                                                     |
| Per-slice PR comment (commit trail)    | **FAIL** | PR #1731 has 11 comments; the last is the cycle-1 IMPL-EVAL verdict at `2026-08-30T07:34:25Z`. `42874803`, `dd201816`, `369928cf` (08:42–08:56Z) have no PR comment. The cycle-4 brief ends with "Commit, push, and stop" and asks for no comment. Finding G-2. |
| Tier-A slice review before sign-off    | PASS   | `slices/tier-a-review-1466-repair-4.md` (features supervisor, Opus 5 high, own worktree `ns1466-tiera-c4`), verdict `ACCEPTED_WITH_FINDINGS`; the reviewer re-measured and did not self-certify                                                             |
| Evaluator route                        | PASS   | this session is Fable 5 · medium, `formal_impl_evaluation` primary for Codex work; no escalation route was needed                                                                                                                                         |

## Re-measurement (nothing below is taken from the supervisor or the author)

### 1. `public-doc-lint` at head vs `main` — set identity, not count

Ran the receipt's exact 16-entrypoint argv (`deno doc --lint packages/contracts/{mod,crud,query,transform}.ts packages/sdk/mod.ts packages/sdk/src/{auto-update,desktop,cache,client,collections,discovery,ports,query,query-client,telemetry}/mod.ts packages/sdk/src/streams.ts`) in this worktree at `369928cf` and in a scratch detached worktree of `origin/main` `13878a80a`:

- `main`: exit 1, `Found 12 documentation lint errors.`
- head: exit 1, `Found 12 documentation lint errors.`
- Sorted `(symbol → private type)` pairs, ANSI-stripped, paths ignored: **9 identical**. `main`-only: `BaseContractOutputRoute→BaseContractErrors`, `BaseContractRoute→BaseContractErrors`, `baseContract→oc`. Head-only: `BaseContractErrors→MergedErrorMap`, `baseContract→ContractBuilder`, `baseContract→Schema`.

That is exactly the three-in/three-out set R-1 recorded. The F-1 withdrawal moved nothing: `BaseContractErrors→MergedErrorMap` is still present (the alias's own oRPC reference), and no `commonErrorMap` finding appears at either end. R-1's set-identity condition holds at this head. `audit/public-doc-lint-cycle4.txt` lists the same 12 pairs.

### 2. The F-2 pin — made to fail, then attacked

Committed pin: `assertion-budget_test.ts:122-134` asserts the comment/string-stripped source of `contract-primitives.ts` matches `/oc\.\$meta<NetScriptProcedureMeta>\(\{\}\)\.errors\(commonErrorMap\)/` exactly once.

| Probe | `check` (file + fixture + inference probe + SDK doctest) | Pin test | Full contracts suite |
| --- | --- | --- | --- |
| Head, unmodified | exit 0 | `ok`, 5/5 | 16 passed / 0 failed |
| **Perturbation B** — initializer → `oc.$meta<Record<never, never>>({})` | **TS2322** in `contract-primitives.ts:154` (`ContractBuilder<…, Record<never,never>, Record<never,never>>` not assignable to the annotation) | **RED** — `base contract initializer remains pinned…` FAILED, `4 passed / 1 failed` | type-check fails |
| **Perturbation B2** — initializer meta → `NetScriptProcedureMeta & { readonly extra?: string }` | exit 0 (the annotation absorbs it — this is the real hole cycle 1 described) | **RED** — FAILED, `4 passed / 1 failed` | fails on the pin |
| Forgery Fa — B + the pinned text in a trailing `//` comment | — | RED (stripper removes it; supervisor's result reproduced) | — |
| Forgery Fc — B + pinned text inside a dead `type` alias via `typeof oc.$meta<…>` | — | RED (no `.errors(commonErrorMap)` in the type) | — |
| **Forgery Fb/Fd — B2 + a dead decoy `const _legacyBase = oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap); void _legacyBase;` appended** | **exit 0** | **GREEN** (count is exactly 1 — the decoy) | **16 passed / 0 failed**; `deno lint` clean (`_`-prefix silences `no-unused-vars`) |

Correction to the cycle-1 record, for accuracy: plain perturbation B is *already* caught by the `check` gate at the file itself (TS2322), which cycle 1 did not run under B; the guard set cycle 1 measured (fixture, doctest, probe) was and is blind to it, but the contracted `check` receipt is not. The genuinely unguarded case was B2, and the new pin catches B2. The pin therefore closes F-2 as required.

What the pin does not do is *anchor* the expression to the `baseContract` declaration: a divergent initializer plus a dead decoy carrying the pinned text passes `check`, `lint`, the pin, and the whole contracts suite (Fb/Fd). This is a deliberate-forgery scenario, not a drift scenario — a reviewer sees the decoy in the diff — so it is finding G-1 (low, non-blocking), not a reopening of F-2. Every perturbation was reverted; `git status --short` returned nothing after each.

### 3. F-1 — consumer safety of the withdrawal

- `grep -rn commonErrorMap packages plugins templates` (ts/tsx/md): the only matches outside `contract-primitives.ts` are `packages/contracts/tests/procedure-meta-inference_test.ts:8,14` (internal import, the F-3 header at `:1` states why) and the pin regex in `assertion-budget_test.ts:130`. **Zero** consumers through the public specifier anywhere.
- `contract-primitives.ts:123`: `export type BaseContractErrors = MergedErrorMap<Record<never, never>, CommonErrorMap>;` — references the public `CommonErrorMap`, not `typeof commonErrorMap`.
- `src/public/mod.ts:2`: `export { type BaseContract, baseContract }` — the value export is gone; `CommonErrorMap` stays in the type-only export list at `:3-9`.
- The value was withdrawn, not frozen-as-substitute, which is what R-2 required. The `check` receipt (`deno task check`, exit 0 at `42874803`) is the workspace-wide proof that no import broke; my own `deno check --unstable-kv` of the fixture, the inference probe and the SDK doctest at head is exit 0.
- Residual (G-4, low): the surviving `CommonErrorMap` docs row (`index.md:58`) and its JSDoc still describe the type as "public shape of `commonErrorMap`", and `contract-primitives.ts:130` `{@link commonErrorMap}` sits in public JSDoc — both now name a private symbol a reader of the public reference cannot find. `deno doc --lint` does not flag it; it is a prose accuracy item for the slice-3 docs pass.

### 4. Receipts and frozen archives

All eight `receipts/*-final.json`: `attempt` = 5, `invocationId` = `1466-<gateId>-final`, `cwd` = `007-leaf-1731`, **`gitHead == actualGitHead == 42874803e572…`** on every file. Outcomes: `arch-check`, `check`, `fmt-check`, `lint`, `publish-dry-run`, `quality-gate` PASS exit 0; `public-doc-lint` FAIL exit 1 (12, above); `test` `SKIPPED`, `durationMs: 0`, `reason: "R-1 forbids retry on this host; frozen-235482767/test-final.json retains the terminal host-baseline FAIL"`. `audit/evidence-sufficiency-cycle4.json` names the eight literal paths and reports `INSUFFICIENT` for exactly the two external reasons — honest.

Archives: every file under `receipts/frozen-235482767/` is byte-identical to the corresponding `receipts/*-final.json` at `fc81e652` (the attempt-4 set the cycle-1 verdict evaluated), and every file under `receipts/frozen-c9a391811/` is byte-identical to its copy at `fc81e652`. `git log --all --diff-filter=MD -- <both archive dirs>` is empty: nothing in either archive has ever been modified or deleted. Append-only holds.

### 5. Supplemental gates, re-run by me at `369928cf`

- `deno test --allow-all packages/contracts` → **16 passed, 0 failed** (15 + the new pin, listed by name).
- `deno task docs:exports-drift` → **PASS, exit 0**; contracts page `mode=complete`, `omitted-symbol-groups=0`.
- CI on this draft branch: every matrix job at `369928cf` is `skipping` (drafts do not run the matrix); only `Deploy docs site to Pages` ran and succeeded — that workflow is the one that runs `docs:exports-drift` (D-7), so the docs-side check is also green off-host. No CI root `test` evidence exists at any head of this branch.

## Rulings requested of this gate

### Ruling 1 — does a `SKIPPED` receipt satisfy the contracted `test` gate?

**Ruled: accepted for content head `42874803` with conditions; it does not satisfy the gate for merge readiness, and the archived FAIL must not be re-cut forward.**

- Mechanically, no: sufficiency is `INSUFFICIENT` and the receipt says so. That is the correct machine answer and nobody engineered around it.
- Cutting a fresh `test-final.json` with `outcome: FAIL` at `42874803` without running the command would be a receipt attesting a run that did not happen — fabrication. Carrying the archived FAIL forward as the head receipt is therefore the wrong treatment; the `SKIPPED` receipt that *cites* the archived FAIL and R-1 is the honest form. The archive keeps the real terminal record.
- What covers the residual (root `test` never executed at `42874803`): the last root `test` at `235482767` ran 4248/1/19 with the single external failure. The delta since is two source lines (a type-alias operand and an export-list line), one comment, one new test, and one docs page. The `check` receipt (workspace `deno task check`, exit 0) proves no import or type broke anywhere in `packages`/`plugins`; the zero-consumer grep proves nothing reached the withdrawn value through the public specifier; the contracts suite (16/16, mine and the author's) executes the new test; my `deno check` of the SDK doctest proves the SDK consumer still type-checks. Runtime behaviour is unchanged by construction — the value object still exists internally and is the same object. I consider that coverage sufficient **for this head**.
- Conditions: (a) before any `status:ready-merge` or ready-flip of #1731, root `test` must be observed green at the final head on a host that does not carry the D-26 zombie baseline — in practice the CI matrix when the PR leaves draft, since draft pushes skip it; (b) slices 2 and 3 must not rely on `SKIPPED` — each must produce a real root-`test` receipt or a recorded, independently proven substitute of the same shape as above; (c) R-1's no-retry condition stays in force on this host only.

### Ruling 2 — is AF-1's class of defect closed?

**Ruled: closed on substance; two low residuals (G-5).** I checked `supervisor.md` at `369928cf` against artefacts the author did not write:

- Launcher records on `orchestrator/release-0.0.7-features` (`slices/1466/codex-thread-ids.md`, `codex-thread-ids-1466-repair-c1c3.md`, `codex-thread-ids-1466-repair-c4.md`, all written by `launch-codex-slice.ts`): original slice thread `01a04f84…` requested/observed `gpt-5.6-sol · high`, worktree `/home/codex/repos/netscript-007-features-1466`; repair thread `01a0515c…` and cycle-4 thread `01a051d1…` requested/observed `gpt-5.6-sol · medium`, worktree `007-leaf-1731`. Route verdict `matched` on all three.
- Codex rollouts `~/.codex/sessions/2026/08/30/rollout-…-01a0515c…jsonl` and `…-01a051d1…jsonl` both record `"model":"gpt-5.6-sol"` and `"cwd":"/home/agent/projects/netscript/worktrees/007-leaf-1731"`.
- `supervisor.md` now says: `complex_implementation · high` = original slice only; `normal_implementation · medium` = repair cycles 1–3 (`01a0515c`) and cycle 4 (`01a051d1`); Checkout = `007-leaf-1731`. All three statements match the launcher records. The recorded identity is now accurate.
- Historical marking of the PLAN-EVAL path: correct treatment. `/home/codex` does not exist on this host; `plan-eval.md:21` is the primary record of where that session ran and must not be rewritten to a path it never used. Pointing at it as "historical (pre-migration)" preserves provenance; rewriting would have been the AF-1 error in reverse.
- Residuals (G-5): the file still opens with "Written at run start", but it was reconstructed at cycle 4 to close F-5 — a run-identity file should say when it was actually written; the `Session` row omits the original slice-1 thread `01a04f84-e21d-77f3-863c-56ef2498d581`; and the `formal_impl_evaluation` row must gain this cycle-2 session after this verdict lands (that is the supervisor's edit, not mine).

### Ruling 3 — is slice 1 terminal?

**Yes, on substance — see Verdict.** What remains before #1466 can close is listed under "What remains" below; PR #1731's `Closes #1466` cannot fire on slice 1.

## Acceptance points (#1466) at this head

| # | Point | Result | Change since cycle 1 |
| - | ----- | ------ | -------------------- |
| 1 | Public, versionable NetScript-owned shape | PASS | unchanged |
| 2 | Error literals preserved end to end | PASS | unchanged; `CommonErrorMap` type unchanged, alias now references it |
| 3 | No casts or `any` at the metadata boundary | PASS | `quality-gate` receipt PASS at `42874803`; assertion baselines still 0/0 |
| 4 | Positive and negative fixtures exercise real exports | PASS | F-3 header present; the inference probe's internal import is now the only route and is stated |
| 5 | Public docs explain ownership and compatibility | PASS with G-4 | F-4 row corrected (`type BaseContract = typeof baseContract`, matches `deno doc`); `commonErrorMap` row removed |
| 6 | Required gates and IMPL-EVAL pass | slice 1 only | issue boxes remain unchecked (correct at this stage); see "What remains" |

## Static gates

| Gate             | Command or check                                                   | Result | Evidence |
| ---------------- | ------------------------------------------------------------------ | ------ | -------- |
| Narrow typecheck | `deno check --unstable-kv` primitives + fixture + probe + SDK doctest | PASS | exit 0 at head (baseline of the perturbation table) |
| Slice typecheck  | `receipts/check-final.json`                                        | PASS   | attempt 5, `42874803` |
| Format           | `receipts/fmt-check-final.json`                                    | PASS   | attempt 5 |
| Lint             | `receipts/lint-final.json`                                         | PASS   | attempt 5 |
| Doc lint         | exact 16-entrypoint `deno doc --lint`, head vs `main`              | FAIL (baseline-red, delta 0, set identical) | § Re-measurement 1 |
| Publish dry-run  | `receipts/publish-dry-run-final.json`                              | PASS   | attempt 5 |
| Exports drift    | `deno task docs:exports-drift` (supplemental, R-3)                 | PASS   | exit 0, re-run; Pages workflow green at `369928cf` |
| Package tests    | `deno test --allow-all packages/contracts`                         | PASS   | 16 passed / 0 failed |
| Root test        | `receipts/test-final.json`                                         | SKIPPED (ruled) | Ruling 1 |

## Fitness gates

| Gate | Function | Result | Evidence |
| ---- | -------- | ------ | -------- |
| F-3  | Layering | PASS | unchanged; `arch-check` receipt PASS at `42874803` |
| F-5  | Public surface audit | **PASS** (was FAIL) | the unplanned value export is withdrawn; public delta is now the plan's NetScript-owned types only |
| F-6  | JSR publishability | PASS | publish dry-run PASS at `42874803` |
| F-7  | Doc-score | PASS | residual `private-type-ref` set = `main` baseline (set-identical) |
| F-10 | Test-shape audit | PASS with G-1 | new pin is a real tripwire (B, B2, Fa, Fc red); decoy-forgeable (G-1) |
| F-15 | Re-export-of-upstream (AP-14) | PASS | `MergedErrorMap` referenced, not re-exported |
| F-19 | Scoped source gate runners | PASS | receipts 1–3, 6–7 |
| others | — | N/A | no other surface changed |

## Runtime / consumer gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Runtime metadata storage | `procedure-meta_test.ts` | PASS | in the 16 passing tests |
| Consumer: `@netscript/sdk` | `readme-doctest_test.ts` type-checks against head | PASS | `deno check` exit 0 |
| Consumer: plugins / templates | grep for the withdrawn value | N/A | zero consumers |
| Expensive gates | `scaffold.runtime`, Aspire, Docker, browser | NOT RUN | no lease held; not applicable to this slice |

## Anti-pattern check

| AP | Status | Evidence |
| -- | ------ | -------- |
| AP-14 | CLEAR | no upstream type re-exported to close F-1 |
| others | N/A | outside this slice's scope |

## Arch-debt delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | `arch-debt.md` has no #1466 entry; F-1 was fixed by removal, not accepted as debt |
| Resolved / deepened / unrecorded | 0 | — |

## Findings (cycle 2)

| ID | Severity | Finding | Evidence | Required action |
| -- | -------- | ------- | -------- | --------------- |
| G-1 | low | The F-2 text pin counts occurrences anywhere in the file; a divergent initializer plus a dead decoy carrying the pinned text (Fb/Fd) passes `check`, `lint`, the pin, and the full contracts suite. | perturbation table, rows Fb/Fd | fix, non-blocking: anchor the regex to the declaration (`export const baseContract:[\s\S]*?= oc\.\$meta<NetScriptProcedureMeta>\(\{\}\)\.errors\(commonErrorMap\);`) or match on the declaration line. Slice 2 touches this test file (SDK baselines) and can carry it; otherwise a follow-up. |
| G-2 | medium (process) | PR #1731's commit trail ends at the cycle-1 verdict: `42874803`, `dd201816`, `369928cf` have no PR comment; the cycle-4 brief asked for none. | `gh api …/issues/1731/comments` (11, last 07:34Z); brief `impl-1466-repair-4-impleval.md:120-140` | evidence-only, before slice 2 starts: the features supervisor posts the `[PHASE: IMPL]` comment for cycle 4 (content `42874803`, evidence `dd201816`/`369928cf`, gate table, this verdict). |
| G-3 | medium (resume) | `context-pack.md` was not updated in cycles 4–5; it still states the cycle-3 head `235482767`, that `commonErrorMap` is public, and that "IMPL-EVAL … has not been run". A resumer reading it alone would reintroduce F-1's premise. | `context-pack.md` "Current state" / "Resume point"; `git show 42874803 --stat` (no context-pack change) | evidence-only, before slice 2 starts: rewrite "Current state", "Implemented locally", "Gate state", "Resume point" to head `369928cf` / content `42874803`, both IMPL-EVAL verdicts, the withdrawn export, and Ruling 1's conditions. |
| G-4 | low | `CommonErrorMap` docs row (`index.md:58`) and JSDoc, plus `contract-primitives.ts:130` `{@link commonErrorMap}`, describe the type by reference to a symbol that is no longer public. | grep; `deno doc --lint` does not flag it | fix in slice 3's docs/compat pass: describe the type on its own terms ("the standard NetScript error map carried by every base route"), drop the `{@link}` to the private value. |
| G-5 | low | `supervisor.md` says "Written at run start" but was reconstructed at cycle 4; omits the original slice-1 thread `01a04f84…`; will lack this cycle-2 evaluator session until updated. | file header; `slices/1466/codex-thread-ids.md` | evidence-only, with G-3: add a "reconstructed at cycle 4 (F-5)" note, the original thread id, and the cycle-2 IMPL-EVAL session id/worktree. |

Non-findings, so they are not re-litigated: R-1, R-2, R-3 (settled inputs, all conditions verified); the `SKIPPED` receipt (Ruling 1); AF-1 (Ruling 2); the `status:plan` label (stale, coordinator-owned, noted in cycle 1 and by Tier-A); the D-3 base-behind-main drift.

## Lessons for promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| A source-text pin must be anchored to the declaration it guards, not counted file-wide | `stripCommentsAndStrings` + anchored regex on `export const <name>` | Archetype 1–2 test-shape | medium |
| A repair brief that ends "commit, push, stop" strands the PR commit trail | every implementation brief's closing step must include the per-slice PR comment and the `context-pack.md` refresh, or the supervisor posts them in the sign-off | harness `workflow/run-loop.md`, `templates/agent-briefing.md` | high |
| A `SKIPPED` receipt is the honest form when a ruling forbids re-execution — never recut a FAIL that did not run | receipt cites the ruling and the archived terminal record; the evaluator names the independent coverage of the delta | `gates/`, evaluator protocol | high |
| Run-identity files carry their own provenance | `supervisor.md` states when it was written/reconstructed and lists every thread id, not only the latest | harness templates | medium |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | **`PASS`** |
| Rationale | Every item of the re-evaluation scope cycle 1 fixed is met and was re-derived here, not accepted: F-1 withdrawn with zero consumers and the alias on the public type; F-2 closed by a pin that goes red under both the perturbation that defeated the old guard (B, also caught by `check`) and the one that did not (B2); F-3/F-4/F-5 delivered; doc-lint 12 = 12 with the exact R-1 set; `docs:exports-drift` exit 0; contracts tests 16/16; all eight receipts `gitHead == actualGitHead` at `42874803`; both archives byte-intact and append-only; `deno.lock` unchanged. The `test` receipt's `SKIPPED` form is ruled acceptable for this head with coverage named (Ruling 1) and AF-1's class is closed against launcher records (Ruling 2). Slice 1's substance is complete and no ruling is reopened. The open items are G-1 (a forgery-only test weakness, non-blocking), G-2/G-3/G-5 (supervisor bookkeeping — PR comment, `context-pack.md`, `supervisor.md` — none of which needs an implementation lane, a content change, or a recut) and G-4 (a prose item for slice 3). I weighed the strict `PASS` clause "run artifacts updated enough for resume" against G-3: `worklog.md` and this file are current and complete, so a resumer following the read order is not misled; a `FAIL_FIX` on failure 2 of 2 would escalate a leaf whose only defects are supervisor-side evidence edits, which is not what the escalation rule is for. |

### What remains before #1466 can close (stated for the coordinator, not implied)

1. **G-2, G-3, G-5 evidence-only edits** by the features supervisor before slice 2 is dispatched (no Codex cycle, no recut; content head unchanged).
2. **Slice 2 (SDK declaration propagation) and slice 3 (publish and compatibility evidence) are NOT RUN.** Each needs its own implementation cycle, Tier-A review, contracted receipts at its content head, `docs:exports-drift` as named supplemental evidence (R-3), and a separate-session IMPL-EVAL. Slice 2 should also take G-1.
3. **A final IMPL-EVAL `PASS` at the final head** covering all three slices, then the close-gate: all six #1466 acceptance boxes and the PR Definition-of-Done boxes (S1–S3, IMPL-EVAL) checked with linked evidence. PR #1731 carries `Closes #1466`; it must not be flipped ready or merged on slice 1.
4. **Root `test` green off this host** at the final head (Ruling 1 condition a) — the CI matrix on ready-flip.
5. **Coordinator follow-ups** already routed: `docs-exports-drift` catalog entry + gate-matrix row (R-3); the stale `status:plan` label on #1731.

Failure count for this leaf's IMPL-EVAL loop: unchanged at 1 of 2 — this cycle did not fail.

### Addendum (cycle 2, same session) — R-1's root-`test` premise is gone; Ruling 1 reframed

After the verdict above was committed (`ff4e81cc`), the features supervisor withdrew the brief's
"do not retry root `test` (R-1)" instruction, stating the host reaper defect behind R-1/D-26 was
fixed. I did not take that on trust.

**Host state, measured by me (2026-08-30, host `ai-agents`):**

- `/proc/1/comm` = `tini` (`tini -- ttyd … tmux …`): a real init that reaps.
- `ps -eo stat= | grep -c '^Z'` = **0**; PID-1-owned zombies = **0**. D-26 recorded 7,733 and the
  cycle-1 verdict counted 7,979 when R-1 was written.
- `hybrid-launcher_test.ts:164-176` polls `Deno.kill(pid, 0)` for `NotFound`, which a zombie never
  yields until reaped. With zero zombies that loop can terminate — the exact reason R-1 said the
  test "can never observe `NotFound` on this host" no longer holds.
- `/proc/sys/fs/inotify/max_user_instances` = **128** (unchanged). D-29's `watchFs` half is not
  fixed by this host change; only the zombie/reaper half is.

**Root `test`, run by me — not the supervisor's number.** `deno task test` in this worktree at
`ff4e81cc` (source byte-identical to content head `42874803`: `git diff 42874803..HEAD -- . ':!.llm/runs'`
is empty), started `09:47:28Z` after the host's other `deno test` invocations drained (the 14
processes still matching `deno.*test` were Codex resume/launch tooling in other worktrees whose paths
contain "test", not test runs):

```text
exitCode 0 · durationMs 190644 · passed 4250 · failed 0 · ignored 19 · uniqueFailures 0
```

Previous terminal record (frozen-235482767, attempt 4): 4248 passed / 1 failed / 19 ignored. The +2 are
the new F-2 pin test and `hybrid-launcher_test.ts` "exact MCP permissions cancel a stubborn worker group
without an orphan", now green. The cycle-2 `Too many open files` / `watchFs` failure (D-6) did not
recur at `max_user_instances` = 128. Tree clean after the run.

**Ruling 1, reframed.** The question is no longer whether a `SKIPPED` receipt satisfies the gate
when the gate cannot run; it is whether a `SKIPPED` receipt is acceptable at all now that it can.

- **Ruled: no.** `SKIPPED` was the honest form *only* under R-1's no-retry condition, and that
  condition was explicitly premised on a host defect that is now gone. R-1's root-`test` half loses its
  premise; its `public-doc-lint` half (baseline-red on `main`, delta 0, set identity verified above) is
  untouched and stands. With the gate runnable, the contracted `test` receipt at the content head must
  be a real run. My own green run is the evaluator's independent verification (protocol rule 6); it is
  not the leaf's durable receipt.
- **What the receipt must show** (finding **G-6**, medium, evidence-only, no content change, no Codex
  cycle required): `receipts/test-final.json` cut through `.llm/tools/gates/run-gate.ts` with
  `gateId: test`, `invocationId: 1466-test-final`, `attempt: 6`, `argv: ["deno","task","test"]`,
  `gitHead == actualGitHead == 42874803e572…` (the **content** head — cut it in a detached checkout at
  `42874803`, not at an evidence commit), `outcome: PASS`, `exitCode: 0`, a summary of the shape
  `4250 passed / 0 failed / 19 ignored` (an equal-or-higher pass count with 0 failed is acceptable if
  the ignored set is unchanged), and no `reason` field. The attempt-5 `SKIPPED` receipt is not
  overwritten silently: archive it unchanged (append-only, e.g. `receipts/frozen-42874803-attempt5/`)
  so the record shows why a run was skipped and when it became runnable. Recompute
  `audit/evidence-sufficiency` over the eight literal paths and record it.
- **What this does to sufficiency and to "terminal".** After G-6, the named-set sufficiency at
  `42874803` is `INSUFFICIENT` for exactly **one** reason — `public-doc-lint` FAIL, the R-1
  baseline-red/delta-0 external — instead of two. That is the terminal expected state for this leaf:
  seven real PASS receipts plus one ruled baseline red. Until G-6 lands, slice 1 is **complete on
  substance but not terminal on evidence**; the `PASS` above stands on substance (every gate verified
  independently, root `test` now included), and G-6 joins G-2/G-3/G-5 as the evidence-only work the
  supervisor must land before slice 2 is dispatched. Ruling 1's condition (a) — root `test` green
  off this host before ready-flip — is now satisfied locally as well, but the CI matrix at ready-flip
  remains the off-host confirmation.
- Slices 2 and 3 must cut real root-`test` receipts at their content heads; `SKIPPED` is no longer an
  available form on this host.

**Drift to record (coordinator-owned, not this session's file):** D-26 and the cycle-1 R-1 root-`test`
half should be marked superseded by the host fix with the measurements above; D-29 stays open.

Verdict unchanged: **`PASS`**. Required evidence-only actions before slice 2: G-2, G-3, G-5, **G-6**.

**Post-rebase observation (same session).** While this addendum was being written the lane landed
`1f0cdef2` (G-2/G-3/G-5 plus a root-`test` recut), `2863d29e` (slice 2 content — outside this verdict)
and `dce16175` (slice 2 evidence). Checked against G-6 above:

- G-2 posted (`[PHASE: IMPL-EVAL] Slice 1 — PASS…` at `09:18:19Z`), G-3 `context-pack.md` rewritten,
  G-5 `supervisor.md` updated — all closed.
- G-6: `test-final.json` attempt 7, `PASS`, exit 0, `gitHead == actualGitHead == ff4e81cc` — the
  evidence head, not `42874803`. The worklog states this deliberately: the run happened at `ff4e81cc`,
  and attesting a head it did not run at (`--allow-git-head-mismatch`) would break the
  `gitHead == actualGitHead` invariant. **Accepted**: product is byte-identical between the two heads
  (my own empty `git diff 42874803..ff4e81cc -- . ':!.llm/runs'`), and an honest head with proven
  content identity is the sounder form than the one I prescribed. `evidence-sufficiency-slice1-final.json`
  reports `INSUFFICIENT` for the single `public-doc-lint` reason — the terminal expected state.
- **G-7 (low, evidence-only):** the attempt-5 `SKIPPED` receipt was overwritten in place by `1f0cdef2`
  without being archived first; the later `frozen-42874803/` set holds seven attempt-5 receipts at
  `42874803` and the attempt-7 `test` receipt at `ff4e81cc`, so the archive named for the content head
  neither contains the receipt that explains why `test` was skipped there nor is homogeneous. The record
  survives only in git (`dd201816:…/receipts/test-final.json`) and in worklog prose. Required: restore it
  as `receipts/frozen-42874803/test-final.attempt5-skipped.json` (byte-for-byte from `dd201816`) and note
  the set's mixed heads in the worklog. Not blocking; does not reopen anything.

Slice 1 is therefore **terminal on evidence as well as substance** at the slice-1 record
(`42874803` content, `ff4e81cc` test attestation), with G-1/G-4 carried into slices 2/3 and G-7 as
an evidence-only tidy-up. Slice 2 (`2863d29e`) has not been evaluated by this session and needs its
own separate-session IMPL-EVAL.

---

# Evaluation — FINAL all-slices IMPL-EVAL: #1466 slices 1–3 (PR #1731)

This section is appended by the final all-slices IMPL-EVAL session. Nothing above this rule was
modified; `git diff` of this commit shows only additions at the end of this file.

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-sdk-procedure-meta--1466` |
| Target | **The whole leaf.** Slice 1 (`42874803`, standing cycle-2 `PASS`, checked only for regression), slice 2 (`2863d29e`, SDK declaration propagation + G-1, never formally evaluated), slice 3 (`9ab779ce`, publish & compatibility evidence + G-4/AF-1, never formally evaluated). Terminal gate for #1466. |
| Archetype | 2 — Integration (`packages/sdk`, governing); `packages/contracts` portion Archetype 1; docs overlay (package READMEs, JSDoc, `docs/site/reference/contracts/index.md`) |
| Evaluator | Claude Fable 5 · medium, `formal_impl_evaluation` (`lane-policy.md:46`, native opposite-family for Codex work), fresh separate session `8d9946e6`, 2026-08-30. Generators: Codex `gpt-5.6-sol` · high, threads `01a051f8…` (S2) and `01a05215…` (S3); S1 threads as recorded in `supervisor.md`. Both prior evaluator sessions (`00ec0e55…`, `b13a38f6…`) are different sessions from this one. |
| Worktree | `/home/agent/projects/netscript/worktrees/ns1466-impleval-final`, detached; `007-leaf-1731` (author) not touched (D-19). A scratch detached worktree of `origin/main` was created under the job tmp dir for the doc-lint baseline and removed afterwards (`git worktree remove`). |

### Immutable identity

- `git rev-parse HEAD` = `origin/feat/sdk-procedure-meta` (fetched live) = PR #1731 `headRefOid` (live `gh`) = **`e34505f187970dac261dce2ddc898c5baedd83c3`**. All three agree.
- PR OPEN, **draft**, milestone `0.0.7`, labels `status:impl-eval, type:feat, priority:p1, area:sdk, area:contracts, epic:sdk-client-contrib` (exactly one `status:`). Body carries **`Refs #1466 — partial`**, states "This PR does not complete #1466", and its `## Slices` list still marks S2/S3 "NOT RUN". Issue #1466 OPEN, six acceptance boxes unchecked, `status:impl-eval`.
- Content heads: S1 `42874803`, S2 `2863d29e`, S3 `9ab779ce`. `git diff 9ab779ce..HEAD -- . ':!.llm/runs'` is **empty** — this evaluation's product tree is byte-identical to the S3 content head; `e19de923` and `e34505f1` are evidence-only.
- `deno.lock`: `git rev-parse <c>:deno.lock` = `a1522e6e…` at `21d516224` (base), `42874803`, `2863d29e`, `9ab779ce`, `HEAD`, and `origin/main`. **Byte-unchanged across the whole branch.**
- Merge base `21d516224`; `origin/main` still `13878a80a` (3 commits ahead); `git diff 21d516224..origin/main -- packages/contracts packages/sdk deno.lock docs/site/reference/contracts .llm/tools/gates` is empty. D-3's inert-drift reasoning still holds; no rebase needed.
- Tree clean before and after: every perturbation below was restored with `git checkout -- <file>` and the one scratch fixture deleted; `git status --porcelain` was empty after each case and at the end.

## Process verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | unchanged: `plan-eval.md` cycle 2 `PASS` at `7db3954bf`, before `c9a39181` |
| Design section in worklog | PASS | `worklog.md` `## Design`, unchanged |
| Commit slices match the plan's three slices | PASS | S1 `c9a39181…42874803` (+repairs), S2 `2863d29e` (one content commit, files exactly the plan's slice-2 list plus the contracts pin file G-1 assigned to it), S3 `9ab779ce` (docs row, JSDoc paragraph, two comment lines — "no feature expansion" honoured: +7/−3 product lines) |
| Each slice has its named gate | PASS (ruled) | eight receipts at each content head; `public-doc-lint` baseline-red/delta-0 per R-1 (§ Re-measurement 1) |
| Per-slice PR comment (commit trail) | PASS | 14 comments; S2 `[PHASE: IMPL]` at `09:45:05Z`, S3 `[PHASE: IMPL] [VERDICT: COMPLETE]` at `10:16:17Z`. Only the supervisor's evidence-only G-7 commit `e34505f1` has no comment (noted, not a finding — supervisor bookkeeping, no product change) |
| Tier-A slice review before sign-off | PASS | `tier-a-review-1466-s2.md` and `…-s3.md` (features supervisor, Opus 5 high, worktree `ns1466-tiera-c4`), both `ACCEPTED`, both re-measured rather than self-certified. Read here as claims and re-derived below. |
| Agent briefs carry `## SKILL` | PASS | `slices/impl-eval-1466-final.md` (this brief) carries `## SKILL`; S2/S3 briefs asserted by the Tier-A records |
| `supervisor.md` current | **PASS with H-3** | present; stale for S2/S3 (thread ids, effort, reviews, this session) — evidence-only |
| Evaluator route | PASS | Fable 5 · medium, native opposite-family primary; no escalation needed |
| Release-gate class (rule 14) | N/A | not a cut or release-gating run; no runtime lease held; no E2E/Aspire/Docker/browser gate run |

## Re-measurement (nothing below is taken from the supervisor or the authors)

### 1. `public-doc-lint` at the final head vs `main` — set identity, not count

Receipt argv (16 entrypoints, `receipts/public-doc-lint-final.json`), run at `e34505f1` and in the scratch `origin/main` worktree at `13878a80a`:

- `main`: exit 1, 12 `private-type-ref` findings. Head: exit 1, 12.
- Sorted `(public symbol → private type)` pairs: **9 identical**. `main`-only: `BaseContractOutputRoute→BaseContractErrors`, `BaseContractRoute→BaseContractErrors`, `baseContract→oc`. Head-only: `BaseContractErrors→MergedErrorMap`, `baseContract→ContractBuilder`, `baseContract→Schema`.

Exactly the R-1 set, at a fourth consecutive content head (`42874803`, `2863d29e`, `9ab779ce`, and the final evidence head). S2 added two public SDK types and S3 rewrote public JSDoc: **zero** findings moved. The head-side residuals are the same three AP-14-protected upstream names R-1 recorded.

### 2. The G-1 anchored pin — required forgery, then my own

Committed pin (`packages/contracts/tests/assertion-budget_test.ts:131`):
`/export\s+const\s+baseContract\s*:[^=;]+?=\s*oc\.\$meta<NetScriptProcedureMeta>\(\{\}\)\.errors\(commonErrorMap\);/g`, count must be exactly 1 over comment/string-stripped source.

| Probe | `check` (primitives + both fixtures + inference probe) | `lint` | pin test | notes |
| --- | --- | --- | --- | --- |
| Head, unmodified | exit 0 | exit 0 | 5/5 | baseline |
| **P1 (required)** — B2 (`NetScriptProcedureMeta & { readonly extra?: string }`) **plus** the dead decoy `const _legacyBase = oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap); void _legacyBase;` | exit 0 | exit 0 | **RED** — `4 passed / 1 failed` | the cycle-2 forgery is defeated; Tier-A's and the author's results reproduced |
| P2 — B2 + the decoy inside `namespace _legacy { export const baseContract: … = …; }` | exit 0 | **exit 1** `no-namespace` | GREEN (count 1 = decoy) | not a working forgery: the contracted `lint` gate rejects it |
| P3 — initializer byte-identical; `import type { NetScriptProcedureMeta as OwnedProcedureMeta }` + local `type NetScriptProcedureMeta = OwnedProcedureMeta & { readonly extra?: string }`; `BaseContractMeta` re-pointed at `OwnedProcedureMeta` | exit 0 | exit 0 | pin GREEN, but the **assertion-budget test goes RED** (`as` in the import rename counts as an assertion token) | caught, incidentally, by the sibling scanner |
| **P3b — same rebinding without an `as` token**: `type NetScriptProcedureMeta = import('../domain/procedure-meta.ts').NetScriptProcedureMeta & { readonly extra?: string };` replacing the import; `BaseContractMeta` re-pointed at the `import()` type | **exit 0** | **exit 0** | **GREEN 5/5** | full contracts suite **16/16**, `quality:scan` exit 0, 16-entrypoint doc-lint still 12 findings. **A working forgery against the anchored pin** — finding **H-1** |

What P3b shows: the pin is a *text* pin. It fixes the spelling of the initializer statement but not the binding of the identifiers inside it; rebinding `NetScriptProcedureMeta` (or `commonErrorMap`, or `oc`) to a divergent local declaration keeps the text identical and every contracted gate green. Impact is the same bounded class cycle 2 assigned to G-1: a deliberate forgery, visible in any diff, with **no consumer-visible effect** under `isolatedDeclarations` (the annotation is the published declaration and the runtime value is `{}` either way). Non-blocking; required action in H-1.

### 3. AF-1 — is `[^=;]+?` brittle on correct code?

Yes, at the regex level, by construction: the span cannot contain `=` or `;`, so any annotation that legitimately contains a `=>` function type, a `;`-separated object-type literal, or a default type parameter stops the pattern from matching. I demonstrated both characters (P4: a `;`-bearing mapped type in generic position 3; P5: a `=>`-bearing intersection in position 4) — the pin went **RED** in both cases. I note honestly that neither perturbation was type-identical to the current annotation (both also failed `check` on the `Equal<>` fixtures), so this is a demonstration of the *pattern's* behaviour, not of a false red on a real refactor; no such refactor exists at this head. D-31's reason for the bounded span is sound (an unbounded `[\s\S]*?` re-opens the cross-statement decoy). The author's comment names the trap and the correct response and is an **adequate mitigation for now**; the robust form is the statement-extraction approach in H-2, which also removes the character restriction. Not blocking.

### 4. S2 — metadata propagation, broken on purpose

Guard: `deno check --unstable-kv packages/sdk/tests/type-fixtures/procedure-meta_type.ts` (exit 0 at head; the root `check` wrapper selects `_type.ts` fixtures — verified, 10 files selected under `packages/sdk/tests/type-fixtures`).

| Perturbation (product file) | Result |
| --- | --- |
| S1 `ProcedureMetaFromNode` → always `Record<never, never>` | **RED** — 4× TS2344 (direct, generated, query-marker, extractor) |
| S2 `ProcedureMetaFromNode` → `TMeta & { readonly extra?: string }` | **RED** — 4× TS2344 |
| S3 `ActionMethod.__netscriptProcedureMeta` marker removed | **RED** — TS2339 |
| S4 `ProcedureMeta` alias → `Record<string, unknown>` | **RED** — 2× TS2344 **and TS2578** (the negative fixture's `@ts-expect-error` becomes unused — the negative half fails correctly when the type is loosened) |
| S5 client error `code: K` → `code: string` | **RED** — TS2344 on `_DirectClientErrorCodesRemainExact` |
| S6 `DefinedServiceQueries` → `QueryFactory<ContractLike>` | **RED** — TS2339 (`list` no longer exists on the loosened factory) |
| S7 `__netscriptServiceContract?: TContract` → `ContractLike` | **RED** — 4× TS2339 (direct and generated) |

Every declaration the fixture claims can be made to fail by a product edit; the fixture is a contract, not a tautology.

**S8 — unannotated route probe (scratch fixture, deleted).** The committed fixture annotates its route with `BaseContractRoute<…>`, so I added a scratch `_type.ts` in which the route is *inferred* (`baseContract.route(...).input(...).output(...).meta({ access: { authentication: 'required' } })`, no annotation) and asserted, through `ServiceClient`, `defineServices(...).queries.svc.get.__netscriptProcedureMeta`, and `ProcedureMeta<typeof c, 'get'>`, that meta is exactly `BaseContractMeta`, the `~orpc.errorMap` is exactly `BaseContractErrors`, and the client method's defined-error `code` union is exactly the six literals — plus a sanity assertion that `Equal<…, Record<never, never>>` is `false`. **exit 0.** Metadata and error literals reach direct clients, generated clients, and query factories from the real initializer path, not only from the annotation.

**Boundary hygiene.** `packages/sdk/tests/assertion-budget_test.ts` pins `ports/service-client.ts` = 0, `ports/query-factory.ts` = 0, `presets/define-services.ts` = 1, `client/service-client.ts` = 1, `query/query-factory.ts` = 5 — the plan's re-measured baselines exactly — and zero `any` in the two port files; all in the 94/94 package run. `ProcedureMetaFromNode` is structural (`'~orpc'.meta` inference), imports nothing from `@netscript/contracts`; the doc-JSON independence test covers the five symbols and passes. The `__netscriptProcedureMeta` optional marker follows the existing `__netscriptServiceContract` / `__netscriptSchemas` precedent.

### 5. S3 — publish & compatibility evidence, re-run

- Per-member `deno publish --dry-run --allow-dirty`: contracts exit 0, sdk exit 0, both `Success Dry run complete`. Workspace receipt `publish-dry-run-final.json` PASS at `9ab779ce`.
- `isolatedDeclarations: true` at root `deno.json:175`; neither member `deno.json` sets the key (verified by grep) — inherited, no opt-out.
- Exact `@netscript/*` pins: contracts none; SDK exactly `@netscript/service = jsr:@netscript/service@0.0.6`.
- JSR audit (`audit-jsr-package.ts`, re-run): contracts — one **INFO** (sanctioned oRPC slow-types); SDK — two **WARN** (`src/` 13 immediate children vs cap 12; slow-types banner), **no FAIL**. The cardinality WARN is base-inherited: `packages/sdk/src` has **13 entries on `origin/main` and 13 at head** (my own `ls | wc -l` in both trees), matching the features run's D-36. Reported, not adjusted; a coordinator debt/split question, not this leaf's.
- G-4 closed by absence: `grep -rn '{@link commonErrorMap}' packages/` → none; `grep -rn 'shape of .commonErrorMap' docs/ packages/` → none; `commonErrorMap` absent from `src/public/mod.ts`. The value stays private (R-2 honoured); the fix did not re-export it.
- `deno task docs:exports-drift` → **PASS, exit 0**; contracts `complete` with 0 omitted groups, SDK `entrypoints-only` with 0 omitted groups.
- `deno task quality:gate` (scan + `arch:check`) → exit 0.

### 6. Receipts and archives

All eight top-level receipts: attempt 9, `invocationId = 1466-<gateId>-final`, **`gitHead == actualGitHead == 9ab779ce…`** on every file, outcomes 7 PASS / `public-doc-lint` FAIL exit 1; `test` summary `4258 passed / 0 failed / 19 ignored`, no `reason` field, no `SKIPPED`. `frozen-2863d29e/`: attempt 8, all at `2863d29e`, `test` PASS 4258/0/19. `frozen-42874803/`: seven attempt-5 receipts at `42874803`, `test-final.json` attempt 7 PASS 4250/0/19 at `ff4e81cc` (product identity `42874803..ff4e81cc` re-verified empty), and the restored `test-final.attempt5-skipped.json` (attempt 5, `SKIPPED`, at `42874803`).

Byte integrity: every file in `frozen-2863d29e/` equals its blob at `dce16175:receipts/*-final.json`; every file in `frozen-42874803/` (the eight) equals its blob at `1f0cdef2:receipts/*-final.json`; every file in `frozen-235482767/` equals `fc81e652:receipts/*-final.json`; `frozen-c9a391811/` unchanged since `fc81e652`. **G-7 restoration is byte-faithful**: `git show dd201816:…/receipts/test-final.json | sha256sum` = `0d5d2c3d…f720e92fca` = the restored file. `git log --all --diff-filter=MD -- receipts/frozen-*` is **empty**: append-only holds for all four archives.

Root `test` by me at `e34505f1` (product ≡ `9ab779ce`): `deno task test` → exit 0, **4258 passed / 0 failed / 19 ignored**, 212 s. Host: PID 1 `tini`, zombies 0. That is protocol rule 6's independent verification of the contracted `test` receipt; the addendum's condition (a) — root `test` green off the defective host — is met locally at the final head, and the CI matrix at ready-flip remains the off-host confirmation (all matrix jobs at `e34505f1` are `skipping` on the draft; only the Pages docs classifier ran, pass).

### 7. Regression check of S1 by S2/S3

S2 touched one S1 file (`contracts/tests/assertion-budget_test.ts`, the pin — strengthened, G-1); S3 touched `contract-primitives.ts` JSDoc only, the docs row, and the pin's comment. Contracts suite **16/16**; contracts fixture + inference probe `check` exit 0; doc-lint set unchanged (§1); `BaseContractMeta`/`BaseContractErrors`/`baseContract` declarations unchanged since `42874803`; `commonErrorMap` still private; R-2's alias (`MergedErrorMap<Record<never, never>, CommonErrorMap>`) intact. **No regression.**

## Acceptance points (#1466) — the whole leaf

| # | Point | Result | Evidence (re-derived here) |
| - | ----- | ------ | -------- |
| 1 | `NetScriptProcedureMeta` has a public, versionable NetScript-owned shape | **PASS** | S1 unchanged; `src/domain/procedure-meta.ts` zero imports (scanner), exported via `public/mod.ts`; doc-JSON independence test green |
| 2 | Existing contract error literals remain preserved end to end | **PASS** | S5 (code literal widened → red), fixture status `404`/message `'Resource not found'`/data identity assertions; S8 inferred-route error map ≡ `BaseContractErrors`; `readme-doctest` `safe()` pin green |
| 3 | Metadata reaches direct clients, generated clients, and query factories without casts or `any` | **PASS** | S1–S7 all red on breakage; S8 inferred path green; SDK assertion budgets 0/0 at the boundary, zero `any`; `quality:gate` green |
| 4 | Positive and negative type fixtures exercise real exports | **PASS** | SDK fixture imports `@netscript/contracts`, `@netscript/sdk`, `@netscript/sdk/ports`, `@netscript/sdk/query` (L5); negative `@ts-expect-error` twins fail correctly when loosened (S4 TS2578); contracts fixtures per S1 |
| 5 | Public docs explain ownership and compatibility boundaries | **PASS** | contracts README + reference (S1, F-4 corrected); `CommonErrorMap` row and `baseContract` JSDoc describe the map on its own terms (G-4); SDK README bullet + `./ports` row; `docs:exports-drift` PASS |
| 6 | Required SDK/contracts gates and IMPL-EVAL pass | **PASS** | eight receipts at each content head, seven PASS + one ruled baseline-red (R-1, set-identical); root `test` re-run green; this verdict |

**All six acceptance points are met on substance.** The issue's boxes are unchecked; ticking them with linked evidence is the coordinator's close-gate step, not this session's.

## Static gates

| Gate | Command or check | Result | Evidence |
| --- | --- | --- | --- |
| Narrow typecheck | `deno check --unstable-kv` primitives + both fixtures + probe + doctest | PASS | exit 0 (baseline of the perturbation tables) |
| Root typecheck | `receipts/check-final.json` | PASS | attempt 9, `9ab779ce` |
| Format / Lint | `fmt-check-final.json`, `lint-final.json` | PASS | attempt 9 |
| Doc lint | 16-entrypoint `deno doc --lint`, head vs `main` | FAIL (baseline-red, delta 0, set identical) | § 1 |
| Publish dry-run | workspace receipt + per-member re-run | PASS | § 5 |
| Exports drift | `deno task docs:exports-drift` (R-3 supplemental) | PASS | exit 0 |
| Package tests | `deno test --allow-all packages/contracts packages/sdk` | PASS | 94/94 |
| Root test | receipt attempt 9 + my run | PASS | 4258/0/19 both |
| Quality gate / arch | `deno task quality:gate` | PASS | exit 0 |

## Fitness gates

| Gate | Function | Result | Evidence |
| --- | --- | --- | --- |
| F-3 | Layering | PASS | SDK ports import nothing from contracts; `arch-check` receipt PASS |
| F-5 | Public surface audit | PASS | contracts +3 types / 3 changed declarations; SDK +2 types (`./ports`, `./query`) + 1 changed interface — exactly the plan's delta; SDK root untouched (D-32 transitive visibility acknowledged) |
| F-6 | JSR publishability | PASS | dry-runs green; audits no FAIL; SDK WARNs base-inherited (D-36) |
| F-7 | Doc-score | PASS | 0 missing JSDoc; residual set = `main` |
| F-10 | Test-shape audit | PASS with H-1/H-2 | fixtures are real tripwires (S1–S7); pin is text-only (P3b) |
| F-15 | AP-14 re-export lint | PASS | no upstream type re-exported; independence test green |
| F-16 | Folder cardinality | pre-existing WARN | SDK `src/` 13 on `main` and head — not this leaf's |
| F-19 | Scoped source gate runners | PASS | receipts 1–3, 6–7 |

## Runtime / consumer gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Runtime metadata storage | `procedure-meta_test.ts` | PASS | in 94/94 |
| Consumer: `@netscript/sdk` | fixture + doctest + S8 | PASS | exit 0 |
| Consumer: plugins / templates | grep for withdrawn value | N/A | zero consumers |
| Expensive gates | `scaffold.runtime`, Aspire, Docker, browser | NOT RUN | no lease; not applicable |

## Anti-pattern check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-14 | CLEAR | `ProcedureMetaFromNode`/`ProcedureMeta` structural; no `@orpc` in their doc-JSON subtrees; doc-lint set unchanged |
| others | N/A | no runtime, folder, naming, saga, console, or permission surface changed |

## Arch-debt delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | no #1466 entry; none owed — no doctrine violation introduced |
| Resolved / deepened | 0 | — |
| Unrecorded violations | 0 for this leaf | the SDK `src/` cardinality overage (D-36) predates the branch and is not in `arch-debt.md`; a coordinator follow-up, not a `FAIL_DEBT` trigger for work that did not touch it |

## Findings (final)

| ID | Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- | --- |
| H-1 | low | The anchored G-1 pin is defeated by identifier rebinding: replacing the `NetScriptProcedureMeta` import with `type NetScriptProcedureMeta = import('../domain/procedure-meta.ts').NetScriptProcedureMeta & { readonly extra?: string }` (and re-pointing `BaseContractMeta` at the `import()` type) keeps the initializer text identical and every contracted gate green. | § 2, P3b | non-blocking follow-up (any later contracts slice, or the H-2 follow-up): pin the bindings too — stripped source contains exactly one `import type { NetScriptProcedureMeta } from '../domain/procedure-meta.ts'`, zero `type NetScriptProcedureMeta`, zero `import(`, exactly one `const commonErrorMap: CommonErrorMap =`, and `oc` imported only from `@orpc/contract`. |
| H-2 | low | `[^=;]+?` is a character restriction standing in for a statement boundary; it fails to match on any annotation containing `=` or `;`. The author's comment is an adequate interim mitigation. | § 3, P4/P5 | non-blocking follow-up: extract the `export const baseContract` statement with a depth-aware scan (track `<>`, `()`, `{}`, `[]` to the terminating `;`) and assert its initializer text exactly — removes the restriction without re-opening the cross-statement decoy. |
| H-3 | low (evidence-only) | `supervisor.md` is stale for S2/S3: it omits author threads `01a051f8…` (S2) and `01a05215…` (S3), records `complex_implementation · high` as "original slice-1 only" although S2/S3 ran at high, omits the S2/S3 Tier-A reviews, and lacks this session. | file at `e34505f1` vs Tier-A S2/S3 records | coordinator, evidence-only: add the two threads and efforts, the two Tier-A rows, and this session (`8d9946e6`, worktree `ns1466-impleval-final`, verdict below). No content change. |
| H-4 | info | SDK JSR WARNs (`src/` cardinality 13 > 12; slow-types banner) are base-inherited and unrecorded in `arch-debt.md`. | § 5; D-36 | coordinator follow-up outside this leaf: record as debt or schedule the split. |

Non-findings, so they are not re-litigated: R-1 (both halves as settled — root-`test` half void, doc-lint half verified), R-2/F-1, R-3, AP-14, D-3 drift, the `SKIPPED` history (archived, byte-faithful), G-1…G-7 (all closed or carried as stated), AF-1 (H-2 is its follow-up form).

## Rulings requested of this gate

### Ruling A — is #1466 complete?

**Yes.** All six acceptance points are met across the three slices, each re-derived above rather than accepted from the slice reports. The leaf's product delta is exactly the PLAN-EVAL-approved public-surface delta; every test that claims to guard something was made to fail by a product edit; every contracted receipt is real, at its content head, with `gitHead == actualGitHead`; and no doctrine violation or debt was introduced. Nothing remains for an implementation lane.

### Ruling B — is the leaf close-gate ready (`netscript-pr` rule 12)?

**Ready on substance; not yet in form.** This PASS completes the evaluator half. What the coordinator must do, in order, before `status:ready-merge` / merge — none of it is this session's to perform:

1. **PR body**: this PR now completes #1466, so the closing keyword is owed — replace `Refs #1466 — partial` with **`Closes #1466`** in `## Scope`, delete the "This PR does not complete #1466" paragraph and the "Remaining scope" section, mark the `## Slices` rows S2/S3/IMPL-EVAL done with the content heads, and check the three open Definition-of-Done boxes with links (S2 fixture + this section for declarations; the attempt-9 receipt set for gates; this verdict for IMPL-EVAL). Keep `Part of #1348` without a keyword.
2. **Issue #1466**: an `acceptance-evidence` block mapping all six boxes (evidence: this section, the receipt paths, the S2 fixture, the S3 audit doc), validated with `mirror-acceptance-evidence.ts --dry-run` then applied.
3. **`supervisor.md`** H-3 edit and the H-1/H-2/H-4 follow-ups filed (issues), plus the still-open R-3 catalog-entry follow-up.
4. **Ready-flip**: this triggers the CI matrix (root `test` off-host — the remaining condition from the cycle-2 addendum) and, per the evaluator protocol, dispatches an OpenHands IMPL-EVAL unless `impl-eval:skip` is present. The native opposite-family IMPL-EVAL is this one; whether to add `impl-eval:skip` is the coordinator's call, but two evaluators on the same head should be a deliberate choice, not an accident of the flip.
5. **Label** `status:impl-eval` → `status:ready-merge` only after the matrix is green; then `gh run rerun` so the close-gate and mirror jobs read live labels. Do not push to refresh them — a push invalidates this verdict's head.
6. **Merge** stays a human decision.

### Ruling C — is a permanently baseline-red `public-doc-lint` acceptable to merge on?

**Yes, for this leaf, on the delta-0-with-set-identity standard — and that standard is sufficient only because it is measured, not asserted.** The 12 residual findings are all `private-type-ref` to upstream oRPC/TanStack names that AP-14 forbids re-exporting; a green gate would require either re-exporting them (a doctrine violation) or hiding real public types (a worse docs outcome). Four consecutive heads have held the exact set, and two evaluators plus a Tier-A reviewer have re-derived it independently. Merging on it does not weaken anything the gate was contracted to detect: the branch-owned regression class (a new symbol referencing a new private type, or a missing JSDoc) would have moved the set, and `docs:exports-drift` covers the inventory class the receipt set was blind to (D-7).

What must change — **not before this merge, but before the next leaf relies on the same ruling**: the standard should become mechanical. A baseline-aware form of the gate (a checked-in expected-finding set the runner diffs against, failing on any addition or removal) would turn "an evaluator ruled the set identical" into a receipt-level PASS/FAIL, and would let the residual 12 be reviewed as one recorded item instead of re-ruled per leaf. That is a harness-tooling follow-up for the coordinator alongside the R-3 catalog entry; it is not a #1466 obligation.

### Ruling D — did S2/S3 regress S1?

**No** — § 7.

## Lessons for promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| A source-text pin fixes spelling, not binding; anchor the identifiers as well as the statement, or extract the statement with a depth-aware scan | pin imports/declarations of every identifier the pinned expression uses | Archetype 1–2 test-shape | medium |
| A baseline-red gate needs a checked-in baseline set, not a per-leaf evaluator ruling | `--baseline <set-file>` in the doc-lint runner; fail on set delta in either direction | harness `gates/`, `.llm/tools/docs/` | high |
| Prove propagation on the inferred path, not only the annotated one | pair each annotated-route fixture with an unannotated twin | Archetype 2 fixtures | medium |
| Tier-A acceptance that re-measures is a claim the evaluator still re-derives; both reviews here were accurate, which is the point of checking | keep the "read as claims to test" instruction in final-gate briefs | evaluator protocol | high |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **`PASS`** — terminal for #1466 |
| Rationale | Approved scope is complete across all three slices and was re-derived here: the S2 declarations preserve exact metadata and exact error literals through direct clients, `defineServices` clients and query factories, and every one of seven product-level breakages turns the real-export fixture red (plus an inferred-route probe green); S3's publish evidence re-runs green (workspace and per-member dry-runs, inherited `isolatedDeclarations`, exact pins, audits with no FAIL) and G-4 is closed without re-exposing the private value; the required G-1 forgery goes red; `public-doc-lint` is 12 = 12 with the exact R-1 set at the final head; `docs:exports-drift`, `quality:gate`, package suites 94/94 and root `test` 4258/0/19 are green by my own runs; all eight receipts at each content head attest `gitHead == actualGitHead` with real `test` PASSes and no `SKIPPED`; four archives are byte-intact and append-only, G-7's restoration byte-faithful; `deno.lock` is unchanged across the branch; no doctrine violation or debt was introduced; S1 is not regressed. The open items — H-1/H-2 (a text-pin forgery class already bounded by cycle 2's G-1 judgement, with no consumer-visible effect), H-3 (supervisor bookkeeping), H-4 (base-inherited debt) — are non-blocking follow-ups that need no implementation lane on this leaf. Close-gate form (PR body keyword, acceptance mirror, ready-flip, CI matrix, label) is the coordinator's and the merge is human. |

Failure count for this leaf's IMPL-EVAL loop: unchanged at 1 of 2. No re-evaluation scope: this verdict is terminal.
