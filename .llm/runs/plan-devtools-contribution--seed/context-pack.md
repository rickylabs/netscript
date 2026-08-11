# Context Pack: NetScript DevTools Contribution Architecture RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-devtools-contribution--seed` |
| Branch | `plan/devtools-contribution` |
| Worktree | `/home/codex/repos/ns-rfc-devtools-contribution` |
| Current phase | **`ratify` → `file`** — all gates green; one-shot board filing is the only remaining step |
| Draft PR | [#1450](https://github.com/rickylabs/netscript/pull/1450) — **draft**, `status:plan-eval`, `Backlog / Triage` |
| Baseline | `2256a67bf` (`origin/main`, verified 2026-08-11) — unchanged all run |
| Authority | `RFC-AUTHORITY.md` — RFC is normative; `drift.md` beats the corpus; **GitHub beats all after filing** |

## Current State

**Stages A–H complete except the filing itself.** The RFC is amended, all 22 stage-D2 findings are
closed, the cross-reference sweep is clean against all three prior RFCs, and every gate is green.

**The owner has ratified everything that was blocking:** F-1 (self-contained spine in
`packages/devtools-core`), F-3 (`.passthrough()` precondition), the Plan-Gate (by written waiver, not
an evaluator PASS), and **board filing**.

**Nothing is filed yet.** The next action is the single one-shot filing pass.

## Completed

| Stage | Outcome |
| --- | --- |
| **A** | `supervisor.md` first; baseline verified; draft PR; charter read back |
| **B** | 14 agents, 0 errors; `workflow.js` committed **before** it ran; 6,327 corpus lines + 78 saved sources |
| **C** | Full corpus read; 26 cited findings; 22 numbered syntheses |
| **D** | 8 design packs; supervisor verified V1–V4 in source; 2 verifications corrected my own corpus |
| **D2** | **GLM unlaunchable (D-10)** → owner override to **Qwen 3.8 Max** + **Kimi K3** (D-15/D-16). Both ran read-only, findings-only; observed identity matched requested |
| **E** | RFC-0002, 15 sections; 14 locked decisions; all 12 charter questions closed |
| **F** | Sonnet 5 unoriented review — 1 critical + 2 major found and fixed; 12/13 citations verified |
| **G** | PLAN-EVAL ×2, both `FAIL_PLAN`; every supervisor-fixable finding closed; gate then cleared by **owner waiver** (D-18) |
| **Amendments A/B/C** | One coherent state-and-DX pass, serialised so no two agents raced the RFC |
| **Sweep** | 22 findings: **21 fixed, 1 declined with re-entry, 0 deferred** |
| **Cross-ref** | **0 contradictions, 0 duplications** vs #890 / RFC-0001 / RFC-A; 21 internal defects fixed |

## Next Steps — **all executed 2026-08-11; the run is closed**

1. ~~File once from `filing/filing-manifest.md`~~ — **done.** #1468–#1481 filed, #400 amended, 6
   existing amended via 4 rows. Train preserved (no issue re-milestoned), #922's 24 children
   untouched, no labels created. Record: `filing/FILING-LOG.md`.
2. ~~Write `FILING-LOG.md`~~ — **done**, with both deviations recorded (DT-8 six-state; `rfcs/0005`
   links).
3. ~~Post the ledger; update the PR~~ — **done**:
   https://github.com/rickylabs/netscript/pull/1450#issuecomment-5258590797
4. ~~Close the run~~ — **done.** `agentic:leak-check` clean (`survivors: []`); session record at
   `.llm/2026-08-11-devtools-contribution-rfc-seed.md`; **no `arch-debt.md` entry written** — one is
   warranted for #1481 but that file is outside this run's mutation boundary, so the obligation is
   recorded in the session record instead of being taken silently.

### Left for the owner

- **#1468** was closed as `DUPLICATE` by the owner 9 min after filing → the RFC's `tracking-issue`
  frontmatter on `main` still reads `pending`; repointing it at **#400** needs a follow-up PR.
- **#734** folds but stays open pending owner confirmation (fork **F-4**).
- **#507** / **PR #780** are close-later; #780 needs its two-file salvage into the #509 lane first.
- **D-0b** undecided → **DT-18 unfiled**, deliberately.
- One `arch-debt.md` entry for **#1481**, per the obligation above.

## Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| `docs:links --root rfcs` | **PASS** | 0 broken links/anchors/orphans; re-run after every amendment |
| `docs:accuracy` | **PASS** | re-run after every amendment |
| Code-fence balance | **PASS** | 90, balanced |
| Cross-file consistency sweep | **PASS** | 0 retired-vocabulary residue outside self-documenting correction notes |
| Cross-reference vs prior RFCs | **PASS** | `CROSSREF: 0 contradictions, 0 duplications` |
| Lock hygiene | **PASS** | `deno.lock` clean; one incidental churn caught and reverted |
| **PLAN-EVAL** | `FAIL_PLAN` ×2 → **cleared by owner waiver** | `plan-eval.md` (carries the waiver banner) |
| `check`/`test`/`lint`/`arch:check`/`quality:scan`/`e2e:cli` | `N/A` | no TypeScript, no `packages/**` source in the changeset |

## Drift and debt

**D-1 … D-19.** Seven correct the run's *own* earlier claims — D-4 (a gate that did not exist), D-6
(#890's false compatibility claim), D-7 (my corpus understated a security finding), D-8 (comment
threads reversed a board recommendation), D-9 (off-by-one citation), D-14 (evaluator budget), D-17
(I truncated my own evidence capture). Debt: none created.

## Key decisions

`plan.md` holds L1–L14. The ones a reader should know first:

- **Separate, loopback-only, dev-only host process** — no production tier, dual exclusion.
- **Self-contained spine in `packages/devtools-core`** (A1) + A6 CLI emission + A5 thin plugin.
- **Three kinds** — `panel`, `link`, `diagnostic` (reuse) — each with a named first-party consumer.
- **One identity law**, one ordering law, one panel-state union, one zone rule.
- **Host-owned deny-by-default read contract**; no URL-shaped *input* anywhere.
- **#400's ownership thesis** preserved and promoted to normative acceptance criteria.

## Commits

The draft PR's commit list plus its per-stage comments are the commit trail.
