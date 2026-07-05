# Seed Run — Discovery → Roadmap → Orchestration

Operating protocol for **seed runs** — planning-only supervisor runs that take a major feature,
cross-cutting refactor, replan, or large triage from zero to a **fully-planned, GitHub-native,
implementation-ready board** in one shot: empirical discovery (repo + docs + market), synthesized
objectives, logical slices, per-epic design packs with agent briefs, adversarial + evaluator
verdicts, and — only after owner ratification — a one-shot filing of epics, milestones, and issues
that implementation lanes then execute against without reverse-engineering the run.

> **Provenance.** Promoted from `plan-roadmap-expansion--seed` (draft PR #397; ratified plan filed
> as epics #399–#401 + issues #402–#461; authority reconciliation PR #465), which proved this shape
> across five topics and a repeat single-topic leg (F-ai). Run IDs use the `--seed` suffix. Like
> `workflow/supervisor.md` (promoted from PR #96), this file freezes the **stage contracts**, not
> the exemplar's exact folder tree or prose — the exemplar is one instantiation, not a template.

## When to use a seed run

Use a seed run when the work is **board-shaped**: it will become one or more epics with many
issues, and the plan quality depends on evidence you do not yet hold (what the repo actually does,
what the market does, what the docs claim). Triggers: a net-new major feature, a cross-cutting
refactor, a roadmap replan, a big triage.

**Do not** use a seed run for a single slice or an already-scoped fix — that is normal
`run-loop.md`. A seed run whose fan-width is forced to 1 topic is still legitimate (single-feature
seed); a seed run for a 30-line change is ceremony. When in doubt: if the deliverable is *issues*,
seed; if the deliverable is *code*, run-loop.

## Run layout

- **Branch** `plan/<subject>` (the seed-run branch type in the `netscript-pr` taxonomy), worktree
  under `.llm/tmp/`, **draft PR** opened at stage A — the commit trail. The PR stays draft for the
  whole run; a seed run never merges itself.
- **Run dir** `.llm/runs/plan-<subject>--seed/` with the standard mandatory artifacts
  (`supervisor.md` **first**, then `research.md`, `plan.md`, `worklog.md`, `context-pack.md`,
  `drift.md`; plus `phase-registry.md` only when the run spans multiple phase groups —
  `activation.md` step 9) plus the seed-specific artifact classes below. Discovery corpus layout
  (`research/`, `matrix/`, `analysis/`, `context/` per topic in the exemplar) is free-form — what
  is fixed is each stage's contract, not its folder names.
- **Planning-only, two mutation surfaces**: no framework code, ever. On GitHub, the run's **own
  draft PR** (body, comments, PR labels/milestone) is the commit trail and is always writable;
  the **board** — issues, epics, milestones, repo label set — is untouchable before stage H.

## Stage contracts

Every stage names what it **produces** and what **proves** it done. Lanes are bound by tier —
model bindings live only in [`lane-policy.md`](./lane-policy.md).

| Stage | Contract (produce → proof) | Lane |
| --- | --- | --- |
| **A — Bootstrap** | `supervisor.md` + run dir + draft PR + charter read-back → opening PR comment | A |
| **B — Discovery corpus** | multi-surface deep search fanned across **repo source, docs, and external/market solutions**, structured (schema) outputs per topic; drift-candidate ledger → committed corpus, every claim cited | C |
| **C — Synthesis** | supervisor reads the **full** corpus; synthesis doc naming the deep-dive topics + resolutions of supervisor-delegated decisions → committed synthesis | A |
| **D — Deep-dive packs** | one focused sub-agent per topic; each returns a design pack: `proposal` + `epic-and-issues` (draft text only) + `agent-briefs` + `open-questions` → committed `design/<topic>/` | B |
| **E — Plan lock** | integrated `plan.md`: locked decisions, **owner-fork sweep** (every owner decision numbered, none silently taken), cross-epic DAG, milestone train, risk register, gate matrix → PR body refreshed + stage comment | A |
| **F — Adversarial** | unoriented review of the locked plan on a native worktree; severity-tagged findings → findings file + per-finding triage disposition + fix commits | distinct-model reviewer (see Stage F), then A |
| **G — PLAN-EVAL** | separate-session evaluator verdict of record → `plan-eval.md` = `PASS`. **Hard stop**: no stage H before PASS | E |
| **H — Ratify + file** | owner decision brief (the numbered forks) → owner picks → **one-shot filing** from a manifest → `FILING-LOG.md` + supersession map | owner, then A/B |
| **I — Handoff** | implementation lanes launched from **GitHub + the design packs**, not this run's chat history; per-epic briefs carry `use harness` + a `## SKILL` chapter | A |

### Stage B — evidence-citation gate

The corpus is only as good as its traceability. **Every finding, matrix row, and comparison claim
traces to a source**: a file path + line, a `deno doc` surface, a fetched artifact saved under the
run (see `workflow/resource-aggregation.md`), or a cited external URL. An uncited claim is not a
finding; the evaluator at G is entitled to fail the plan on uncited load-bearing claims. The
outward-looking leg (market/competitor teardown) is what distinguishes a seed run from
navel-gazing — do not skip it, and hold it to the same citation bar.

Stage-B workflows obey the Tier-C hard rule in `lane-policy.md`: the generated `workflow.js` is
copied to `<run-dir>/workflows/<slice>-workflow.js` and **committed before the workflow
executes** — an uncommitted workflow does not run, and a corpus produced by one does not count as
Stage-B proof.

### Stage D — packs are drafts

`epic-and-issues.md` files are **draft text only — no GitHub mutations**, and say so in their H1.
Issue drafts follow `netscript-pr` (colon taxonomy, milestone mapping, `Part of #<epic>` in
bodies — **never a closing keyword in an issue body or on an epic**). Sub-agents RETURN content;
the supervisor commits (workflow sub-agents cannot redirect writes to another worktree).

### Stage F — the adversarial lane

What is fixed about Stage F: the reviewer is **unoriented** (gets the artifacts, not the
supervisor's framing), runs in a **separate session on a model distinct from every lane that
authored the plan**, and produces **findings only** — the supervisor triages and commits fixes.
Which tier supplies the reviewer is per-run configuration recorded in `supervisor.md` per
`lane-policy.md` (the exemplar used Tier D; a plan is not a source-edit slice, so this is a
diversity choice, not a source-lane requirement).

### Stage H — the ratification boundary and filing discipline

The boundary between G and H is the profile's crown jewel: **zero board mutation — issues, epics,
milestones, repo labels — until the owner ratifies the decision brief in-turn** (a stale or
relayed approval does not count; approval does not survive compaction — re-surface, never route
around). The run's own draft PR stays writable throughout; the board does not.

Filing then happens **once, from a committed manifest**, in dependency order:

1. labels (verify against `.github/labels.yml`; file a parity PR if the file lags live),
2. milestones (create only what does not exist — verify live first; title-match is exact),
3. epics, then sub-issues (`Part of #<epic>`, full taxonomy, milestone),
4. reconciliation of pre-existing issues per a **supersession map** (`KEEP`/`FOLD`/`CLOSE` per
   issue; default to zero filing-time closes — fold via a downstream PR's closing keyword),
5. `FILING-LOG.md` mapping every draft-ID → live issue number, committed to the run.

**After filing, GitHub is the single source of truth.** Run docs that carry milestone/issue tags
get an **authority banner** ("GitHub wins on conflict") instead of retroactive rewrites — the
planning record stays honest; the live board stays authoritative.

## Hard invariants

- Both `lane-policy.md` invariants (generator-session ≠ evaluator-session; no lane
  self-certifies — the supervisor substantively reviews every landed stage before its sign-off
  commit).
- `supervisor.md` written at stage A from `templates/supervisor.md`. A run dir without it is not
  activated (lane-policy § Supervisor identity) — enforced here because the exemplar itself
  skipped it and its identity had to be recovered by transcript search.
- Drafts-only before H (board untouchable; the run's own draft PR writable); one-shot manifest
  filing; GitHub authority after H.
- Evidence citation at B (and anywhere a claim is load-bearing).
- G is a hard stop with a verdict of record. If the evaluator's commit-back push fails, transcribe
  the verdict from the immutable PR comment — do not re-run a passed eval.

## What varies per run (do not cargo-cult)

Fan-width (5 topics vs 1), corpus folder taxonomy, the number of owner forks, whether a repeat leg
is needed (the exemplar ran a second A→G loop for one late topic), and the milestone-train shape
are all per-run outputs. If you are copying the exemplar's folder names without knowing why, stop
and re-read the stage contracts.

## Landmines (pointers, not restatement)

- Dynamic-Workflow `args` may not reach the script — embed inputs as consts in the script body.
- Evaluator "Job status: failure" with a PASS verdict in the PR comment = commit-back push
  failure, not a FAIL.
- `gh` bodies via `--body-file` only; run `gh` from a neutral dir when in a Windows worktree.
- Push with explicit refspecs; a worktree created off `origin/main` inherits it as upstream.
- Tool-surface mandates (rtk, deps wrappers, scoped check/lint/fmt) live in `workflow/tooling.md`
  and the `netscript-tools` / `netscript-deno-toolchain` skills.

## Acceptance

This profile's acceptance test is **the next real seed run**, not the PR that lands this file: a
fresh supervisor executes A→I from this doc alone and reproduces the exemplar's quality (board
filed, implementation launched from GitHub without reverse-engineering the run). Until that
dogfood run passes, treat this doc as provisionally promoted.

## Checklist

- [ ] Subject is board-shaped (epics + issues), not a single slice.
- [ ] `supervisor.md` written at stage A; draft PR open; charter read back.
- [ ] Stage-B corpus committed with citations; external/market leg present; every Tier-C
      `workflow.js` committed under `<run-dir>/workflows/` before it ran.
- [ ] Synthesis names deep-dive topics; delegated decisions resolved with evidence.
- [ ] Design packs committed as drafts (no-mutation H1; `netscript-pr`-conformant issue drafts).
- [ ] `plan.md` locked with a numbered owner-fork sweep; PR body current.
- [ ] Adversarial findings triaged with per-finding dispositions.
- [ ] `plan-eval.md` = PASS (separate session) before any GitHub mutation.
- [ ] Owner ratified in-turn; filing executed once from the committed manifest.
- [ ] `FILING-LOG.md` + supersession map committed; authority banners on tag-carrying run docs.
- [ ] Implementation handoff briefs point at GitHub + design packs, carry `use harness` +
      `## SKILL`.
