# Research — docs-rfc-command-composition-kit--rfc

## Re-baseline

- Carried-in source:
  `/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/rfcs/RFC-B-command-composition-kit.md`
- Re-derived against `origin/main` at `fac9e339042c5394bf882311657d8981d353a1c3` on 2026-08-08.
- Bootstrap status: RFC process, all current doctrine chapters, selected archetype profiles,
  `SCOPE-docs`, `SCOPE-service`, gate matrix, plan gate, and evaluator protocols have been read.
  Proposal/code/API/adapter claim verification is in progress.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The requested branch, HEAD, and merge-base exactly match the pinned baseline; only the staged run brief/thread receipt were initially untracked. | Raw `git rev-parse HEAD`, `git merge-base HEAD origin/main`, and `git status --short --branch` on 2026-08-08. |
| 2 | Tracking issue #1361 is open and explicitly scopes this PR to ratification with no `packages/` or `plugins/` implementation. | Live GitHub issue #1361, fetched 2026-08-08. |
| 3 | The final RFC must keep public-package targets separate: contracts and command DSL are Archetypes 1/4; database and telemetry adapters are Archetype 2; relay/runtime behavior is Archetype 3; plugin consumers are Archetype 5; explicit generators are Archetype 6. | Doctrine chapter 06 and `.llm/harness/archetypes/ARCHETYPE-{1..6}*.md`. |

## jsr-audit surface scan (planned public surface)

- Surface to scan: the current export maps and `deno doc` surfaces for `@netscript/database`,
  `@netscript/service`, `@netscript/contracts`, `@netscript/telemetry`, workers/sagas core packages,
  and the future public home proposed by the RFC.
- Risks to resolve in the RFC: export-home ambiguity, accidental root-surface growth, subpath and
  package-cycle consequences, explicit return types under `isolatedDeclarations`, and inherited
  oRPC slow-type carve-outs.
- No product package changes are permitted in this RFC PR; JSR findings constrain staged
  implementation issues rather than changing exports here.

## Open questions

- Which existing package owns the narrow command API without creating a cross-package cycle?
- Which current adapters can truthfully supply a single-store transaction plus same-commit receipt,
  audit, and outbox writes?
- What exact receipt, request-hash, actor/correlation, error, isolation, and telemetry contracts can
  be frozen in the RFC without hiding adapter limitations?
- Which decisions remain legitimate FCP questions, and which must be locked before review?

