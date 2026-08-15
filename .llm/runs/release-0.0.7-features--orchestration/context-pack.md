# Context pack — NetScript 0.0.7 features lane

Status as of 2026-08-15: the owner selected **keep-and-narrow** for PR #1651. The overlap hold is
released and the lane is back in `impl` on a **bounded 8-point amendment** carried by the original
Codex author. The prior IMPL-EVAL `PASS` is historical: it predates the owner's merge gate and no
longer certifies the head that will ship. No new PLAN-EVAL exists. Merge and the ready-flip remain
with the coordinator.

## Control

`topic-features-0.0.7` is a native Claude Opus 5 / high Remote Control supervisor — session
`19621a0b-c6a0-47c6-b826-93c1634a6875`, bridge `session_01LQBHX8KpA5aYtDraq46J8a`, PID `2430404`,
cwd `/home/codex/repos/netscript-007-features`. Requested and observed routes match
(`supervisor.md` § Controller reset). The historical Codex topic thread
`019ffcc0-e1d2-7850-a308-354b670c6f3d` is parked at `TOPIC_CONTROLLER_PARKED` and preserved; it is
never resumed as a controller. Merge, publish, scope, relabel, issue-close, and central cluster state
remain with `codex-root-0.0.7`.

Authoritative coordinator checkpoint: `eb46e33fb6493ce6ef5350f7abd6e4da51854577` on
`chore/release-0.0.7-orchestration`, clean and pushed.

## Lane state

- Live `origin/main` = `0b3ed5d5a6aea451318f120988c25dfa3993a2ab`; the coordinator's cluster state
  records main as `e090f894f`. Either way it has **advanced** past the immutable dispatch base
  `01e0960494c95ce56eb35892c211a095eb13e6ed` that PR #1651's `base.sha` still records. The leaf
  discloses the advance; the prior IMPL-EVAL tested and confirmed it does not invalidate the RFC's
  coupling findings.
- Topic branch `orchestrator/release-0.0.7-features` carries orchestration evidence only.
- Sole leaf: `rfc-plugin-cli-contribution` (#1502), draft PR **#1651**, dispatch head
  `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019` (local = remote = PR), exactly one lifecycle label
  `status:impl`, 0 review threads.
- Leaf worktree `/home/codex/repos/netscript-007-features-1502` is clean at the branch head with no
  upstream and no active agent.
- Author thread `019ffcc5-d3e1-7c13-9815-e9956ec43683` is the **only** implementation session; it is
  resumed, never replaced. Steering is
  `.llm/tools/agentic/codex/codex-resume.ts --thread-id 019ffcc5-… --message …`. Never fire a second
  `send-message-v2` at that worktree. An earlier turn ended without a `task_complete` marker — read
  idle from `codex-status`, not `codex-watch --mode turn` (D-5).
- `rfc-a-stage0-ratification-board` (#1348) stays a coordinator-only checkpoint with no leaf PR.

## Active work — the owner-verdict amendment

Brief: `slices/impl-1502-amendment.md`. Eight points, no scope beyond them:

1. Preserve the distinct descriptor / router / registry / capability / bootstrap / isolation core.
2. **C6 owns only** generic CLI contribution workspace-plan execution: canonical text plan
   validation, preview/apply safety, common stage/check/commit/rollback, generic
   registry/plan/journal doctor states.
3. **RFC 0003 / #1490 exclusively owns** command-store provider selection, Prisma schema/models/
   indexes, migration creation/application/refusal, the generated bridge and transaction-client
   types, DB-specific validation, and business-command receipt/audit/outbox/transaction semantics.
4. The adapter maps RFC-0003 domain output into `PluginCliGenerationPlan` / the shared executor.
   C6 must not parse Prisma, choose provider SQL or indexes, own the migration lifecycle, or define
   command-store semantics. RFC 0003 / #1490 must not define a second generic plugin CLI mount or a
   second workspace stage/rollback engine.
5. Doctor split: C6 reports generic registry/plan/journal health; RFC 0003 reports command-store
   schema/migration/bridge health.
6. Planner output is **preview-invariant** — the same canonical plan for preview and apply;
   `invocation.preview` cannot change plan construction, and only the host execution mode controls
   mutation. This closes the evaluator's carried C6 observation.
7. Amend the RFC compatibility/ownership text and the C6 roadmap row, naming RFC 0003 and #1490
   explicitly. Do not edit RFC 0003, package/plugin code, locks, issues, or central state.
8. Correct the PR-body medium provenance defect and the stale handoff prose.

Concrete edit sites in `rfcs/0000-plugin-cli-contribution.md`: line 887 (RFC 0003 compatibility row,
including the inaccurate "host-owned execution" phrase), line 891 (the blanket non-assignability
claim — see D-11), line 957 (#1475 amend/fold row), line 1019 (C6 roadmap row), line 1102 (prior-art
bullet). Line 899 already assigns durable business rollback to RFC 0003 correctly.

**Four items from the earlier 12-item checklist are no longer authorized** — a `PluginCliJson`
brand, a normative outcome mapping across the adapter, cancellation/deadline settlement semantics,
and identity-domain mapping — because writing them would make #1651 define command-store semantics
the same verdict assigns exclusively to RFC 0003. Full supersession table in `worklog.md`; shape of
the drift in D-10.

## Sequence after the author turn

1. Author: amended content commit → rerun the six contracted gates at that content head → a
   receipt/journal-only commit if required → explicit push → local = remote = PR equality.
2. This supervisor: fresh independent **opposite-family Tier-A** over the exact amendment versus
   RFC 0003 / #1490, plus a recheck of the conditional body correction.
3. On Tier-A `PASS`: exactly one fresh separate native Claude Opus 5 · **medium** · Remote Control
   IMPL-EVAL, bounded to the amendment, the prior conditional finding, evidence reachability, and
   duplicate/ownership proof.
4. No open-ended loop. A substantive `FAIL` returns **once** to the same author; editorial notes do
   not trigger another formal cycle without coordinator authorization.

## Closed gate — PLAN-EVAL cycle 2 `PASS`

Granted at coordinator head `168715e27` (per-topic evaluator queues), dispatched after four-source
head re-verification, verdict `PASS` at `plan-eval.md:205`, evaluated head `12276e6d8…`, verdict-only
commit `3e0c8858b`. Evaluator: session `28cc8106-967b-4fb7-90f3-dd95054ae953`, bridge
`session_01D7t8efMh88nwR2PazUPkC1`, PID `2463708`, native Claude Opus 5 · medium, requested =
observed. Cycle 2 was the second and final cycle; **no cycle 3 exists and none is authorized.**

## Implementation history

| Field | Value |
| --- | --- |
| Prior final head | `04d431028c1fe455dc18c05e3fa0779e7b593046` |
| Prior content head (attested by every binding gate) | `120859d5c762706702cd45a3f2be19664e335e22` |
| Deliverable | `rfcs/0000-plugin-cli-contribution.md`, Draft/0000 |
| Binding evidence | six contracted gates all `PASS` at that content head; sufficiency independently recomputed `SUFFICIENT` |
| Acceptance | five entries, 0 `PENDING`, `Closes #1502` intact |

Slice history and Tier-A outcomes: S1 `CHANGES_REQUESTED` (F1 undeclared diagnostic-code type, F2
shallow-vs-deep readonly, F3 handler-ref traversal) → fixed → accepted; S2 accepted with S2-N1 (a
grant field whose non-empty case could never occur) and S2-N2 carried; S3 accepted with no findings,
both carried notes closed; S4 `CHANGES_REQUESTED` (S4-F1 unreproducible sufficiency claim) → fixed
via remedy (b) → accepted. Reviews in `slices/tier-a-review-1502-s1.md` and
`slices/tier-a-review-1502-s4.md`; briefs in `slices/impl-1502-*.md`.

The six contracted `invocationId`s: `ns1502-s4-final-check`, `-test`, `-publish-workspace`,
`-arch-check`, `-docs-source-format`, `-docs-accuracy`. `receipts/*final*.json` is deliberately **not**
the contracted set — three receipts share `gateId: publish-dry-run`, which
`.llm/tools/gates/evidence-set.ts` reads as duplicate-or-contradictory. Name the six; recompute
sufficiency; never trust the recorded word.

## Superseded gate — IMPL-EVAL `PASS`, conditional

Verdict `PASS` at `evaluate.md:380`, verdict-only commit `0e302ad3a`, evaluated final head
`04d431028…` / content head `120859d5c…`. Evaluator: session
`2a8cf0a6-7529-4ca6-97ce-69edcca3f84d`, bridge `session_01Y48WxcCgzUAWfJmGmhBykc`, PID `2718910`,
native Claude Opus 5 · high · Remote Control, requested = observed, opposite-family to the Codex
author. It relabelled nothing and did not flip the PR.

It is **not merge authority**: it started at `03:50:58Z`, the owner's merge-gating comment
`#issuecomment-5300440887` was created at `04:04:16Z`, and the verdict landed at `04:05:30Z` — 74
seconds later (D-8). Its one conditional medium finding is folded into the amendment as point 8: the
body's `check` row cites "1,033 files, 9 batches, 0 failed" against `check-final.json`, but that
receipt has `stdout.bytes: 0`, `durationMs: 51`, and carries no figures at all. The numbers come from
`check-cli-plugin-cycle1.json` at head `d71b78c3…`. The fix must **drop or relabel** the figures, not
re-point the citation, and must describe the final 51 ms run plainly as a valid cached re-check.

## Standing prohibitions

No merge, publish, ready-flip, relabel beyond the PR #1651 grant already exercised, reply to or
resolution of owner comment `5300440887`, ticking #1502, issue filing, `#1348` mutation, central
cluster-state change, expensive-gate lease, or starting the next features leaf. `scaffold.runtime`
was never run and remains forbidden for this leaf.

## Open drift

D-1 (Codex leaf mobile visibility unproven — deliberately not repaired, sibling blast radius),
D-2 (contract/scope resolution, superseded route note), D-3 (Claude CLI 2.1.233 vs 2.1.231),
D-4 (#1502 still `status:research` — reported; this lane's relabel grant covers PR #1651 only),
D-5 (missing `task_complete` marker on the author thread — read idle from `codex-status`),
D-6 (`pr-checks PASS` is an all-`skipped` set, not gate evidence),
D-7 (a watcher exit is a wake signal only; verdicts come from committed artifacts),
D-8 (the IMPL-EVAL `PASS` predates its own merge gate),
D-9 (Tier-A reviewer routing vs the reset contract — resolved in practice: this supervisor performs
the opposite-family review),
D-10 (the owner verdict narrows an amendment that was briefed wider),
D-11 (the RFC's blanket non-assignability claim is false as written).
