# Supervisor Identity — release-0.0.6-internals--orchestration

Topical milestone orchestrator for the **0.0.6 chores/internals lane**: internal quality and gate
correctness. Profile: `workflow/milestone-run.md` (topical subset — this lane owns five issues, not
the whole milestone, and does **not** own canary or stable publication).

| Field | Value |
| --- | --- |
| Model | Claude Opus 5 (`claude-opus-5`), effort `high` |
| Session | `session_01R1uTFgh4emCPxSs7m72Pqf` — https://claude.ai/code/session_01R1uTFgh4emCPxSs7m72Pqf |
| Host | Linux 6.18.33.2-microsoft-standard-WSL2 (WSL2), user `codex` |
| Checkout | `/home/codex/repos/netscript-547-lffix` (primary repo checkout) |
| Worktree | `/home/codex/repos/netscript-006-internals` |
| Branch | `chore/release-0.0.6-internals-orchestration` |
| Baseline | `01aa12b67` — `docs(harness): record FILING-LOG -- board migration executed once (#1523)`, identical to `origin/main` at 2026-08-12 (0 commits ahead, clean tree) |
| Run ID | `release-0.0.6-internals--orchestration` |

## Owned scope (exclusive)

| Issue | Priority | Title (abbrev.) | Cluster |
| --- | --- | --- | --- |
| #1436 | p2 | close-gate closing-keyword parser matches inside words | PR-A (gate trust) |
| #1415 | p1 | acceptance mirror ticks a box whose evidence says "Pending" | PR-A (gate trust) |
| #1403 | p0 | `quality:gate` substantially uninformative (coverage) | PR-B (quality rail) |
| #1380 | p2 | doctrine verdict table + `arch:check:repo` accepted-red | PR-C (quality rail) |
| #1378 | p1 | `quality:scan` cannot see exported `any` / unbudgeted allowance / docs snippet | PR-D (quality rail) |

Not owned, explicitly: every other 0.0.6 issue. PR #1522 is unrelated and was removed from the
milestone by the owner — this lane does not touch it.

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Claude · Anthropic · Opus 5 · high | This orchestrator session. Coordinates; does not write framework or tooling implementation code. |
| `deep_analysis` | Claude · Anthropic · Fable 5 · medium | Optional sub-agent for rail design questions (rename-vs-deletion policy, export-reachability strategy). |
| `light_implementation` | Codex · OpenAI · GPT-5.6 Sol · low | Default implementer: PR-A, PR-B. Mobile-visible WSL daemon-attached thread. |
| `normal_implementation` | Codex · OpenAI · GPT-5.6 Sol · medium | PR-C (decision-heavy: per-row rename-vs-deletion, RFC-location resolution). |
| `complex_implementation` | Codex · OpenAI · GPT-5.6 Sol · high | PR-D (#1378 — export-reachability via `deno doc --json`, allowance registry, docs-fence extraction). |
| `review_codex_light` | Claude · Anthropic · Opus 5 · high | Orchestrator slice review of Sol·low work (PR-A, PR-B). |
| `review_codex` | Claude · Anthropic · Fable 5 · low | Adversarial review of Sol·medium work (PR-C). |
| `review_codex_complex` | Claude · Anthropic · Fable 5 · medium | Adversarial review of Sol·high work (PR-D). |
| `formal_plan_evaluation` | Codex · OpenAI · GPT-5.6 Sol · high | PLAN-EVAL of the quality-rail plan — Claude-authored plan ⇒ opposite family is Codex. |
| `formal_impl_evaluation` | Codex · OpenAI · GPT-5.6 Sol · xhigh **or** Claude · Fable 5 · medium | Per PR: whichever family is opposite the author of that PR's code. Codex-authored PRs ⇒ Fable 5 · medium. |
| `light_implementation` (watcher) | Codex · OpenAI · GPT-5.6 Sol · low | CI watcher / minor green-up to merge-ready. |

Routes are read from `.llm/harness/workflow/lane-policy.md`; the table above records only which
canonical lane is bound to which role in this run.

## Evaluator plan per PR

| PR | Issues | PLAN-EVAL | IMPL-EVAL |
| --- | --- | --- | --- |
| PR-A | #1436, #1415 | **N/A — owner waiver** (mechanical; complete contract, scope, acceptance and gates already in the issue bodies). Substituted by executed negative-case proof. | **N/A — owner waiver** (brief §3). Substituted by orchestrator slice review + RED→GREEN negative-case evidence on both parsers. |
| PR-B | #1403 | Covered by the single rail PLAN-EVAL. | Required — fresh opposite-family session. |
| PR-C | #1380 | Covered by the single rail PLAN-EVAL. | Required — fresh opposite-family session. |
| PR-D | #1378 | Covered by the single rail PLAN-EVAL. | Required — fresh opposite-family session. |

One rail PLAN-EVAL covers PR-B/C/D because the three issues overlap on root lists, scan semantics,
doctrine and architecture debt; evaluating their sequencing separately would evaluate the wrong
thing. The generator (this session) never evaluates its own plan or any PR's implementation.

## Recorded lane/eval overrides

1. **PLAN-EVAL and IMPL-EVAL waived for PR-A (#1436/#1415).** Authorization: owner brief
   `/tmp/ns006-internals-orchestrator.md` §3 — "#1436/#1415 are mechanical: no ceremonial PLAN-EVAL
   or IMPL-EVAL; record N/A/owner waiver and prove negative cases." The substitute evidence is a
   demonstrated negative case per fix (RED at the pre-fix parser, GREEN after), not a claim. Mirrored
   in `drift.md` D-1.
2. **OpenHands not used for formal evaluation.** `lane-policy.md` already pauses the automated cloud
   agent lane (owner, 2026-08-06), and #1524 (`fix(agentic): fail closed on open evaluators`) is
   still an open draft PR with no milestone. Formal evaluation therefore runs in fresh **native
   opposite-family** sessions, which is the documented local default. Mirrored in `drift.md` D-2.
3. **No canary declared by this lane.** Root orchestration owns canary and stable publication
   (brief §7). This lane reports each merge immediately and keeps `cut-trace.md` live; it declares no
   canary point and runs no publish step. Mirrored in `drift.md` D-3.

## Control-branch discipline

`chore/release-0.0.6-internals-orchestration` carries **orchestration evidence only** — the run dir
under `.llm/runs/release-0.0.6-internals--orchestration/`. It is never an umbrella implementation
branch. All five issues close through normal leaf PRs opened directly against `main` from their own
fresh worktree/branch.
