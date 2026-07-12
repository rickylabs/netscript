# dashboard-rescope v2 ratification batch — MANIFEST

Ordered checklist of every mutation `execute_batch.sh` performs. Diff this against
`../ratification-summary.md` before firing. Owner ratification: "yes to all, proceed" (2026-07-06),
decisions D1–D7 folded in. **No closing keywords anywhere** (epic + issues), exactly one `status:`
per issue, `gh` from WSL as user `codex`, all bodies/comments via `--body-file` (relative).

Label deltas below were verified against a live snapshot taken 2026-07-06 (all 27 target issues
`OPEN`). The script renders `bodies/` into a temp dir, back-fills the 7 new numbers there, and points
every `gh` call at the rendered copy — committed sources keep `NUM_*` placeholders and the script is
re-runnable-safe (label create guarded with `|| true`).

## Step 1 — label
| action | label | color | note |
|---|---|---|---|
| create | `area:queue` | `1D76DB` | D2; `\|\| true` if exists. `.github/labels.yml` sync is a follow-up commit (NOT in this batch). |

## Step 2 — close as "not planned" (superseded) — comment, then remove `wave:v1`, clear milestone, close
| # | title | comment file | supersedes-into | D |
|---|---|---|---|---|
| 421 | DDX-11 Logs panel | `comments/close-421.md` | S6 correlated strip → Aspire logs | D4 |
| 422 | DDX-12 Resource Control panel | `comments/close-422.md` | `withCommand` contributions inside Aspire | D4 |
| 425 | DDX-15 Claude design-sync artifact | `comments/close-425.md` | #507 design-sync prototype | D4 |

## Step 3 — create 7 new issues (dependency order; numbers captured into shell vars)
| var | title | body file | labels | milestone |
|---|---|---|---|---|
| `N_DDX20` | [dashboard DDX-20] S3: Runtime-Config Monitor & Control (flagship) | `bodies/ddx20.md` | type:feat, area:config, area:fresh-ui, area:plugins, epic:dev-dashboard, priority:p1, wave:v1, status:triage | 0.0.1-beta.6 |
| `N_DDX21` | [dashboard DDX-21] S11: DB Migrations & Drift | `bodies/ddx21.md` | type:feat, area:database, area:fresh-ui, area:plugins, epic:dev-dashboard, priority:p2, wave:v1, status:triage | 0.0.1-beta.6 |
| `N_DDX22` | [dashboard DDX-22] S12: Dead-Letter Queues (queue + trigger) | `bodies/ddx22.md` | type:feat, area:queue, area:fresh-ui, area:plugins, epic:dev-dashboard, priority:p2, wave:defer, status:triage | Backlog / Triage |
| `N_TRIGDLQ` | feat(triggers): TriggerDlqPort contract route (dashboard DLQ co-req) | `bodies/triggerdlq.md` | type:feat, area:service, epic:dev-dashboard, priority:p2, wave:defer, status:triage | Backlog / Triage |
| `N_QDLQ` | feat(queue): DeadLetterStore CLI + contract API (dashboard DLQ co-req) | `bodies/queuedlq.md` | type:feat, area:queue, area:cli, epic:dev-dashboard, priority:p2, wave:defer, status:triage | Backlog / Triage |
| `N_MUT` | feat(runtime-config): mutation use-cases — set/unset + versioned current pointer bump (S3 write-back co-req) | `bodies/mut.md` | type:feat, area:config, epic:dev-dashboard, priority:p2, wave:defer, status:triage | 0.0.1-beta.7 |
| `N_DDX23` | [dashboard DDX-23] seam-event flow plane: unified envelope + HTTP boundary events (S13 co-req) | `bodies/ddx23.md` | type:feat, area:telemetry, area:service, epic:dev-dashboard, priority:p2, wave:defer, status:triage | 0.0.1-beta.7 |

**D6:** the `N_MUT` issue is the 7th, added because `@netscript/runtime-config` exposes only
read+watch use-cases today (`runtime-config-writer.ts` is deploy-provisioning, not operator
mutation). S3/DDX-20 therefore **ships read-only in beta.6**; write-back is gated behind `N_MUT`
(beta.7). **D5:** DDX-22/TriggerDlq/QueueDlq default `wave:defer → Backlog / Triage`; `N_MUT` and
DDX-23 get explicit `0.0.1-beta.7` (owner override of the defer→stable/backlog mapping — beta.7
milestone exists, #9).

## Step 4 — back-fill `NUM_*` → real numbers (rendered temp copies only)
`NUM_DDX20 NUM_DDX21 NUM_DDX22 NUM_DDX23 NUM_TRIGDLQ NUM_QDLQ NUM_MUT` substituted across all
rendered bodies + `rewrite-418.md`. Script aborts (exit 12) if any placeholder survives.

Placeholder-bearing files (must resolve): `epic-400.md`, `413.md`, `418.md`, `423.md`, `430.md`,
`ddx20.md`, `ddx22.md`, `triggerdlq.md`, `queuedlq.md`, `mut.md`, `comments/rewrite-418.md`.

## Step 5 — re-edit new issues whose bodies carried placeholders
`N_DDX20`, `N_DDX22`, `N_TRIGDLQ`, `N_QDLQ`, `N_MUT` re-edited with back-filled bodies.
(`ddx21.md`, `ddx23.md` had no placeholders — created final.)

## Step 6 — rewrite 18 existing bodies + label/milestone deltas
| # | body file | add labels | remove labels | milestone | retitle |
|---|---|---|---|---|---|
| 400 | `epic-400.md` | — | — | (keep beta.6) | ✔ "…the Aspire/Scalar satellite that drives the framework (ships as a plugin, beta.6)" |
| 411 | `411.md` | — | — | — | — |
| 412 | `412.md` | — | — | — | — |
| 413 | `413.md` | — | — | — | — |
| 415 | `415.md` | area:plugins | — | — | — |
| 416 | `416.md` | area:fresh-ui, area:config | — | — | — |
| 417 | `417.md` | area:fresh-ui, area:cli | — | — | — |
| 418 | `418.md` | area:fresh-ui, area:plugins | — | — | ✔ "[dashboard DDX-8] S13: Live Flow — request journey across framework seams" |
| 419 | `419.md` | area:fresh-ui, area:plugins | — | — | — |
| 420 | `420.md` | area:fresh-ui | — | — | — |
| 423 | `423.md` | area:service, area:config, priority:p1 | priority:p2 | — | — |
| 424 | `424.md` | area:aspire, priority:p1 | priority:p2 | — | — |
| 426 | `426.md` | area:cli | — | — | — |
| 428 | `428.md` | area:fresh-ui | — | — | — |
| 429 | `429.md` | area:fresh-ui | — | — | — |
| 430 | `430.md` | area:fresh-ui | — | — | — |
| 431 | `431.md` | area:fresh-ui, priority:p2 | priority:p1 | — | — |
| 507 | `507.md` | type:chore, wave:v1 | type:feat | 0.0.1-beta.6 | — |

Notes: existing extra labels (`area:fresh`, `gate:jsr`, etc.) are left in place — only drafted
deltas applied. All 18 keep their current single `status:plan`.

## Step 7 — #432 elevate (D3 + D5)
Fetch current body → append `bodies/432-addendum.md` → set milestone `0.0.1-beta.7`.
Priority already `p2` (no change); `wave:defer` kept. No body rewrite — append only.

## Step 8 — comments
| # | comment file | purpose |
|---|---|---|
| 408 | `comments/tighten-408.md` | tightening addendum (non-goals) |
| 427 | `comments/tighten-427.md` | tightening addendum (non-goals) |
| 418 | `comments/rewrite-418.md` (rendered) | S13 rewrite notice (waterfall scope dead) |

## Totals
1 label · 3 closed · 7 created · 18 rewritten (+#432 addendum) · 3 comments = **32 body/comment files**.

## Follow-up NOT in this batch
- One-line `.github/labels.yml` sync commit adding `area:queue` (kept off the design branch).
- Claude Design lane (Step 5 of ratification-summary) — supervisor session runs it next.
