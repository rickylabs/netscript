# Plan — README minimum dependency age

## Profile and verdict

- Archetype: 6 — CLI / Tooling, because the changed surface is a user-run CLI install command.
- Overlay: docs, because root/package READMEs and `docs/site/quickstart.vto` are authoritative
  user-facing contracts.
- Current doctrine verdict: keep `packages/cli` as Archetype 6 and preserve its kernel/surface
  split. This slice changes no source architecture or exports.
- Relevant axioms: A1/A2 (printed command is public contract), A14 (drift tests enforce it).
- Relevant anti-pattern: AP-18 is clear because tests assert the small literal command contract,
  where exact text is intentionally public.

## Locked decisions

1. Every primary printed global-install contract uses exactly
   `deno install --global --allow-all --name netscript --minimum-dependency-age=0 jsr:@netscript/cli@<version>`.
2. The flag is immediately before the JSR specifier it governs.
3. The harness parses and executes that flag from README text; it does not inject it.
4. The root README adds one concise same-day-release explanation; the site callout keeps only the
   `-f` replacement guidance now that the age override is already present.
5. No workflow, runtime, republish, shim, environment, retry, or `-f` change is permitted.

## Open-decision sweep

No open decisions. All material text, position, scope, evidence, and prohibited alternatives are
owner-locked.

## Commit slices

| # | Slice | Files | Proving gate |
| --- | --- | --- | --- |
| 0 | Harness bootstrap and locked plan | this run directory | plan checklist; PLAN-EVAL N/A |
| 1 | RED expected-command contract | domain constant, quickstart suite constant, focused application test | four focused tests fail against unchanged docs |
| 2 | GREEN public printed commands and callout | root README, package README, docs Quickstart | same four focused tests pass |
| 3 | Derived carriers and manifest, if changed | generator-owned outputs only | carrier checks and Aspire parity |
| 4 | Separate IMPL-EVAL and final evidence | this run directory | evaluator PASS |

## Gate set

- Four focused contract/drift tests, then scoped E2E check/test/fmt/lint.
- Agent-docs prose, assets barrel, publish assets, MCP export corpus carrier checks and matching
  generators when required.
- Aspire surface parity, regenerating its manifest only when stale.
- Docs accuracy plus link/README checks where applicable.
- `deno task quality:gate` for the touched package/docs surface.
- `deno task e2e:cli gates readme.quickstart` listing only; runtime suites are forbidden.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Harness injects the flag and masks stale prose | Assert the parsed `sourceCommand` contains it exactly once and spawn argv matches. |
| One public command remains stale | Both README and docs Quickstart drift tests compare against centralized constants. |
| Generated docs carriers drift | Run the full named carrier chain and commit only generator-owned deltas. |
| Run artifacts stale the Aspire manifest | Run parity after all evaluator artifacts exist; regenerate if required. |

## Debt and deferred scope

No new or deepened architecture debt is expected. Publishing, workflow changes, runtime execution,
and the wider product-policy discussion tracked by #818 are deferred.
