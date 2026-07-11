# Worklog

## Design

### Public surface

- Release-tool exports for publish-set comparison, markdown scanning, and formatted preflight evidence.
- `release:cut` runs both audits before expensive gates and any Git mutation.

### Domain vocabulary

- `PublishableMember`, intended/effective publish set, intentional exclusion, missing/extra delta.
- Markdown pin finding, blocking violation, deferred site finding, target cut version.

### Ports

- Filesystem only (`Deno.readDir`, `Deno.readTextFile`, `@std/fs` walk); no registry/network port.

### Constants

- `@netscript/` JSR scope.
- publish parent roots `packages`, `plugins`.
- deferred markdown prefix `docs/site/`.
- historical/scratch/cache skip patterns.

### Commit slices

| Slice | Files | Gate |
| --- | --- | --- |
| Bootstrap/plan | run `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `supervisor.md`, `plan-eval.md` | separate PLAN-EVAL |
| Publish audit | `.llm/tools/release/preflight-release.ts`, `.llm/tools/release/preflight-release_test.ts` | release test suite + scoped check |
| Markdown policy | preflight module/test plus `.llm/tools/release/cut.ts` and `cut_test.ts` | release test suite + scoped check/lint/fmt |
| Evidence/close | run worklog/context/drift and PR body/comments | safe read-only audit output + raw `deno.lock` diff + separate IMPL-EVAL |

### Deferred scope

No prose rewrite and no `docs/site/**` enforcement in beta.6.

### Contributor path

Start in the release preflight module and its adjacent test. Add an intentional omission only through the named exclusion table with a concrete reason, then update its audit test.

## Evidence

- PLAN-EVAL cycle 1: `FAIL_PLAN` (slice file/gate attribution only); corrected.
- PLAN-EVAL cycle 2: `PASS` from separate Claude Opus 4.8 evaluator.
- Publish/markdown preflight module implemented with an independently discovered intended set.
- Real audit found and explicitly recorded `packages/bench` as an internal benchmark-only exclusion.
- Real audit enumerated 34 effective members, including `@netscript/ai`, `@netscript/plugin-ai-core`, and `@netscript/plugin-ai`; zero unexplained deltas.
- Markdown audit for target `0.0.1-beta.6`: zero blocking findings; one deferred `docs/site/**` finding (`docs/site/reference/plugin-ai/index.md:86`).
- Release tests: 22 passed before the explicit-exclusion coverage addition; final rerun pending.
- Scoped check and lint: pass. Initial format gate found the new module; targeted formatter applied, final gate pending.

## Reconcile — implementation slice 1

- Issue/PR surface: draft PR #612 remains open and close-gated to #609; no new reviewer comments affected scope.
- Drift: brief's missing-AI premise was already fixed by #508; the audit additionally exposed the intentional `packages/bench` omission.
- Readjustment: no scope expansion; benchmark exclusion is now explicit as requested.
