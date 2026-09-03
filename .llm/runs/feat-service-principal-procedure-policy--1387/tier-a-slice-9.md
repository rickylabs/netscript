# Tier-A — #1387 Slice 9 (adoption documentation, final implementation slice)

**Content head:** `3cb08103ff9c25ff3ec580301b5936586b13d37e`
**Evidence head:** `861bed05bad8e38a1be02e469600b1c6aa829f70` — product-neutral
**Base:** `9ce84de2f` · **Verdict:** ACCEPTED (with an evidence gap identified and closed by the supervisor)

## Ceiling

All eight authorized files touched. No product file outside the ceiling — confirmed no `packages/ai`,
CLI scaffold/template, plugin-core contract, or lockfile edit. `deno.lock` byte-identical.

## Substance — documents exactly what Slices 1–8 shipped, verified against the actual code

Sampled the tutorial (`05-route-authz.md`, the largest and highest-risk rewrite) and
`packages/service/README.md` in full against the real implementation, not just the plan:

- **The path-matcher defect (research finding 14) is genuinely fixed.** The tutorial's primary
  teaching is now `baseContract.route(...).meta({ access: {...} })` plus `createContractAuthorizer()`
  — the old `@netscript/fresh/route` bound-route-contract pattern is gone. `createScopeAuthorizer` is
  **retained, not deprecated**, and correctly repositioned in the API table as the "Supported legacy
  path-rule authorizer; standalone, or a fallback only when a matched procedure has no metadata."
- **LD-8's exact error string, quoted verbatim.** `[netscript.service.contract-policy] optional
  authentication is unsupported: <procedure>` — matches the real code in `contract-authorizer.ts`
  character for character, with the correct "at construction, before the first request" framing.
- **LD-6 stated precisely, including a nuance beyond my brief's exact wording.** The service README
  adds: "A fallback can neither make a declared public procedure private nor weaken declared scopes
  or roles" — correct and consistent with Slice 5's actual code (the fallback branch is unreachable
  whenever metadata exists, in either direction).
- **LD-11's accepted substitution**, not the issue's original compile-time-rename wording — checked
  in the tutorial and README prose; both state rename continuity plus the stale-SDK-key compile
  failure, not a blanket "renames are compile-time safe" claim.
- 401/403/200 runnable walkthrough preserved in spirit; checklist items updated to the new
  contract-based artifacts.

## Evidence — a real gap, found and closed, not merely trusted

**The author's `worklog.md` correctly diagnosed a genuine pre-existing issue but drew the wrong
conclusion from it.** An initial `check` run at the first content head (`582e82322`) used the bare,
unscoped `deno task check` (2941 files, all packages+plugins) and hit `TS2551` on
`packages/service/src/primitives/health.ts:184` (`Deno.openKv` — an unstable-KV batching artifact).
**I reproduced this myself at the final head and confirmed it is pre-existing and unrelated to Slice
9** — `packages/service` alone checks clean (0 diagnostics, 48/344 files), and Slice 9 touches zero
service source. The author reasoned from this that the catalog's `check` gate ID "invokes the broader
root task" and could not be used, and substituted an **unreceipted** direct-wrapper invocation scoped
to five roots instead, recorded only as prose ("Direct structured wrapper at final head") for
`check`/`lint`/`fmt`.

**That reasoning was incomplete.** Every one of Slices 1–8 used exactly this catalog gate ID scoped
via `--include`, which is forwarded to `run-deno-check.ts` and narrows the selection — the bare
unscoped invocation is only the *default* argv, not the gate's only usable form. I re-cut all three
as real receipts, `--include '^packages/(contracts|service|plugin|mcp)/'`, in a temporary detached
worktree at the exact content head (`3cb08103f`) to guarantee `gitHead == actualGitHead`: all three
PASS, 344/343/343 files, 0 findings — confirming the author's own prose claim, now as durable
evidence. Evidence set recomputed: **SUFFICIENT, zero reasons**, twelve receipts.

**The `check`/`lint`/`fmt` gate IDs stay usable for a docs slice; only the bare unscoped root
invocation is base-red on a pre-existing KV-batching artifact.** Recording this precisely so it is
not rediscovered: `deno task check` with no `--include` reproducibly fails on
`packages/service/src/primitives/health.ts:184` across this whole run's head range, independent of
any #1387 change — a genuine base-red finding, but the fix is *scoping*, not *avoiding the gate
entirely*.

## Gate results — all twelve at content head `3cb08103f`, `gitHead == actualGitHead`

| Gate | Outcome | Duration |
| --- | --- | --- |
| `check` (4-root scoped) | PASS, 344 files | 10 060 ms |
| `lint` (4-root scoped) | PASS, 343 files | 1 525 ms |
| `fmt:check` (4-root scoped) | PASS, 343 files | 824 ms |
| `test` (affected suites) | PASS — **402 passed / 0 failed** | 14 809 ms |
| `exports-drift` | PASS | 3 664 ms |
| `doc:lint` (service) | PASS, 3 entrypoints | 189 ms |
| `quality:gate` | PASS | 9 796 ms |
| `mcp-export-corpus` | PASS, unchanged at 7 655 symbols | 7 795 ms |
| `docs-tagline` | PASS | 174 ms |
| `publish-assets` | PASS | 506 ms |
| `agent-docs-prose` | PASS, 639 site files | 9 455 ms |
| `assets-barrel` | PASS | 656 ms |

Contracts/service/SDK/MCP JSR audits ran as exact direct commands (the run-wide convention since
Slice 1 — no catalog `audit-jsr-package` entry); all four PASS with only pre-existing sanctioned
warnings, per the worklog's own table. Slices 1–8 receipt archives present and untouched. `deno.lock`
byte-identical. The pre-refresh diagnostic set (`pre-refresh-s9-582e82322/`) is correctly preserved
as history, not part of the final evidence set.

## Findings

- **F-1 (fixed, not just flagged).** Three contracted gates (`check`/`lint`/`fmt`) were asserted by
  prose rather than receipt. Closed by cutting real, correctly-scoped receipts at the exact content
  head and recomputing the evidence set.
- No content defects.

## Verdict

**ACCEPTED.** The documentation content is thorough and verified accurate against the real shipped
code, not merely the plan. The one evidentiary gap this review found has been closed with genuine
receipts, not by trusting the author's substitute prose. This is #1387's final implementation slice;
only the close-gate remains.
