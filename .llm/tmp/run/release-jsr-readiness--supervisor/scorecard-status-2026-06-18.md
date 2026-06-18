# Scorecard re-grade -- evidence pack (2026-06-18, supervisor-assembled)

> Supervisor-assembled EVIDENCE only. The scorecard verdict is evaluator-owned
> (separate OpenHands session) -- this file does NOT grade PASS. It records the
> current umbrella state (`release/jsr-readiness`) for the scorecard-eval handoff.

Umbrella tip at assembly: `8197afad`. Compared against `origin/main` `cc3b8731`.

## A3 (Pages onboarding deploy) -- EVIDENCE: deploying GREEN

- Pages enabled (source = GitHub Actions; `build_type=workflow`, `public:true`, HTTPS enforced).
- Deploy workflow `.github/workflows/pages.yml` wired (push to main on `docs/site/**` +
  `workflow_dispatch`). Verification deploy ran GREEN: Actions run `27790127099` build+deploy
  success; live HTTP checks: `/netscript/` 200 (themed, `ns-theme` anti-flash, base-prefixed
  nav, pagefind `#search`), `/netscript/reference/logger/` 200, `/netscript/styles/docs.css` 200.
- Temp release-branch trigger reverted to main-only (`8197afad`). Inert remnant: a
  `release/jsr-readiness` entry remains in the `github-pages` env deployment allowlist
  (removable post-merge; harmless once trigger is main-only).

## BLOCKER -- check-test regression on the umbrella (NOT pre-existing)

- `check-test` (ci.yml: `deno task check` + `deno task test`) is GREEN on main
  (`cc3b8731`) but RED on `release/jsr-readiness` (runs 27789499172 / 27789871653 /
  27790128908). `deno task check` (1598 files) passes; `deno task test` fails on test-file
  type-checking: "Found 92 errors -> Type checking failed" (~86 fresh-ui JSX component errors:
  44x TS2786, 37x TS2559, 5x TS2322; 6x TS2769/2771 in the docs-examples fixture).
- ROOT CAUSE: PR #58's fresh-ui A1 (`deno doc --lint`) fix rewrote all 7 interactive runtime
  components (`packages/fresh-ui/src/runtime/{accordion,dialog,drawer,popover,sheet,tabs,
  tooltip}/*.tsx`) to `export function XxxRoot(props: unknown): unknown { ... }`. The `: unknown`
  return kills slow-types/doc-lint warnings (A1) but makes the components invalid JSX element
  types. The package's own guard `packages/fresh-ui/tests/consumer-render.test.tsx` (added for
  drift D-5c2-2 precisely to catch `: unknown` returns at a consumer JSX call site) now fails,
  as do `_fixtures/docs-examples_test.ts`, `primitives.test.tsx`, `foundation.test.tsx`.
- IMPLICATION: A1 is NOT genuinely satisfied -- the fix traded the doc-lint gate for the
  consumer-JSX/check-test gate. The scorecard cannot credibly PASS while the umbrella regresses
  `deno test` vs main.

## Required fix before scorecard-eval / publish (WSL Codex lane -- framework src)

Give the 7 interactive runtime component families explicit signatures that satisfy BOTH gates:
concrete, non-inferred prop/return types that are valid Preact JSX components (e.g. typed props +
`VNode`/`FunctionComponent`-compatible return) instead of `props: unknown): unknown`. Then
`deno task test` (consumer-render guard) AND `deno doc --lint` (no-slow-types, A1) must both be
green. Re-run check-test to confirm; A1 full-export-set lint must stay 26/26.

## Secondary (non-blocking) -- quality fmt drift

`quality` job (`deno task fmt:check`, root `deno fmt` over `packages/**`/`plugins/**` *.ts(x)`)
is RED, and was already RED on parent `b4e15113`. CI documents `quality` as additive/non-blocking
("a red quality cannot block the merge gate"). Not a docs-site issue (root fmt excludes
`docs/site`). Clean up in the fresh-ui fix slice or a dedicated fmt pass; not a publish blocker
by itself but should be green before the umbrella -> main merge.

## Per-dimension readiness snapshot (evidence, not verdict)

- A (docs): A3 deploy GREEN (above); A1 BLOCKED by the `: unknown` regression; A2 READMEs 26/26
  per #56 IMPL-EVAL -- re-confirm under evaluator.
- B1 (publish:dry-run, 0 slow types / 25 units): NOT re-run this pass -- evaluator to run on tip.
  Note the `: unknown` stamp likely keeps slow-types green, masking the JSX break.
- C/D/E/F: sub-runs #54/#55/#57/#58/#56 merged with IMPL-EVAL PASS -- evaluator to re-confirm the
  D1/D2 scanners + D3 audit are wired into quality + arch:check on the umbrella tip.

## Recommended sequence

1. WSL Codex fix slice on `packages/fresh-ui/src` interactive runtime types (+ fmt) -> check-test
   GREEN, A1 still GREEN. Commit/push/PR-comment.
2. OpenHands scorecard-eval (separate session, qwen 3.7 max) -> owns the PASS verdict.
3. On scorecard PASS + explicit user dispatch: publish E (25 non-CLI, OIDC, 0.0.1-alpha.0) then
   F (`@netscript/cli` last, LD-7). cli-e2e never published.
