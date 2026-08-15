# Drift Log: sdk-typed-error-channel (#1350)

## 2026-08-15 — Real client error loss is outside the declared surface

- **What:** Exact procedure error identity is erased in `packages/sdk/src/ports/service-client.ts`,
  which is not one of the five declared files.
- **Source:** Executed `deno doc`, source map, and TS2339 RED.
- **Expected:** The declared surface was sufficient for an end-to-end `safe()` repair.
- **Actual:** `ServiceClientMethod` returns plain `Promise<TOutput>` before `safe()` sees the value;
  editing `errors.ts` alone cannot recover the missing type.
- **Severity:** significant
- **Action:** rescope; request topic-orchestrator authorization and stop product work.
- **Evidence:** `packages/sdk/src/ports/service-client.ts:165-196`;
  `packages/sdk/src/client/service-client.ts:41-65`; `research.md` §§1,3.

## 2026-08-15 — Procedure metadata ownership and barrel scope conflict

- **What:** The lane brief assigns procedure-metadata preservation to #1350, while live #1466 owns
  metadata initialization/export and #1350's existing maintainer comment explicitly excludes it.
- **Source:** RFC 0001, issues #1348/#1350/#1466 fetched on 2026-08-15, and declared file surface.
- **Expected:** Stage 0 had settled one unambiguous owner and the declared files could publish it.
- **Actual:** RFC 0001 says Stage 0 must choose; #1348 contains internally conflicting wording;
  #1466 is open; and the required curated root barrel is outside scope.
- **Severity:** architectural
- **Action:** rescope; brief treated as latest planning instruction, but implementation blocked for
  topic-orchestrator ruling.
- **Evidence:** `rfcs/0001-sdk-client-contributions.md:347-370,1267-1277`;
  `packages/contracts/src/public/mod.ts:1-6`; `research.md` “Re-baseline and authority.”

## 2026-08-15 — Out-of-scope published prose already describes the erasure

- **What:** Contracts/benchmark prose outside the two authorized docs pages explicitly says the
  public base contract is erased; a successful repair makes that prose false.
- **Source:** Executed whole-repo consumer search.
- **Expected:** The two declared docs pages were the complete affected narrative.
- **Actual:** Additional published/reference consumers exist.
- **Severity:** significant
- **Action:** request scope disposition; do not edit without authorization.
- **Evidence:** `packages/bench/tasks/t1-storefront-api/reference/README.md:45-47`;
  `packages/bench/tasks/t1-storefront-api/reference/netscript/router.ts:7-8`;
  `packages/contracts/README.md:13-76`.

## 2026-08-15 — Coordinator resolution locks six paths and #1466 metadata ownership

- **What:** The coordinator corrected the original brief after reconciling #1348's amendment and
  #1350 comment 5227724542.
- **Resolution:** `packages/sdk/src/ports/service-client.ts` is authorized as the sixth and final
  product path. Any seventh product/test/docs path requires a fresh ruling.
- **Metadata:** #1466 owns definition, initialization, export, and semantic proof. #1350 retains
  only the explicit fourth generic slot as `Record<never, never>` and introduces no vocabulary.
- **Denied:** The contracts public barrel and all metadata export work.
- **Deferred:** Stale contracts/benchmark prose remains tracked follow-up debt outside this leaf.
- **Phase effect:** The plan has no remaining must-resolve decision, but fresh Tier-A review and a
  separate PLAN-EVAL `PASS` remain hard stops before implementation.

## 2026-08-15 — PLAN-EVAL corrects the out-of-scope prose classification

- **What:** Original research grouped `packages/contracts/README.md` with benchmark prose that
  describes the old erasure.
- **Actual:** The contracts README says the common error map is applied, which remains true. Only
  the benchmark reference README/router contain the stale erasure claim.
- **Action:** Corrected existing research/plan/context artifacts. No new file or debt entry was
  created; the coordinator owns any later issue for the benchmark prose.
- **Scope:** Both locations remain outside the exact six-path ceiling; no product/docs edit here.

## 2026-08-15 — S4 raw doc-lint findings exceed the pinned baselines

- **What:** The plan-locked raw Contracts and SDK `deno doc --lint` gates are still red and now
  contain leaf-owned private-type-reference findings beyond their base sets.
- **Source:** Executed raw lint at immutable head `c7cba6d9b`, then executed the same commands over
  an archive of `main@0ef48c2e`; exact identity deltas are recorded in `worklog.md`.
- **Expected:** Pinned raw reds remain red with no new leaf-owned findings.
- **Actual:** Contracts changes from 9 to 11 (three additions, one removal); SDK changes from 3 to
  13 (ten additions). The additions name `baseContract`, `ServiceClientMethod`,
  `ServiceClientShape`, `SafeFailure`, `SafeResult`, `isDefinedError`, and `safe`.
- **Severity:** blocking final-gate regression.
- **Action:** Stop S4. Do not edit S1/S2 product files in the run-artifact-only slice. Remaining JSR
  and specifier/export guards are not run or claimed pending coordinator disposition.
- **Scope:** A correction necessarily returns to already-landed product paths and therefore needs a
  fresh authorized implementation slice; no seventh path is implied or authorized here.
