# Research — codifying the seed-run profile

Goal: distill the workflow that produced `plan-roadmap-expansion--seed` into a reusable Harness v3
run shape. The research base is the exemplar run itself (merged to main under
`.llm/runs/plan-roadmap-expansion--seed/`) plus this supervisor's first-hand context as the agent
that ran it. Every claim below cites an exemplar artifact.

## Re-baseline

- Harness v3 already defines the tiered lane model, the two hard invariants, and the
  `supervisor.md` identity rule (`workflow/lane-policy.md`). The profile must NOT restate lanes —
  it binds stages to tiers by reference.
- `workflow/supervisor.md` is the promotion precedent: a run shape promoted from a proven exemplar
  (PR #96) with a provenance note. The seed-run doc is its sibling for planning-only runs.
- Gap found during this run's bootstrap: `templates/` has **no `supervisor.md` template**, though
  lane-policy mandates the file ("a run dir without `supervisor.md` is not activated"). The
  exemplar violated the rule — its identity had to be recovered by transcript search
  (2026-07-05). Root cause is plausibly the missing template: every other mandatory artifact has
  one.

## Findings — what the exemplar actually did (stage anatomy)

| # | Stage | Evidence in exemplar |
| --- | --- | --- |
| F1 | A Bootstrap: charter read-back, run dir, draft PR #397 opened, opening PR comment | `worklog.md` stage table row A (comment 4883200883); `FABLE-PROMPT.md` |
| F2 | B Deep-search corpus: 5 Sonnet-5 workflow agents fanned across repo source, docs site, reference app (eis-chat), and external market; 75 structured files under `research/`, `matrix/`, `analysis/`, `context/`; 9 drift candidates | `worklog.md` row B (commit 3d70ff5a); `drift.md`; per-topic `INDEX.md` files |
| F3 | C Supervisor synthesis: Fable read the full corpus, wrote a synthesis, resolved the delegated decisions, chose deep-dive topics | `analysis/FABLE-STAGE-C-SYNTHESIS.md` (commit b7964509); F-ai repeat: `analysis/FABLE-STAGE-C-SYNTHESIS-F-ai.md` |
| F4 | D Deep-dive swarm: one Opus 4.8 sub-agent per topic; each produced a four-file design pack `design/<topic>/{proposal,epic-and-issues,agent-briefs,open-questions}.md` | commit ca7787e6; 16 files across 4 topics; owner-steered D+ expansion (commit 2c21bbe2, Opus-A integration 22eef875) |
| F5 | E Plan lock: integrated `plan.md` — locked decisions (12), open-decision sweep (13 owner forks), cross-epic DAG, milestone train, risk register, gate matrix; PR body refreshed | `plan.md`; `worklog.md` row E (commits 8b964815, 22eef875; comment 4883401299) |
| F6 | F Adversarial: WSL Codex unoriented review on a native worktree → severity-tagged findings; Fable triaged and fixed (8 findings on the F-ai leg) | `F1-adversarial-review.md`; `codex-thread-ids.md`; F-ai F2 commit 1d3ca080 |
| F7 | G PLAN-EVAL: OpenHands minimax M3, separate session, verdict of record; commit-back push failure handled by transcribing from the immutable PR comment | `plan-eval.md`, `plan-eval-F-ai.md` (comment 4884094576, commit cc5e98c6) |
| F8 | H Ratify + file: owner decision brief with numbered forks; owner picked; one-shot GitHub filing from a manifest (labels → milestones → epics → sub-issues → reconcile existing); FILING-LOG mapping draft-IDs → issue numbers; supersession map (KEEP/FOLD, zero filing-time closes) | `OWNER-DECISION-BRIEF.md`, `filing-manifest.md`, `FILING-LOG.md`, `SUPERSESSION-MAP.md` (agent aa667c33: epics #399–#401, subs #402–#461) |
| F9 | I Handoff: implementation lanes read the GitHub board + `design/<topic>/agent-briefs.md`, not the run's chat history; the beta.5 lane launched in a fresh session from those artifacts alone | owner handoff decision recorded in run-state memory; beta.3 handover prompt (this session, 2026-07-05) |
| F10 | Post-ratification authority: after filing, the LIVE GitHub board outran the run docs; contradictions were neutralized by adding a MILESTONE AUTHORITY banner ("GitHub wins") rather than rewriting history | PR #465 (merged 2026-07-05); `BETA34-FORECAST.md` §g |

## Failure modes the profile must encode (observed, not hypothetical)

- **Missing `supervisor.md`** → agent identity unrecoverable without transcript archaeology (this
  run's own bootstrap). Fix: template + hard checklist item.
- **Milestone-train mutation without a draft boundary** → the near-disaster the drafts-only rule
  prevented from recurring (run-state memory, owner-caught correction 2026-07-05).
- **Stale run docs contradicting the live board** → fixed by authority-banner discipline (PR #465),
  cheaper than rewriting the planning record.
- **Evaluator commit-back push failure misread as FAIL** → verdict lives in the immutable PR
  comment; transcribe, never re-run (memory `openhands-commitback-push-failure-verdict-in-comment`).
- **Workflow mechanics**: dynamic-Workflow `args` does not thread into the script (embed data as
  consts); workflow sub-agents cannot redirect Edit/Write to another worktree (agents RETURN
  content, supervisor commits). Memories `workflow-args-not-threading`,
  `workflow-subagent-worktree-pin`.

## Open questions closed by the plan

- Name and home of the profile → plan.md LD-1/LD-2.
- Full-fan vs single-feature scaling → plan.md LD-5.
- Whether to add new templates → plan.md LD-6.
