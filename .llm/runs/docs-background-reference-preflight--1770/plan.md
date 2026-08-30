# Plan: background-reference startup preflight documentation

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `docs-background-reference-preflight--1770` |
| Branch | `docs/background-reference-preflight` |
| Phase | `plan-eval` |
| Target | `docs/site` plus generator-owned derived assets |
| Archetype | `N/A — docs-only` |
| Scope overlays | `SCOPE-docs.md` |

## Archetype

No package/plugin archetype applies. This slice edits one public troubleshooting page and then runs
the repository generators that own the resulting package asset outputs. Hand-written
`packages/**` and `plugins/**` source is out of scope.

## Current Doctrine Verdict

N/A for this docs-only slice. `SCOPE-docs.md` governs source alignment, scope separation, links,
terminology, and drift handling.

## Goal

Make the generated Aspire background-reference startup error searchable and actionable on the
existing page a reader uses while starting the AppHost, while preserving the source template as the
authority and refreshing every derived publication asset.

## Scope

- Add one proportionate troubleshooting entry to
  `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md`.
- Quote the templated service-reference and plugin-reference messages exactly.
- Explain that the preflight happens before processor registration and fails fast for either a
  missing resource or a resource without an `http` endpoint.
- Commit prose and run artifacts first, then regenerate the agent-docs and publish-asset chain in a
  separate derived-only commit.

## Non-Scope

- No new page, navigation change, or background-processing documentation restructuring.
- No change to generated error wording or runtime behavior.
- No hand edit under `packages/**` or `plugins/**`.
- No changelog, dependency, Aspire-version, diagram, or release-cut work.

## Hidden Scope

- `docs/site/**` feeds the rendered `_site`, the compressed agent-docs corpus and provenance, the
  CLI embedded agent-docs barrel, and MCP publish assets.
- `provenance.json.sourceCommit` must record the S1 prose commit, so regeneration cannot happen
  until S1 exists.
- `docs:readme:check` must be reproduced on a clean `origin/main` checkout to prove its known
  `packages/bench/README.md` failure is baseline red.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Place the entry in `deploy-local-aspire.md`, inside the existing startup-footguns callout. | The failure aborts the scaffolded AppHost during `aspire start`; this is where a reader already running the AppHost looks. The background-processing how-tos address worker/task behavior after configuration, not AppHost boot. |
| D2 | Present both messages as templates using `'<processor>'` and `'<ref>'`, explicitly saying those placeholders are substituted in generated code. | The source constructs the strings from `name` and `ref`; this is searchable without fabricating a concrete message that the generator may never emit. |
| D3 | Frame the behavior as required-configuration fail-fast, before processor registration. | This matches the source comment and order of the generated preflight relative to `addExecutable()`. |
| D4 | Name both indistinguishable resolution causes: missing resource or no `http` endpoint. | Optional chaining collapses both cases to the same fatal missing endpoint, exactly as the source comment specifies. |
| D5 | Use two commits: S1 prose/run evidence, then S2 generator outputs only. | The generator records current HEAD as `sourceCommit`, so S1 must immediately precede regeneration. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Add a new page | safe to defer | Explicitly out of scope; the existing startup runbook is sufficient. |
| Change error wording or runtime behavior | safe to defer | Issue #1770 documents deliberate existing behavior only. |
| Document Aspire-version details | safe to defer | The behavior is configuration semantics, not version-bound content. |

No unresolved decision would force rework in this slice.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Inventing an error variant | Quote both source-built templates exactly and label placeholders honestly. |
| Misframing a boot/configuration error as load failure | State the preflight occurs before processor registration. |
| Updating only remembered generated files | Run all three checked-in generators and inspect the resulting diff. |
| Wrong provenance commit | Commit S1 before `gen:agent-docs-prose` and compare `sourceCommit` to S1. |
| Baseline red misattributed to this slice | Run `docs:readme:check` in a detached clean worktree at `origin/main`. |
| Lock churn | Record the initial `deno.lock` blob and reject any change. |

## Anti-Patterns to Resolve or Avoid

- N/A: no framework source changes. Avoid source duplication by quoting only the two message
  templates and linking the troubleshooting guidance to the existing startup workflow.

## Fitness Gates

- The docs overlay gates are source alignment, scope separation, link integrity, terminology, and
  drift logging. The full command list is locked in the validation plan below.
- Package/plugin fitness and JSR gates are N/A because package files are generator outputs only.

## Arch-Debt Implications

- None. The slice closes a public-documentation gap without changing architecture or accepting debt.

## Validation Plan

Run every command from the slice brief and record the real exit code in `worklog.md`. In addition,
verify `git grep -c "background reference" -- docs/site` is positive, compare generated provenance
to S1, reproduce the README baseline red on clean `origin/main`, confirm no diagram files changed,
confirm `deno.lock` is unchanged, and report raw `git status --porcelain` after generation/gates.

## Dependencies

- Source template:
  `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`.
- Generators: `gen:agent-docs-prose`, `gen:assets-barrel`, and `gen:publish-assets`.

## Drift Watch

- Any generator output outside the four expected agent-docs/provenance/CLI/MCP files.
- Any exact message mismatch, link failure, lock change, or sourceCommit mismatch.
