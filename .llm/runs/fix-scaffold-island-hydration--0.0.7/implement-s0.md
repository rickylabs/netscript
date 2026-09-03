use harness

## SKILL

- `netscript-harness` — RED/GREEN slice discipline, worklog/drift artifacts, no self-certification.
- `netscript-doctrine` — wrap upstream/Web/Deno APIs; no public-surface change.
- `netscript-tools` — structured validation wrappers; run gates through the checked-in e2e CLI.
- `deno-fresh` — Fresh island/hydration semantics for the served-surface and browser discriminators.

## Task: implement S0a + S0b (plan v2 + v2.1 amendments) for PR #1885 / issue #1845

Read, in order: `.llm/runs/fix-scaffold-island-hydration--0.0.7/plan.md` § "Rescope v2" **and** § "v2.1 amendments" (binding),
`plan-eval-v2-verdict.md`, `drift.md`, `worklog.md`. Work only in this worktree on branch `fix/scaffold-island-hydration`.
Merge `origin/main` first (merge commit, never rebase) if behind.

### Deliverables

1. **S0a `behavior.island-served-surface`** — new `scaffold.runtime` gate registered through the shared `RUNTIME_GATES`
   list in `capability-suites.ts` so both tiers carry it. On the real generated app: fetch the island page (the
   `ServiceShowcaseLab` example route), assert the Fresh island marker for the scaffold data island is present, every
   island `<script type="module">`/preload `src` resolves `200` with a JS content type, and the resolved bundle text
   contains the island export name. Emit a JSON receipt `{ markers, scripts[], bundleHit }` via the existing gate-receipt
   mechanism (see `listener-unreachable-fixture.ts` / S10 receipts for the pattern).
2. **S0b `behavior.island-hydration`** — headless-Chromium leg reusing whatever `behavior.app-reference` already uses
   (no new workflow install step unless proven necessary — then record the pin in `drift.md`). Navigate, wait for the
   island element, read `islandHydrated` via the same DOM contract #1664's probe reads (`data-*` marker), then perform the
   **Rename** click and assert the rename-specific row change. Emit `{ islandHydrated, freshIslandElement }`.
   **Fail closed** when no browser is available — never skip-to-pass.
3. Colocated focused tests for both gates under `packages/cli/e2e/tests/**` (contract first: write the receipt schema
   and the RED test before the gate body).
4. `worklog.md` entries per slice; `drift.md` for any deviation.

### Ceiling (hard)

Only `packages/cli/e2e/src/application/gates/scaffold/**`, `packages/cli/e2e/tests/**`, suite registration, and run
artifacts. **Do not** touch PR #1664 files (`service-client-browser-probe.ts`, its product files), `deno.lock`,
catalogs, Fresh vendoring, `packages/fresh/src/**`, `packages/cli/src/**`, or `.github/workflows/**`.
No S1v2 disposition, no S3v2 — stop after S0a/S0b are green locally and pushed; the supervisor runs the hosted tier.

### Gates before push

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx`
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`
- Local `deno task e2e:cli gates scaffold.runtime.sqlite` is **not** required here (no runtime lease); the hosted tier is the venue.

Push the branch when local gates are green and report the head SHA and the gate ids you added.
