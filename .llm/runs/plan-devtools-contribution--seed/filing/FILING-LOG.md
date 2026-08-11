# FILING-LOG — DevTools contribution RFC

**Filed:** 2026-08-11 · **By:** supervisor session `session_01DChBXWYP9LStvjQztUJV5b` (Claude Opus 5 · high)
**Ratification:** owner in-turn, drift **D-19** · **Board migration approved:** owner in-turn, 2026-08-11
**RFC of record:** [`rfcs/0005-devtools-contribution.md`](https://github.com/rickylabs/netscript/blob/main/rfcs/0005-devtools-contribution.md) — **merged on `main`** at `03680f6e8`, via PR #1450

> **PLAN-EVAL:** cleared by **written owner waiver**, drift **D-18**. The formal Codex GPT-5.6 Sol
> evaluator returned **`FAIL_PLAN` twice**; every supervisor-fixable finding was closed before the
> waiver. **No evaluator `PASS` exists — do not cite one.**

## Preconditions at filing time

| # | Precondition | Evidence |
| - | ------------ | -------- |
| P0 | RFC merged on `main` and path verified **before** any issue linked to it | `git ls-tree origin/main -- rfcs/` → `rfcs/0005-devtools-contribution.md`; `origin/main` = `03680f6e8`; PR #1450 `MERGED` 2026-08-11T20:27:09Z |
| P1 | Plan-Gate cleared | **owner waiver**, drift D-18 |
| P2 | Blocking forks ratified + filing authorized | drift D-19 |
| P3 | Adversarial design pass satisfied | owner-approved substitute route — Qwen 3.8 Max + Kimi K3, drift D-15/D-16; 22 findings closed |
| P4 | F-1 / F-3 resolved | drift D-19 — F-1 self-contained `packages/devtools-core` first; F-3 `.passthrough()` before any manifest-visible pointer |

## Draft ID → live issue

| Draft | Slice | Live | Milestone | Action |
| --- | --- | --- | --- | --- |
| DT-RFC | — | **#1468** | `0.0.6` | NEW — RFC 0005 tracking issue |
| DT-1 | W0-a | **#1469** | `0.0.15` | NEW — disposable probe |
| DT-2 | W0-b | **#1470** | `0.0.15` | NEW — disposable probe |
| DT-3 | W1-a | **#1471** | `0.0.15` | NEW — **successor to #412** |
| DT-4 | W1-b | **#1472** | `0.0.15` | NEW — **successor to #424** |
| DT-5 | W1-c | **#1473** | `0.0.15` | NEW |
| DT-6 | W1-d | **#1474** | `0.0.15` | NEW — F-3 precondition |
| DT-7 | W2-a | **#1475** | `0.0.15` | NEW — boundary vs #930 stated |
| DT-8 | W2-b | **#1476** | `0.0.15` | NEW — boundary vs #937/#938 stated |
| DT-9 | W3-a | **#1477** | `0.0.15` | NEW — **co-successor to #424** |
| DT-10 | W3-b | **#1478** | `0.0.15` | NEW |
| DT-11 | W4-a | *(none)* | — | **AMEND #427** — folded, stays open as the slice |
| DT-12 | W4-b | **#1479** | `0.0.15` | NEW |
| DT-13 | W5-a | *(none)* | — | **AMEND #423** — boundary vs #934 stated |
| DT-14 | W5-b | **#1480** | `0.0.15` | NEW — public-surface change, consumer gate |
| DT-15 | W6-a | *(none)* | — | **AMEND #428** — boundary vs #933 stated |
| DT-16 | W6-b | *(none)* | — | **AMEND #429 / #430 / #431** — boundary vs #944; streams degraded state required |
| DT-17 | F-20 | **#1481** | `Backlog / Triage` | NEW — outside the epic |
| DT-18 | D-0b | **NOT FILED** | — | D-0b never decided; gap stays recorded in drift D-10/D-15 |

**14 new issues** (#1468–#1481) · **1 not filed** · **6 existing issues amended via 4 rows**.

## Epic

**#400 amended** — not replaced (standing decision D-11; a second umbrella would fragment the very
board this RFC de-fragments). Preserved **verbatim**: the ownership thesis, the three acceptance
lines, and the killed-surfaces list. Rewritten: the invent-your-own-discovery premise, the dead
`beta.6` prose, and the S1–S13 screen list → RFC 0005 pointers. Milestone unchanged
(`Backlog / Triage`).

`CR-DDX-HOSTAGNOSTIC` — raised on #400 on 2026-07-06 from epic #510 and **never resolved** — is
recorded as **accepted** (owner fork F-11). This un-dangles #544. #544 itself was **not** edited;
that body belongs to #510's lane.

## Successor-before-supersede ordering — as executed

| Superseded | Successor(s) | Order actually used | State now |
| --- | --- | --- | --- |
| **#412** | **#1471** | successor filed **first**, then the supersede comment | **open** — closes when #1471 is delivered |
| **#424** | **#1472**, **#1477** | successors filed **first**, then the supersede comment | **open** — closes when both are delivered |

**Zero filing-time closes.** Every `FOLD` / `SUPERSEDE` / `CLOSE-LATER` was recorded as a comment
and left open, because each has a precondition that filing does not satisfy. No seam is left
unowned in the interval.

## Comments posted

- **Supersede:** #412, #424 · **Fold:** #427, #734 · **Close-later:** #507
- **Re-baseline (AMEND):** #414, #415, #420, #423, #426, #428, #429, #430, #431, #551
- **Epic:** #400 body rewrite + the `CR-DDX-HOSTAGNOSTIC` resolution
- **Cross-post:** **#929** — the *single* authorized #922-adjacent touch, reporting the `.strict()`
  defect that #890 contract C8's "older CLIs ignore the block" claim rests on. Informational; it
  changes no label, milestone, or scope.

## Preservation guarantees — verified

| Guarantee | Result |
| --- | --- |
| **#922 and its 24 children untouched** | ✅ zero body/label/milestone/state changes. #933 and #944 received **nothing**. The only #922-adjacent action anywhere was the informational #929 cross-post |
| **2026-07-19 milestone train preserved** | ✅ no issue re-milestoned. New sub-issues default to `0.0.15`, matching the ratified train |
| **No undocumented labels created** | ✅ every label used exists in both `.github/labels.yml` and live. `epic:devtools`, `area:devtools`, `area:frontend` do **not** exist and were **not** created — `epic:dev-dashboard` used instead |
| **No milestones created; no issue moved** | ✅ only edit was stripping the stale "Dev dashboard (thin, contribution-based)" clause from `0.0.14`'s **description** (owner fork F-9). Its 11 open issues are unchanged |
| **No closing keyword in any issue body** | ✅ `Part of #400` only |
| **Exactly one `status:` per issue** | ✅ `status:triage` at filing |

## Deviations from the manifest — recorded, not silent

1. **DT-8 title says "six-state", the manifest said "five-state."** The manifest predates Amendment A,
   which added a sixth quarantine state (`zone-contract-mismatch`) to close a Qwen finding. Filing the
   manifest's literal title would have contradicted the merged RFC. **Substance unchanged.**
2. **All issue bodies cite `rfcs/0005-…`, not the manifest's `rfcs/0000-…`.** Per the owner's
   instruction to use the canonical `main` link; the number was assigned at acceptance.
