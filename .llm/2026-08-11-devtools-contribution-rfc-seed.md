# 2026-08-11 — DevTools contribution architecture: seed run, RFC 0005, board migration

**Run:** `plan-devtools-contribution--seed` · **Shape:** seed run (stages A–I), **planning-only**
**Supervisor:** Claude Opus 5 · high · `session_01DChBXWYP9LStvjQztUJV5b`
**Branch:** `plan/devtools-contribution` · **PR:** #1450 (**merged**) · **Baseline:** `2256a67bf`

## What shipped

- **`rfcs/0005-devtools-contribution.md`** — merged on `main` at `03680f6e8`. ~4,500 lines,
  15 sections. First numbered RFC ever merged under the documented `rfcs/` process.
- **Board migration**, executed once: 14 new issues (#1468–#1481), epic #400 amended, 6 existing
  issues amended across 4 rows, `0.0.14`'s milestone description corrected.
- **Full planning corpus** under `.llm/runs/plan-devtools-contribution--seed/` — 26 research
  findings, S-1…S-22 synthesis, 8 design packs, supersession map, filing manifest, decision brief,
  **D-1…D-20** drift log, FILING-LOG.

## The three owner decisions that shaped it

1. **Do not waive the adversarial design pass** — when the GLM 5.2 lane turned out to be
   unlaunchable (D-10), substitute **Qwen 3.8 Max** rather than skip. Then **split the lane**: Qwen
   takes architecture, **Kimi K3** takes pure UI/UX (D-15/D-16).
2. **No deferred acceptance** — every one of the 22 findings closes as fixed or declined-with-reason.
3. **Waive PLAN-EVAL** after two `FAIL_PLAN` cycles, once every supervisor-fixable finding was
   closed (D-18).

The lane split paid for itself. Qwen and Kimi could not see each other's output and **independently
reported the same three defects** — string-only table cells, the §5 `traces/` route contradiction,
and the under-specified ranked feed. Convergence between an architecture reviewer and a UX reviewer
is the strongest evidence either pass produced, and it would have been invisible under one merged
reviewer.

## What the run got wrong, and how it was caught

Eight of the twenty drift entries correct **this run's own earlier claims**. The ones worth carrying
forward:

| # | The error | How it surfaced |
| - | --------- | --------------- |
| **D-4** | Planned a Markdown `deno fmt` gate that does not exist — `fmt.include` is `packages/**`/`plugins/**` TS only. It would also have rewritten verbatim upstream evidence | Reading the config instead of assuming it |
| **D-7** | My corpus understated a security finding: bare `--allow-read`/`--allow-write` is **whole-filesystem**, not project-scoped. A subagent was right and I was wrong | Subagent contradicted the supervisor and won |
| **D-8** | Board claims were wrong in a way that **reversed** a recommendation I was about to make — `CR-DDX-HOSTAGNOSTIC` does exist on #400, and a 2026-07-19 owner-ratified train had already re-milestoned the children | Checking the live board rather than the corpus |
| **D-17** | I piped both design passes through `tail -40`, **truncating my own evidence** and losing most findings. Kept the truncated tails as evidence, re-ran with full redirection — then had to correct D-17 itself for overstating its remedy | Counting findings against the reported severity totals |
| — | A **stale `worklog.md`** claimed the GLM pass had run. That is precisely the false-green this RFC's §11.7 exists to prevent. Three more stale rows found on the follow-up sweep | Re-reading my own artifacts as an adversary would |

**The one that repeated:** `git commit -m "…"` ate backticked identifiers **twice**, requiring an
amend + `--force-with-lease` both times. The memory rule is now unconditional — *never* `-m` in this
repo, no judgement call — because the first, conditional version left room for exactly the judgement
that failed the second time.

## Verified claims worth reusing

- **`PluginInstallerManifestSchema` ends in `.strict()`** — `packages/plugin/src/protocol/manifest.ts:283`.
  RFC #890's contract C8 states older CLIs *"ignore the block"*; `.strict()` **hard-rejects** unknown
  keys, so an older CLI fails manifest parsing outright rather than degrading. Cross-posted to #929;
  handled for the DevTools family by #1474 (fork F-3, `.passthrough()` **before** any
  manifest-visible pointer). *(Initially miscited `:282` — corrected in D-9.)*
- **`plugins/streams` has no oRPC contract surface at all** —
  `arch-debt.md#streams-connector-sound-deferred` (`:450`). The RFC requires the contract-provenance
  panel to render a **labelled degraded state citing that debt**, not an empty list. Anchor and line
  range verified at close.
- **Six canonical trigger kinds**, not eight — `packages/plugin-triggers-core/src/domain/constants.ts:5-29`.

## Close-out state

| Item | State |
| --- | --- |
| `agentic:leak-check` | **clean** — `survivors: []`, aspire `ok`, docker `ok` |
| Run worktrees | 4 run-owned remain (`ns-devtools-d2-{qwen,kimi}`, `ns-devtools-planeval{,-c2}`), consistent with repo practice. **Not removed** — no cleanup was authorized |
| `arch-debt.md` | **No entry written.** See obligation below |
| `lessons/` | **No promotion.** The promotion rule needs a repeated lesson across runs; D-17 and the backtick failure are one run each. The backtick rule went to session memory instead |
| Board | migrated; #922 and its 24 children **untouched** |

### Recorded obligation — one arch-debt entry is warranted and was not written

**#1481** (`/design` ships ungated in `fresh-ui`) is a live doctrine violation sitting in
`Backlog / Triage`, i.e. **without a time-bounded plan**. Doctrine
(`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:184-195`) permits a violation to
remain only when recorded in `arch-debt.md` **with** such a plan.

`.llm/harness/debt/arch-debt.md` is **outside this run's mutation boundary** (`rfcs/**` and the run
dir only), and PR #1450 is already merged — writing the entry needs its own PR. Recording it here
rather than writing it silently or dropping it.

## Pointers

- RFC: [`rfcs/0005-devtools-contribution.md`](https://github.com/rickylabs/netscript/blob/main/rfcs/0005-devtools-contribution.md)
- Filing record: `.llm/runs/plan-devtools-contribution--seed/filing/FILING-LOG.md`
- Findings closure: `.llm/runs/plan-devtools-contribution--seed/design/ux-evidence/FINDINGS-SWEEP.md`
- Drift: `.llm/runs/plan-devtools-contribution--seed/drift.md` (D-1…D-20)
- Ledger comment: https://github.com/rickylabs/netscript/pull/1450#issuecomment-5258590797
