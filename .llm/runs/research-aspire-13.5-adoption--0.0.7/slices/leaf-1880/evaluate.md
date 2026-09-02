# Evaluation: PR #1952 — #1880 / #863 gate 2 readiness contract (IMPL-EVAL)

Separate-session evaluator. Head pinned at `478450a3c697b494e68f8c729ff0d9c8d74e5b68` (detached
worktree), diff base main `ba6f1f49a`. Read-only against git; no commit/push/checkout performed;
tree verified clean after every mutating-capable check.

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Run ID         | research-aspire-13.5-adoption--0.0.7 / leaf-1880         |
| Target         | PR #1952 (#1880 readiness contract, gate 2 of #863)      |
| Archetype      | N/A — e2e gate harness + reference docs                  |
| Scope overlays | docs                                                     |
| Evaluator      | separate session, OpenRouter z-ai/glm-5.3-flash xhigh, 2026-09-03 |

## Scope confirmation

`git diff --stat ba6f1f49a..HEAD` = exactly the expected 16-file set: 4 e2e gate sources
(`owned-container-log.ts` new, `readiness-disagreement.ts` new, `listener-unreachable-fixture.ts`,
`listener-readiness-gates.ts`), 4 e2e test files (2 new), `docs/site/reference/aspire/index.md`,
`.llm/tools/docs/check-accuracy-and-discoverability.ts`, 4 regenerated carriers
(`prose.json.gz`, `provenance.json`, `agent-docs.generated.ts`, `publish-assets.generated.ts`),
and 2 run-evidence files (`aspire-1880-readiness-converge--1952/evidence.md`,
`research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv`). Nothing else.

## Acceptance judgement (#1880 = #863 gate 2: corrected probe OR documented contract + deterministic reproduction + regression gate; PR chose the contract)

### 1. Reproduction — PASS

- `observeReadinessDisagreement(projectRoot, unhealthyEvidence.testOnly)` runs at
  `packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts:136-138`,
  gated on `expectation.controllerListener === 'postgres'`, inside the subscription opened at
  `:122` and closed at `:172`, after the departure evidence is gathered at `:129-134` and **before**
  the recovery command at `:140` — so the container log is read during the induced failure window,
  same-moment with the Unhealthy report. Mirrors the #1909/#1957 subscribe-first pattern.
- Ownership proof: `selectOwnedContainer`
  (`owned-container-log.ts:46-66`) requires `appHostSource !== undefined &&
  pathContained(appHostSource, projectRoot)` **and** the image needle, then demands exactly one
  match (`found 0` / `found 2` errors). A container matching the image name alone is rejected —
  ownership proof is a hard conjunct, never bypassed. `appHostSource` comes from the Aspire mounts
  label `com.microsoft.developer.usvc-dev.mountsLabel` `src=` first, `ASPIRE_DCP_APPHOST_PATH` env
  second (`owned-container-log.ts:89-106`); `pathContained` (`evidence/cleanup.ts:26-30`) is the
  same absolute-path containment used by the post-stop probe.
- `assertReadinessDisagreement` (`readiness-disagreement.ts:80-92`) accepts only
  `agreement === 'disagreement'` (log ready + listener Unhealthy) and explicitly rejects the weaker
  shape — a log that never announced readiness throws
  "ordinary not-ready observation", so a failing probe can never be recorded as gate-2 evidence.
- Receipt carries `readiness` with `agreement` classification, `listenerFailure` reason,
  `container {id, image}`, and a 20-line `logTail` (`listener-unreachable-fixture.ts:214`,
  `slice(-20)`).
- Sqlite tier: `listenerFaultExpectations` (`listener-readiness-gates.ts:117-130`) returns
  garnet-only for SQLITE/MYSQL/MSSQL, so the conditional yields `undefined`, the field is omitted
  via conditional spread (`listener-unreachable-fixture.ts:169`), and no docker call is made.

### 2. Permissions — PASS

- `listener-readiness-gates.ts:95` grants `--allow-run=aspire,docker` on the
  `runtime.health.listener-unreachable` command gate only. Repo-wide sweep of
  `packages/cli/e2e/src`: no other gate argv gained `docker` in this diff (other docker invocations
  — `evidence/cleanup.ts`, `docker-resource-cleaner.ts`, `quickstart/database-integrity-walk.ts` —
  are pre-existing files untouched by this PR).
- Pinned by both required tests: `runtime-gates_test.ts:127-142` (new test parses the gate's
  `--allow-run=` entry and asserts `aspire` + `docker` present) and
  `listener-readiness-gates_test.ts:165` (exact argv assertion).

### 3. Contract doc — PASS

- `docs/site/reference/aspire/index.md` new "## Readiness contract" section states what
  `Unhealthy` means ("nothing accepted a connection at the published endpoint within the timeout"),
  why the container log is not the readiness authority (in-namespace vs published-endpoint
  questions; DCP loopback binding), what consumers wait on (`aspire wait <resource>`,
  `aspire describe --format Json` `healthReports`), and treats `healthReports: {}` as *unknown*.
- Dry read only (no doc mutation): all six pinned phrases in
  `checkAspireReadinessContract` (`.llm/tools/docs/check-accuracy-and-discoverability.ts:348-368`)
  exist verbatim — occurrence counts 1/1/1/1/1/2 for `## Readiness contract`,
  `is this resource reachable at the`, `A container log is not the readiness authority`,
  `not disproof`, `aspire wait`, `healthReports`. The check is wired into `runAccuracyCheck`
  (`:378`).

### 4. Carriers — PASS

All five read-only regeneration checks exit 0 at this head:
`check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`,
`check:mcp-export-corpus`, `check:aspire-version-parity`. `git status --porcelain` empty
afterwards → carriers are genuine regeneration output, not hand-edited.

### 5. #1957 preservation — PASS

- `git diff ba6f1f49a..HEAD -- .../verify-typed-db-phase-b.ts` is empty (0 bytes).
- `observeInducedListenerDeparture` (`listener-unreachable-fixture.ts:241-265`) and
  `RESOURCE_TRANSITION_FAILURE_CEILING_MS = 120_000` (`:49`) are byte-identical to base; the
  fixture diff touches only imports, the optional `readiness` field, the conditional computation +
  receipt spread, and the new private `observeReadinessDisagreement`.

### 6. Doctrine / scope — PASS

No `plugins/` change, no `deno.lock` change. `packages/*/src` changes are exactly the four e2e
harness gate files plus the two generated carriers — zero product code. No product-behaviour
change → no FAIL_RESCOPE trigger.

### 7. Tests and static checks — PASS

- `deno test --allow-all packages/cli/e2e/tests/application/gates/
  packages/cli/e2e/tests/application/builders/runtime-gates_test.ts` → **216 passed, 0 failed**.
- Targeted `deno check --unstable-kv` on the four changed gate sources → exit 0 (all four
  type-check; the fixture module is not transitively pulled into every test module, so this closes
  that gap; read-only, no Aspire/Docker started).
- `deno fmt --check` on the 8 changed `.ts` files under `packages/cli/e2e` → exit 0.
- `deno lint` on the same 8 files → exit 0.
- Hosted runtime evidence at this exact head (supervisor-provided, NOT rerun):
  `scaffold-runtime (aspire + docker + postgres)` SUCCESS, `scaffold-runtime-sqlite (aspire +
  sqlite + garnet)` SUCCESS, quality/check-test/code-quality/scaffold-static SUCCESS. Canary 7
  `behavior.live-db-endpoint` is coordinator-owned and out of scope.

## Process Verification

| Check                                  | Result     | Evidence                                                        |
| -------------------------------------- | ---------- | --------------------------------------------------------------- |
| Plan-Gate passed before implementation | `N/A`      | not visible from evaluator seat; not re-judged here             |
| Design section exists in worklog       | `N/A`      | implementation run dir contains `evidence.md` only              |
| Commit slices match design plan        | `N/A`      | judged as one head-vs-base diff per instructions                |
| Each slice has a passing gate          | `PASS`     | hosted scaffold-runtime docker + sqlite tiers SUCCESS at head   |
| No speculative seams (unused files)    | `PASS`     | both new modules imported by fixture and by their unit tests    |
| Constants used for finite vocabularies | `PASS`     | `ReadinessAgreement` union, `POSTGRES_READY_LOG_MARKER` const   |

## Static Gates

| Gate             | Command or check                                | Result        | Evidence                          |
| ---------------- | ----------------------------------------------- | ------------- | --------------------------------- |
| Narrow typecheck | `deno check --unstable-kv` (4 changed srcs)     | `PASS`        | exit 0                            |
| Slice typecheck  | covered by `deno test` (type-checks imports)    | `PASS`        | 216 passed                        |
| Format           | `deno fmt --check` (8 changed files)            | `PASS`        | exit 0                            |
| Lint             | `deno lint` (8 changed files)                   | `PASS`        | exit 0                            |
| Doc lint         | accuracy check phrases verified by dry read     | `PASS`        | 6/6 phrases verbatim              |
| Publish dry-run  | `N/A`                                           | `NOT_RUN`     | outside instructed scope          |
| Link/path check  | carriers regenerate cleanly incl. doc prose     | `PASS`        | `check:agent-docs-prose` exit 0   |

## Fitness Gates

| Gate | Function                        | Result  | Evidence                                                        | Violations |
| ---- | ------------------------------- | ------- | --------------------------------------------------------------- | ---------- |
| F-2  | Helper-reinvention scan         | `DEBT_ACCEPTED` | `appHostSourceOf` duplicates private `containerAppHostSource` (finding 2) | 1 (low) |
| F-5  | Public surface audit            | `PASS`  | new exports are e2e-internal, consumed by tests and fixture     | none       |
| F-9  | Permission declaration check    | `PASS`  | minimal `aspire,docker` grant, pinned by both tests             | none       |
| F-10 | Test-shape audit                | `PASS`  | pure classifiers unit-tested; wiring covered by hosted tier     | see finding 1 |
| F-19 | Scoped source gate runners      | `PASS`  | fmt/lint/check scoped to changed files                          | none       |

Remaining F-gates and AP table: `N/A` — run scope touched no framework/plugin source, no
sagas/runtime invariants, no barrels, no inheritance, no console-log surface (fixture logs via
`console.info` consistent with pre-existing fixture style).

## Findings

| Severity | Finding                                                                                                                                                                                                                           | Evidence                                                                                          | Required action                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| low      | Fixture-level readiness wiring has no unit test: the `controllerListener === 'postgres'` conditional, the 20-line `logTail` slice, and the conditional receipt spread are exercised only by the hosted docker runtime tier.         | `listener-unreachable-fixture.ts:136-138,169,207-215`; `listener-unreachable-fixture_test.ts` tests helpers + `observeInducedListenerDeparture` only | fix in follow-up (inject docker/observe seam) or record as debt |
| low      | `appHostSourceOf` re-implements the private `containerAppHostSource` from `evidence/cleanup.ts` — identical mounts-label regex and DCP env fallback; the two copies can drift if the label format changes.                          | `owned-container-log.ts:89-106` vs `evidence/cleanup.ts:284-299`                                  | export + reuse the cleanup.ts helper, or debt     |
| low      | Sqlite/MySQL/MSSQL tiers' listener-unreachable gate argv grants `docker` although the fixture never invokes it on those tiers (garnet-only expectations) — broader than the tier needs, harmless because no call site exists.        | `listener-readiness-gates.ts:95` vs `:117-130`                                                    | optional tier-conditional grant; may be accepted  |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Ownership proof before quoting any container artifact: label/env path containment + exactly-one selection beats image-name matching | `pathContained` + single-match selection | e2e archetypes that read host-side container state | high |
| Record the disagreement *and* the reason (`listenerFailure`) next to the evidence that disagrees, so receipts explain rather than assert | `ReadinessObservation` receipt shape | any gate capturing two legitimately divergent signals | high |

## Verdict

| Field     | Value                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS`                                                                                                                                          |
| Rationale | All seven acceptance points hold with file:line evidence: deterministic reproduction with ownership-proofed container selection and strict disagreement assertion; minimal pinned docker permission; contract doc present with all six pinned phrases verbatim; carriers regenerate byte-identical; #1957 preservation exact; scope clean of product code; 216/216 tests plus fmt/lint/check green at this head. Three low-severity, non-blocking findings (wiring test gap, helper duplication, over-broad tier grant) require follow-up or debt, not a fix-before-merge. |

VERDICT: PASS
