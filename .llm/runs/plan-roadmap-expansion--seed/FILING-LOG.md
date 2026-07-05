# FILING-LOG — roadmap expansion GitHub filing batch

**Repo:** `rickylabs/netscript` · **Executed:** 2026-07-05 · **Run:** `plan-roadmap-expansion--seed`
**Filed by:** codex account (gh from WSL). All issue bodies carry `Part of #<epic>` with **no**
closing keyword; no closing keyword on any umbrella; **no manual issue closes** (close-list empty).

---

## Labels created (repo-side, 3 new only)

`epic:telemetry-revamp`, `epic:dev-dashboard`, `epic:docs-cut` — color `5319e7`. (All `wave:*` and
the other `epic:*` labels already existed live; not re-created.)

## Milestones created

`0.0.1-beta.6` (#8), `0.0.1-beta.7` (#9), `0.0.1-beta.8` (#10). (`0.0.1-beta.5` #7, `0.0.1-stable`
#2, `Backlog / Triage` #3 pre-existed.)

---

## Epics filed (new)

| Handle | Issue | Milestone |
|---|---|---|
| telemetry-revamp | **#399** | (umbrella) |
| dev-dashboard | **#400** | (umbrella) |
| docs-cut | **#401** | (umbrella) |

## EPIC 1 — telemetry-revamp (#399) subs

| Handle | # | Milestone |
|---|---|---|
| T1 | 402 | beta.5 |
| T2 | 403 | beta.5 |
| T3 | 404 | beta.6 |
| T4 | 405 | beta.6 |
| T5 | 406 | beta.6 |
| T6 | 407 | beta.6 |
| T7 | 408 | beta.6 |
| T8 | 409 | beta.7 |

## EPIC 2 — dev-dashboard (#400) subs

| Handle | # | Milestone | Handle | # | Milestone |
|---|---|---|---|---|---|
| DDX-0 | 410 | beta.6 | DDX-10 | 420 | beta.6 |
| DDX-1 | 411 | beta.6 | DDX-11 | 421 | beta.6 |
| DDX-2 | 412 | beta.6 | DDX-12 | 422 | beta.6 |
| DDX-3 | 413 | beta.6 | DDX-13 | 423 | beta.6 |
| DDX-4 | 414 | beta.6 | DDX-14 | 424 | beta.6 |
| DDX-5 | 415 | beta.6 | DDX-15 | 425 | beta.6 |
| DDX-6 | 416 | beta.6 | DDX-16 | 426 | beta.6 |
| DDX-7 | 417 | beta.6 | DDX-17 | 427 | beta.6 |
| DDX-8 | 418 | beta.6 | DDX-18a/b/c/d | 428/429/430/431 | beta.6 |
| DDX-9 | 419 | beta.6 | DDX-19 | 432 | stable |

## EPIC 3 — docs-cut (#401) subs

| Handle | # | Handle | # | Handle | # |
|---|---|---|---|---|---|
| S0 | 433 | D1 | 440 | D7 | 446 |
| C1 | 434 | D2 | 441 | D8 | 447 |
| C2 | 435 | D3 | 442 | D9 | 448 |
| C3 | 436 | D4 | 443 | V-C | 449 |
| C4 | 437 | D5 | 444 | V-D | 450 |
| C5 | 438 | D6 | 445 | | |
| C6 | 439 | | | | |

All milestone `0.0.1-beta.7`. S0=`type:refactor` (hard precursor); C/D=`status:plan`; V-C/V-D=`status:impl-eval`.

## EPIC 4 — desktop Tier-4, under existing epic #327

| Handle | # | Milestone |
|---|---|---|
| E1 | 451 | beta.8 |
| E2 (folds #375) | 452 | beta.8 |
| E3 | 453 | beta.8 |
| E4 | 454 | beta.8 |
| E5 | 455 | beta.8 |
| E6 | 456 | beta.8 |
| E7 | 457 | stable |
| E8 | 458 | stable |

## EPIC 5 — F-ai new issues, under existing epic #238

| Handle | # | Milestone |
|---|---|---|
| FAI-4 | 459 | beta.5 |
| FAI-10 | 460 | beta.7 |
| FAI-11 | 461 | beta.7 |

---

## Existing-issue updates applied

- **#327** — Tier-4 desktop block inserted into body; orientation comment posted. (Epic milestone
  left at beta.5; unchanged.)
- **#238** — re-milestoned beta.3 → **beta.7**; F-ai re-sequencing epic comment posted.
- **#388** → beta.5 (+`wave:v1`). **#258** → beta.6 (`wave:defer`→`wave:v1`, +`status:plan`,+`priority:p1`).
  **#379** → beta.6 (+`status:plan`,+`priority:p1`; fold comment: absorbs #257). **#257** → beta.6
  (+`status:plan`,+`priority:p1`; fold comment: folds into #379). **#380** → beta.7 (+`status:plan`,+`priority:p2`).
  **#246** → beta.7 (+`status:plan`,+`priority:p2`). **#290** → beta.7 (`wave:defer`→`wave:v1`,+`status:plan`,+`priority:p2`).
  **#269** → beta.7 (+`status:plan`,+`priority:p2`). **#270** → beta.7 (+`status:plan`,+`priority:p2`).
  **#248** → stable (`wave:v1`→`wave:defer`,+`status:plan`,+`priority:p2`,+`epic:telemetry-revamp`; co-own comment: == T9/FAI-17).
  **#247** → stable (+`status:plan`). **#262** → stable (+`status:plan`). **#256** → stable (+`status:plan`).

## DAG second pass — "Depends on #N" edge comments posted on

Telemetry: #403,#404,#405,#406,#407,#408,#409. Dashboard: #413,#414,#415,#416,#417,#418,#419,#420,
#421,#422,#423,#424,#425,#426,#427,#428,#429,#430,#431,#432. Docs validation: #449,#450 (C/D authoring
already carry `Depends on #433` in body). Desktop: #454,#455,#456,#457,#458. F-ai: #461.

## labels.yml sync PR

**PR #462** — `chore/roadmap-labels-sync` → `main`, commit `cf0dc8fe`. Additive reconciliation of
`.github/labels.yml` (records live `wave:*`/`epic:*` + adds the 3 new epic labels). Labels
`type:chore`,`area:tooling`; milestone `Backlog / Triage`. **LEFT UNMERGED for coordinator review.**

---

## Skips / notes / deviations

- **#252** (FAI-6 recursive renderer) — **CLOSED** (ms beta.3). LEFT untouched per the ambiguity rule
  (do not silently reopen/re-milestone a closed issue). Coordinator: reopen or refile at FAI-6
  implementation. FAI-6 was **not** filed as a new issue (maps to closed #252).
- **#375** (desktop app-type) — **CLOSED** (Backlog/Triage). LEFT untouched. #E2 (#452) folds it; the
  #E2 resolving PR body must carry `Closes #375`. Not manually closed here (already closed).
- **F-ai conservative cardinality (per mission owner pick):** only **FAI-4/10/11** filed new. Design
  handles **FAI-7** (MCP pooling primitive, "new over #240 cluster") and **FAI-9** (beta.6 capability
  merge gate, "new") were **deliberately NOT filed** — deferred to owner. FAI-0…3 = #388; FAI-5 = #258;
  FAI-8 = #379 (+ folded #257); FAI-12…16 = #380/#246/#290/#269/#270; FAI-17 = #248 (== telemetry T9,
  filed once, cross-labelled). If the owner wants FAI-7/FAI-9 as discrete tracking issues, they remain
  to be filed under `epic:ai-stack`.
- The `#238` umbrella has no `status:` label (umbrella; left as-is aside from milestone).
- One transient: the first #327 orientation comment posted truncated (inline-newline shell escaping);
  the stub was deleted and a complete body-file comment re-posted.
