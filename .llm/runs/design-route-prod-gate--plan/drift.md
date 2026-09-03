# Drift Log: `/design` production exclusion

No divergence from issue #1481, RFC 0005, the requested scope, or doctrine was identified during Phase 1 planning.

Future entries are append-only. In particular, implementation must record drift before expanding beyond `packages/cli/**` plus this run directory, weakening fail-closed runtime polarity, sharing one exclusion signal, or changing the hosted-only E2E constraint.

## D-1 — Runtime suite selector omitted from plan file list

- **Severity:** minor
- **Observed:** The plan names the new gate definition, gate ID, and `suite-registry_test.ts`, but omits `packages/cli/e2e/suites/scaffold/capability-suites.ts`. That existing file is the sole selector that maps registered gate IDs into `scaffold.runtime`/`scaffold.runtime.sqlite`.
- **Ruling:** Add the new gate ID to the existing `RUNTIME_GATES` list immediately after `scaffold.init`, as required by the approved gate ordering. Do not create a new gate file or directory child.
- **Scope effect:** One additional existing file under authorized `packages/cli/**`; no architecture, mechanism, or acceptance change.
- **Evidence:** `createScaffoldCapabilityGates()` registers `createGeneratedQualityGates()`, while `createScaffoldCapabilitySuite()` selects only IDs listed by `capability-suites.ts`.

## D-2 — Cross-feature service-client order assertion omitted from plan file list

- **Severity:** minor
- **Observed:** Hosted core CI at head `98699f4bd` passed both runtime tiers but failed one
  `service-client-runtime-probe_test.ts` assertion. The service-client test required
  `DATABASE_CODEGEN` and `GENERATED_SERVICE_CLIENT_CONTRACT` to be adjacent in both the service and
  runtime suites; #1481 intentionally inserts `SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` between those
  gates in the runtime suite.
- **Ruling:** Update the existing order assertion to preserve service-suite adjacency while
  explicitly requiring runtime order `DATABASE_CODEGEN` → `SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` →
  `GENERATED_SERVICE_CLIENT_CONTRACT`. Do not change runtime behavior, skip a test, or weaken either
  product contract.
- **Scope effect:** One additional existing test under authorized `packages/cli/e2e/**`; no public
  surface, mechanism, or runtime change.
- **Evidence:** CI run `33715250151`, job `100523026122`, uploaded `test.report.json`: 5235 passed /
  1 failed, exact diff `21` vs `22` at the named order test.

## D-3 — Canonical app-reference probe retained the retired showcase contract

- **Severity:** minor
- **Observed:** After merging `origin/main` `e14322c511` (#1956), exact-head SQLite/Garnet runtime
  job `100572750365` passed `scaffold.design-production-exclusion` and then failed only
  `behavior.app-reference`. The browser probe still requested seven legacy `?preview=` states and
  asserted showcase `data-state` markers, while #1956 intentionally retired that complete asset
  family and made the generated Form-B resource slice canonical at `/examples/users`.
- **Ruling:** Keep the root and `/design/composition` browser expectations, and replace only the
  retired preview-state expectations with stable generated-resource markers at `/examples/users`.
  Do not restore deleted showcase product assets or weaken the design-route assertions.
- **Scope effect:** One existing E2E probe and its focused test under authorized
  `packages/cli/e2e/**`; no scaffold product source, runtime implementation, or public surface
  change.
- **Evidence:** Run `33731627085`, SQLite/Garnet report: 83 passed / 1 failed;
  `scaffold.design-production-exclusion` returned clean/mutation/restored `true/true/true`, then
  `behavior.app-reference` failed on `/examples/users?preview=loading` missing
  `data-state="loading"`. Test-first RED reproduced 1 passed / 2 failed; the bounded probe/test
  repair passes 54/54 with the service/runtime order and suite-registry contracts.

## D-4 — Shared probe repair reassigned to #1958

- **Severity:** coordination correction; supersedes D-3's local ownership ruling
- **Observed:** After D-3's bounded repair was pushed, the primary coordinator identified PR #1958
  as the sole writer for the shared app-reference and served-island probe migration. #1958's
  canonical contract covers both the init-generated `/examples/users` resource and its generated
  `/people` resource, then proves the `PeopleIsland` marker/module/bundle surface. The narrower D-3
  patch would duplicate only part of that cross-feature repair.
- **Ruling:** Revert this branch's two shared probe/test hunks while retaining the raw diagnosis in
  the run record. Do not implement `PeopleIsland` here or rerun an unchanged failing runtime head.
  Wait for #1958 to pass its owner gates and merge, then integrate current main mechanically and
  preserve #1481's design-exclusion gate alongside the canonical resource probes.
- **Scope effect:** No shared probe product delta remains from D-3. This branch is explicitly
  blocked on the #1958 owner merge; its own design-route and suite-order changes remain intact.
- **Evidence:** Primary-coordinator comment on PR #1945,
  <https://github.com/rickylabs/netscript/pull/1945#issuecomment-5522782123>; #1958 head
  `73d3a3a96` has exact-head Tier-A check/test green and owns the pending hosted/evaluator closure.

## D-5 — Canonical resource-order assertion retained the pre-#1481 adjacency

- **Severity:** minor integration correction
- **Observed:** Exact-head core CI at `456abefbd` passed repository check and 5,260 tests, but
  failed `resource-slice-gates_test.ts` once. The assertion added by merged #1958 still required
  `GENERATED_SERVICE_CLIENT_CONTRACT` immediately after `DATABASE_CODEGEN`; #1481 intentionally
  places `SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` between those gates so its production build runs
  against the generated database slice.
- **Ruling:** Update only the new #1958 order test to assert the complete intended sequence:
  `DATABASE_CODEGEN` → `SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION` →
  `GENERATED_SERVICE_CLIENT_CONTRACT` → `SCAFFOLD_RESOURCE_GENERATE`. Do not alter a gate,
  product source, runtime behavior, skip, or xfail.
- **Scope effect:** One existing test under authorized `packages/cli/e2e/**`; this is a
  proportional integration assertion repair, not a new evaluator cycle or runtime product delta.
- **Evidence:** Core CI run `33744526413` at `456abefbd`; repository check passed with 3,137 files
  and 0 diagnostics, while repository test reported 5,260 passed / 1 failed / 14 ignored at
  `packages/cli/e2e/src/application/gates/scaffold/resource-slice-gates_test.ts:64`, with actual
  position `21` versus expected `20`.
