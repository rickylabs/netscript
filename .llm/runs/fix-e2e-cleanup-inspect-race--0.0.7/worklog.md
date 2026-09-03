# Worklog: cleanup container-inspect removal race

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-e2e-cleanup-inspect-race--0.0.7` |
| Branch | `fix/e2e-cleanup-inspect-race` |
| Archetype | `6 — CLI / Tooling` (parent package) |
| Scope overlays | `none` |

## Design

### Public Surface

- No `@netscript/cli` public export changes.
- `inspectAllContainers` becomes an export only from its internal evidence module so a colocated
  unit test can drive it; it is not re-exported from `packages/cli/mod.ts` or the E2E `mod.ts`.
- Archetype-6 spine abstracts (`CliCommand`, `CliCommandGroup`, `CliRoot`, `UseCase`, `Registry`),
  layer-2 abstracts, vertical feature catalog, extension registries, and composition roots are
  preserved unchanged.

### Domain Vocabulary

- `ContainerInspection` — containers successfully inspected plus ids that vanished during inspect.
- `vanishedContainerIds` — listed ids whose same-id inspect failure says `No such object`.

### Ports

- Injectable command runner on `inspectAllContainers` — deterministic unit seam for Docker list /
  inspect transcripts; no new package-level port or adapter.
- Existing process, filesystem, and wait edges remain unchanged.

### Constants

- No new finite domain constant is needed. Existing `OWNED_SURVIVOR_RETRY_WAITS_MS` is immutable
  and explicitly out of scope.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove listed-then-removed inspect is RED with an injected runner. | Durable focused test receipt must fail for the expected reason. | `cleanup.ts`, `cleanup_test.ts`, run artifacts |
| 2 | Classify same-id `No such object` as vanished, retain evidence, and prove other failures throw. | Focused cleanup tests pass. | `cleanup.ts`, `cleanup_test.ts`, run artifacts |
| 3 | Bind scoped static/runtime-schema/quality evidence to the final head. | Structured check/test/lint/fmt, version parity, quality gate, diff guards. | Run artifacts and receipts only |

### Deferred Scope

- Hosted Aspire runtime tiers — run in CI because the brief prohibits a local Aspire runtime.
- Existing cleanup retry timing and registry architecture debt — unrelated to this race.

### Contributor Path

Open `cleanup.ts` beside `cleanup_test.ts`; add a semantic command transcript fixture through the
injected runner, keep expected terminal states explicit, and preserve all other failures.

## Plan-Gate

`PLAN-EVAL: N/A` — issue #1977 and the implementation brief fully specify the failing transcript,
scope ceiling, additive receipt contract, budgets, tests, hosted-runtime proof, and PR metadata.
This is a small mechanical failure-boundary fix with no unresolved architecture decision.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-03T03:12:00Z | bootstrap | research/design | Re-baselined live issue #1977 and branch against exact `origin/main` `4afbd82a7`; locked plan. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Add an internal runner seam | Reproduces the Docker TOCTOU race without a daemon. | issue #1977; A14 |
| Add only `docker.vanishedContainerIds` | Backward-compatible receipt evidence. | issue acceptance; plan D2 |
| Skip PLAN-EVAL | Complete mechanical contract with no open design choice. | harness run-loop §4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Owner-selected high generator effort exceeds the normal small-fix route. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| scoped check/lint/fmt | structured wrappers | NOT_RUN | S3 |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-10/F-19 | NOT_RUN | focused tests and wrappers planned | S1–S3 |
| Archetype 6 structure | PASS | manual pre-change review | No public/composition/generated-output change planned. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| hosted scaffold runtime tiers | NOT_RUN | CI after push | Local Aspire runtime prohibited. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| public CLI/scaffold output | N/A | scope review | No consumer-visible or generated-output change. |

## Handoff Notes

- Evaluator should inspect the same-id error predicate, vanished-id aggregation, negative failure
  regression, prohibited-delta guard, and hosted tier evidence first.
