# Worklog: Content-hashed immutable Fresh client modules in generated builds (#2652)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-fresh-client-content-hash-2652--impl` |
| Branch         | `fix/fresh-client-content-hash-2652` |
| Issue          | #2652 — implementation PR; body carries `Closes #2652` |
| Classification | implementation |
| Archetype      | CLI scaffold assets (and `packages/fresh` Vite integration only if required); builder confirms against `.llm/harness/archetypes/` |
| Scope overlays | `SCOPE-frontend.md` |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> Owner explicitly authorized T3 dispatch, with rationale for Neon: it first found or co-found these gaps. Exact public builder model settings: providerInstanceId codex, model gpt-6.2-sol, options {reasoningEffort:'xhigh'} for N1 #2650 and N4 #2652; […]
>
> […] You, Opus, can review the Sol builds as a different-family agent; […]

Quoted verbatim from the owner's batch directive. `[…]` marks elided text that concerns lanes or parties outside this run's public record; nothing that governs this lane is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | OpenAI |
| IMPL-EVAL | Claude Opus 5.5 (`claude-opus-5-5`, effort `xhigh`), the batch coordinator acting as a different-family reviewer (Anthropic vs OpenAI) | separate session | Anthropic |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — single bounded build-config fix with an issue-defined regression; no public API change. Escalate to the coordinator if a `@netscript/fresh` public option is needed.
- IMPL-EVAL loop: feature row — at most 5 rounds, owner notified after round 3. Every new head after changes is re-gated.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- Generated production builds give **client** entry and lazy chunks content-hashed file names, so a changed immutable module gets a new URL.
- **Server** entries keep stable names; the production server launcher still loads its expected server entry.
- A two-build cold/warm regression: build A (island click shows "A"), record client entry/chunk URLs, bytes and cache headers; change to "B", rebuild, serve at the same origin; a warm browser profile with HTTP caching hydrates and shows "B"; changed modules have new URLs; unchanged server entry name is stable.

### Boundaries and shared seams

- #2577 (Northwind scaffold preset) edits `packages/cli/src/kernel/assets/northwind/**` and the generated asset carrier. Do not edit Northwind assets. Regenerate carriers only through the generator tasks; if #2577 merges first, merge `origin/main` and regenerate — never hand-merge generated carriers.
- No dependency or lock edits beyond what is strictly necessary (record any in `drift.md`).
- Ask the coordinator before touching another lane's files.

### Gates

- Scoped check/lint/fmt/test over changed roots (`packages/cli` needs the temp no-exclude config pattern for fmt/lint).
- Generated carrier chain: prose → corpus → assets barrel → publish assets (`gen:*` tasks) all clean.
- `deno task quality:scan`, `deno task arch:check`, `deno task release:preflight`, `deno task docs:accuracy`.
- Scaffold output changes, so the documented gate applies: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (Docker only via `mise exec -- docker`), plus the two-build browser regression.

## Design

Builder records this section before creating implementation files (`workflow/run-loop.md` § 3b).

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |

## Drift

See `drift.md`.
