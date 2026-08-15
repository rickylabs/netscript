# Context Pack: typed plugin CLI contribution RFC

## Run Metadata

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Run ID         | `docs-rfc-plugin-cli-contribution--1502`       |
| Branch         | `docs/rfc-plugin-cli-contribution`             |
| Current phase  | `impl` — S2 lifecycle/transaction authoring    |
| Archetype      | 4 — public DSL/builder (future implementation) |
| Scope overlays | `SCOPE-docs`                                   |

## Current State

Cycle-1 PLAN-EVAL evaluated `a02f9690154b7384ca8e6503ea91d644b397368a`, returned `FAIL_PLAN`, and is
preserved at `plan-eval-cycle-1.md`. Cycle 2 evaluated repaired head
`12276e6d86403ed1340ef79a963e87d401d643e9` and returned `PASS` in evaluator-only commit
`3e0c8858b4a2552926d2965b62cbcc97a15c2935`. Tier-A accepted S1 with its bounded fix-up at
`bd8b29bf3a524280d28a39b21bc7adda277d2e27`; F1–F3 and the `PASS_PARENT_HEAD` convention are closed.
S2 is released for discovery/bootstrap/isolation/capabilities/generation/doctor/pointers. S3 and S4
remain blocked on the next Tier-A release.

## Completed

- Read all selected skills and required harness/archetype/doctrine/RFC sources completely or in the
  explicitly relevant full sections.
- Verified branch/base/cleanliness/no-upstream and live #1502/comments/PR absence.
- Inventoried CLI root/plugin/generate help and public plugin/CLI APIs with `deno doc` before
  focused source reads.
- Fetched and mapped live #904–#908/comments plus #424, #946, #1477, #1474 context, and #1354.
- Searched live issues for competing general command contribution/generation seams.
- Applied the JSR rubric to every planned public surface and measured current full export-map doc
  lint for `@netscript/plugin` and `@netscript/cli`.
- Locked public ownership, mount/router/help/completion/errors, discovery/bootstrap/isolation/order,
  absent UX, generator transaction, capabilities, doctor, manifest pointers, compatibility,
  migration, duplicate audit, and future epic shape.
- Created required PLAN-EVAL and IMPL-EVAL placeholders without an author verdict.
- Read all 145 lines of the committed cycle-1 verdict before repair and mapped FP-1–FP-3/N-1–N-4.
- Reconciled the coordinator record at
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/leaf-contracts.json`,
  key `rfc-plugin-cli-contribution`, with the authoritative RFC-only dispatch; recorded significant
  drift and the coordinator-amendment/new-plan rule for any code expansion.
- Corrected requested and observed author effort to `high` from the topic launcher record.
- Ran the contracted CLI/plugin JSR audit, exact-pin/asset/import-meta checks, structured check and
  tests, per-member publish dry-runs, and root architecture check with JSON receipts.
- Locked the final six-gate rerun, live-glossary terminology review, complete 18-gate Archetype-4
  roadmap, and #1502-versus-later-epic closing boundary.
- Read the complete cycle-2 PASS, recorded its native Claude Opus 5 identity, and corrected the
  stale Fable route.
- Replaced chat-only scope attribution with the durable coordinator brief at commit `8775be7b3` and
  recorded that `leaf-contracts.json` was not edited.
- Authored the S1 RFC ownership, descriptor/builder/router/help/completion/error contract and gave
  the live `PluginCliResult` collision an explicit major-version migration disposition.
- Read the complete Tier-A S1 review at topic commit `b774998f0` and preserved its clean slice-
  hygiene verdict.
- Declared `PluginCliDiagnosticCode`, reconciled deep readonly type/runtime guarantees, and made
  handler path normalization/traversal rejection an explicit validator obligation.
- Relabelled the three S1 run-gate receipts as parent-head evidence and both source-format JSON
  files as structured wrapper reports rather than durable receipts.
- Reran the S1 fix-up docs gates: durable source-format and accuracy passed against parent
  `86d0110a5`, the structured formatter covered 10 owned Markdown files with zero findings, and the
  link check covered 103 docs with zero broken links, anchors, or orphans.
- Reconciled the Tier-A S1 PASS, clean accepted head, draft PR, sole `status:impl`, no upstream, and
  explicit S2 release before authoring.
- Sampled live `generate`, `generate plugins`, `plugin`, and `plugin doctor` help plus published
  `PluginContributions`/`@netscript/plugin/cli` surfaces before focused source reads.
- Authored the S2 normative lifecycle: explicit pointer discovery, generated-registry freshness,
  selected-only terminable bootstrap, concrete capability grants/ports, absent UX, host generation
  transaction, doctor checks, and manifest ownership.

## In Progress

- S2 one reviewable commit, explicit-refspec push, PR body/comment update, and renewed Tier-A
  topic-review stop. The docs-scoped validation set is green against the accepted S1 parent head.

## Next Steps

1. Topic orchestrator substantively reviews S2 and explicitly releases S3.
2. Author S3 without package/plugin mutation only after that release.
3. S4 reruns all six contracted gates at the final author head and completes the JSR/docs evidence
   set.
4. A fresh native Claude Opus 5 medium session performs IMPL-EVAL; this author does not
   self-certify.

## Key Decisions

| Decision                                                                                    | Source                                | Notes                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------- |
| Public owner is existing `@netscript/plugin/cli`; host adapter private in `@netscript/cli`. | doctrine + live exports + D1          | No new package.                   |
| One host-declared extensible mount per contribution; nested children only.                  | #904/#908 + D3                        | No arbitrary top-level commands.  |
| Descriptor-only help/completion; lazy selected-handler bootstrap.                           | #905 + D4–D8                          | No plugin I/O for discovery/help. |
| Host-neutral generation plan and host-owned transaction.                                    | current gap + RFC 0005 + D11–D13      | Preview is zero-write/effect.     |
| Matching installer/runtime pointers after manifest forward-compat prerequisite.             | live `.strict()` + RFC 0005 + D14–D15 | Duplicate-audit #1474.            |
| Deploy and DevTools are independent consumers of the same seam.                             | #1502 + D17                           | No cross-imports.                 |
| Contract file surfaces are audit-only; all six gates and JSR audit remain binding.          | cycle-1 dispatch + D22                | Code expansion needs amendment.   |
| `Closes #1502` completes this RFC leaf; the implementation epic is separate and unfiled.    | cycle-1 dispatch + D23                | No future epic is auto-closed.    |

## Files Changed

| Path                                                               | Status    | Notes                                            |
| ------------------------------------------------------------------ | --------- | ------------------------------------------------ |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/supervisor.md`   | updated   | Correct high-effort requested/observed identity. |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/research.md`     | updated   | Contract resolution and measured JSR baseline.   |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/plan.md`         | updated   | Repaired scope, gates, risks, slices, roadmap.   |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/worklog.md`      | updated   | Design checkpoint and cycle-1 evidence log.      |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/context-pack.md` | updated   | Resumable cycle-2 handoff.                       |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/drift.md`        | updated   | Significant contract tension and resolution.     |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/plan-eval.md`    | preserved | Cycle-1 evaluator verdict; author did not edit.  |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/evaluate.md`     | unchanged | Later separate IMPL-EVAL placeholder.            |
| `.llm/runs/docs-rfc-plugin-cli-contribution--1502/receipts/`       | updated   | Structured/durable S0R and JSR evidence.         |
| `rfcs/0000-plugin-cli-contribution.md`                             | added     | S1/S2 normative contract; S3 gaps explicit.      |

## Gates

| Gate family | Current status                                 | Evidence                               |
| ----------- | ---------------------------------------------- | -------------------------------------- |
| Static      | S2 docs/focused-test/architecture rerun passed | `worklog.md`; `receipts/`              |
| Fitness     | full A4 roadmap plus measured JSR baseline     | `plan.md`; `research.md`; `worklog.md` |
| Runtime     | N/A / global expensive gate not run            | docs-only scope                        |
| Consumer    | research inventory complete                    | live issues/RFCs and `research.md`     |

## Open Questions

- S2 has no rework-forcing open decision. Exact numeric limits, absent-stub visibility, and host
  copy remain FCP choices. S3 owns only compatibility, deploy supersession, duplicate audit, and
  roadmap/migration evidence; it cannot reopen the S1/S2 architecture.

## Drift and Debt

- Drift: attached author route, accepted-but-unshipped consumer seams, shallow existing `./cli`,
  current plugin doc-lint baseline, coordinator-contract tension, and glossary path are recorded in
  `drift.md`.
- Debt: no new or deepened architecture debt; source implementation is forbidden in this leaf.

## Commits

- S0 plan head: `a02f9690154b7384ca8e6503ea91d644b397368a`.
- Cycle-1 verdict-only head: `d71b78c3116db4ec3aaaa0447dd527fcd4867f6f`.
- S0R repaired plan head: the commit containing this artifact; exact SHA is recorded in the draft
  PR's PLAN-UPDATE comment and final supervisor report.
- Cycle-2 PASS verdict head: `3e0c8858b4a2552926d2965b62cbcc97a15c2935`.
- S1 reviewed head: `86d0110a545e449dfa094fc961a37a327604d23a`.
- S1 accepted fix-up head: `bd8b29bf3a524280d28a39b21bc7adda277d2e27`.
- S2 exact head: recorded in the PR slice comment after explicit-refspec push.
- See the draft PR commit list and per-slice comments after push; V3 uses no `commits.md`.
