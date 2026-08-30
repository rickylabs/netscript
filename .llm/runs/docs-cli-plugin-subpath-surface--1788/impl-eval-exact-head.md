# IMPL-EVAL — exact-head synthesis, PR #1790

**This file supersedes `impl-eval.md` as the merge-readiness evaluation for PR #1790.**
`impl-eval.md` is retained as historical record of the original (now-superseded) evaluation at head
`068d4ba30` and the first delta pass at `a6f3927b0` that covered only 5 of 14 entrypoints. Its
"history above preserved" framing was misleading — there is no separate earlier report *inside* that
file; the phrase referred to not editing its own prior sections. This synthesis corrects that framing
and supplies the missing coverage.

- **Verdict: `PASS`.** Single, explicit, final. No blocking findings.
- **Product / evaluated head:** `a6f3927b0171fb42ba62ebbeaff6497c161f7d75` (reconciled onto `origin/main` `bc33c2aa3`; confirmed zero-conflict against a subsequent base move to `2a1248d33`)
- **Current carrier (evidence-only, product-identical):** `0bfecff58d1875b837bb8128b9d81fd77a05cd74`
- **Evaluator:** sanctioned OpenRouter fallback, DeepSeek V4 Flash 0731 · high, via the checked-in
  `mcp__netscript-hybrid__delegate_openrouter` tool. Six bounded dispatches total (transport-split
  because a combined dispatch exceeds the tool's 256KB output limit at this scale — acceptable for
  this deterministic, mechanically-verifiable docs slice). Requested/observed provider, model and
  effort matched on every dispatch. Generator: Codex · `gpt-5.6-sol`, thread `01a0543c-…` — generator
  ≠ evaluator holds throughout.

## All 14 entrypoints, fresh exact-head coverage — no gaps, no sampling

| Entrypoint | Exported | Missing | Invented | Dispatch |
| --- | ---: | ---: | ---: | --- |
| `cli` `scaffolding.ts` | 23 | 0 | 0 | delta, this head |
| `cli` `testing.ts` | 29 | 0 | 0 | delta, this head |
| `plugin` `./adapter` | 56 | 0 | 0 | delta, this head |
| `plugin` `./sdk` | 48 | 0 | 0 | delta, this head |
| `plugin` `./testing` | 36 | 0 | 0 | delta, this head |
| `plugin` `./config` | 31 | 0 | 0 | delta, this head |
| `plugin` `./cli` | 31 | 0 | 0 | delta, this head |
| `plugin` `./service` | 22 | 0 | 0 | delta, this head |
| `plugin` `./protocol` | 21 | 0 | 0 | delta, this head |
| `plugin` `./scaffold` | 16 | 0 | 0 | delta, this head |
| `plugin` `./abstracts` | 15 | 0 | 0 | delta, this head |
| `plugin` `./contract-base` | 11 | 0 | 0 | delta, this head |
| `plugin` `./templates` | 3 | 0 | 0 | delta, this head |
| `plugin` `./loader` | 2 | 0 | 0 | delta, this head |
| **Total** | **344** | **0** | **0** | |

Every one of the 14 published sub-path entrypoints across both packages was independently
re-enumerated via `deno doc --json` **at the reconciled head**, not inherited from the pre-reconciliation
full evaluation. Zero missing, zero invented, across all 14.

**The 221 figure in the PR body** is the deduplicated union of distinct symbol names across the
`plugin` page (a symbol re-exported by multiple entrypoints counts once); the 344 total above is the
sum of raw per-entrypoint occurrences (cli 52 + plugin 292). Both are correct measurements of the
same fully-covered surface — verified independently by the supervisor:
`190 distinct table rows + 58 distinct call-out symbols on the plugin page = 221`, `git grep`-confirmed.

## Other checks, fresh at this head

- `git diff --check origin/main...HEAD` — **clean**.
- Deferral language ("generated separately from their own deno doc output") — **0 occurrences**,
  both pages.
- `packages/cli` / `packages/plugin` hand-written source — **0 changes**. Only
  `packages/cli/src/kernel/assets/agent-docs.generated.ts` and
  `packages/mcp/src/publish-assets.generated.ts` (both generated) touch `packages/`.
  `AUTHORITATIVE_MAPPING` untouched. No new reference pages created.
- `provenance.json` `sourceCommit` = `290ac9406` — the commit immediately preceding the asset
  regeneration (`HEAD^` at generation time: the reconciliation + whitespace-fix commit, which touches
  no `docs/site` content). Not orphaned. The plugin prose itself landed two commits earlier at
  `fa1055887` and is unchanged since — confirmed by the empty product diff recorded above.
- `mergeable: MERGEABLE` confirmed against two successive `main` states (`bc33c2aa3`, `2a1248d33`);
  never `CONFLICTING`.
- `deno.lock` — clean against `origin/main` at every check. One delegated dispatch left a stray entry
  mid-session; caught via `git status --porcelain` before promotion, discarded with
  `git checkout -- deno.lock`, never committed or pushed.
- 13 supervisor-run gates (`docs:exports-drift`, `docs:accuracy`, `docs:links`, `docs:snippets`,
  `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus`,
  four `docs/site` gates, `deno.lock` diff) — all exit 0 at `a6f3927b0`.

## Umbrella and PR-body safety

`Closes #1788` only; `#1777` referenced with no closing keyword in the body or any commit message.
Issue #1788: all 5 Scope boxes ticked by the supervisor with evidence; all 4 Acceptance boxes mirrored
by `close-gate` from the PR's evidence block — 9/9, 0 unchecked.

## No further evaluation cycle required

This synthesis is the terminal merge-readiness evaluation for #1790. `impl-eval.md` remains as
historical record and should not be cited as current — this file is.
