# #1781/#1357 scaffold.runtime lease request — prepared, NOT executed

Prepared while Aspire owns the singleton host lease. Nothing started here — no Aspire, no Docker.

## Exact head

Carrier `da5084381` on `fix/ui-add-data-screen-triad`. Product head `7bc715b68`, IMPL-EVAL `PASS_IMPL`
`2991113a6`, carries forward as MECHANICAL_PASS through three consecutive zero-intersection
convergences (`73bf2efa9` → `96d44758d` → `5197e70b7`) — patch-identity proven on all 12 ceiling
paths at every hop.

## Command — one pass, do not split

```bash
deno task e2e:cli run scaffold.runtime --cleanup --format pretty \
  --report .llm/runs/fix-ui-add-data-screen-triad--0.0.7/receipts/scaffold-runtime-da5084381.json
```

## Gate identity

- New gate id **`scaffold.ui-data-screen`** (`GATE.SCAFFOLD_UI_DATA_SCREEN`,
  `packages/cli/e2e/src/domain/cli-surface.ts:78`), selected into `RUNTIME_GATES` at
  `capability-suites.ts:54`, verified selected (not merely defined) by both Tier-A and IMPL-EVAL.
- This scaffolds a page via `ui:add page --island`, then type-checks the generated app containing it —
  the acceptance target behind DoD box 11.

## Known host risk

`behavior.app-reference` (browser/Chromium probe, unrelated to this leaf) is a critical gate earlier
in `RUNTIME_GATES` than several others; Chromium is confirmed absent on this host and identically on
main. If it fails, the run aborts before reaching later gates via `suite-runner.ts:98`'s
break-on-critical-failure — this was independently discovered and confirmed twice this session (on
#1764 and #1739). If it recurs here, classify it the same way: not leaf-caused, not a regression, and
not evidence against `scaffold.ui-data-screen` specifically. A targeted/bounded rerun (as used for
#1764's Flow-B and #1739's package-backed-doctor) may be prepared if the full suite aborts before
reaching `scaffold.ui-data-screen`.

## Evidence contract — what a PASS must show

1. Raw exit code.
2. `scaffold.ui-data-screen` selected and executed, named in the output — not skipped.
3. The generated app's `ui:add page --island` output type-checks cleanly (`deno check` on the
   generated project).
4. Confirmation the emitted island/loader match this leaf's contract (no `useSignal` counter, no
   empty `queryLoaders`) in the generated project, not just in unit tests.
5. Failing gate names with raw assertion text if any.
6. Lock hygiene: `deno.lock` unchanged; no source churn committed.

## On completion

PASS → DoD box 11 closes; run the acceptance mirror for issue #1357's box 11 (boxes 1–10 already
evidenced in the PR body); set `status:ready-merge`; rerun CI/close-gate at exact carrier.
FAIL → classify leaf-caused vs the known Chromium/host-topology risk above; report exact blocker,
do not waive.
