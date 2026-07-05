# Supervisor Identity — harness-seed-run-profile--codify

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated.

| Field | Value |
| --- | --- |
| Model | Fable 5 (`claude-fable-5`) |
| Session | Claude Code session `1bd79985-eeac-4c39-938f-0cbad5688c6e` — https://claude.ai/code/session_012wKHquACkXnWPDgJYhhFjN |
| Host | Windows 11 (`win32`), user `chaut` |
| Checkout | `C:\Dev\repos\netscript-framework` (main) |
| Worktree | `C:\Dev\repos\netscript-framework\.llm\tmp\wt-seed-profile` |
| Branch | `harness/seed-run-profile` |
| Baseline | `eab02889` (main, 2026-07-05) |
| Run ID | `harness-seed-run-profile--codify` |

## Provenance note

This session is the **same agent** that supervised the exemplar run
`plan-roadmap-expansion--seed` (all its sub-agents are children of this session; recovered by
transcript search on 2026-07-05 because the exemplar run — in violation of the existing
lane-policy rule — never wrote its own `supervisor.md`). That gap motivates two deliverables in
this run: `templates/supervisor.md` and the seed-run checklist item enforcing it.

## Lane table in force

| Tier | Binding | Role in this run |
| --- | --- | --- |
| A | Fable 5 (this session) | research distillation, plan, authoring of harness workflow docs (design/doctrine authoring is Tier-A surface per lane-policy), slice review + sign-off commits |
| D | WSL Codex (daemon-attached) | F1 unoriented adversarial review of the authored profile |
| E | OpenHands (separate session) | evaluator verdict of record on the authored artifact set |

## Recorded lane/eval configuration (owner-directed)

Owner steering (in-chat, 2026-07-05, ratified twice) fixed this run's evaluation protocol:
**draft the profile → WSL Codex adversarial → separate-session OpenHands eval → owner
ratification; the run does not self-certify and does not merge.** This is a docs-only,
single-surface run (SCOPE-docs) where the plan and the implementation are the same artifact
class; the two evaluator passes are realized as the Codex adversarial pass + the single
OpenHands separate-session verdict, per the owner's explicit instruction. Recorded here and in
`drift.md` per lane-policy ("everything else is configuration").

Both hard invariants hold: generator-session ≠ evaluator-session, and no lane self-certifies
(Tier-A review precedes every sign-off commit; the final verdict is OpenHands' + the owner's).
