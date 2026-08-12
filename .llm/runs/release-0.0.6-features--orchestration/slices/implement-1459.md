use harness

# Slice brief — #1459 the deferred refresh coordinator is never hydrated

**Codex · GPT-5.6 Sol · high** (`complex_implementation`). The plan **passed PLAN-EVAL** (run
`31593309658`, verdict PASS in the body). Implement it; do not re-decide it.

| Field | Value |
| --- | --- |
| Issue | #1459 (`priority:p1`) |
| PR | **#1558** — already open as a draft at plan phase; commit onto its branch |
| Worktree | `/home/codex/repos/ns006-1459` |
| Branch | `fix/1459-defer-island-hydration` |
| Base | `origin/main@59e435c5d` |

**Read first, in order:**

1. `slices/plan-1459.md` — read the **whole** file. It has three sections: the original plan, then
   **`# Plan v2`** (the revision after `FAIL_PLAN`), then **`## PLAN-EVAL v2 result`** with
   amendments **B1–B4**. **v2 and B1–B4 are binding**; where the original plan disagrees with v2, v2
   wins.
2. `slices/research-1459.md`.

If they are not on your branch: `git show chore/release-0.0.6-runtime-reopen:<path>`.

## SKILL

- `deno-fresh` — Fresh 2.x islands, partials, client navigation, and the Vite plugin.
- `netscript-doctrine` — `packages/fresh` is framework code.
- `netscript-cli` — the scaffold template surface, if D1 touches it.
- `netscript-tools`, `netscript-pr`, `netscript-harness`.

## The defect — two inseparable halves

1. **`DeferIsland.tsx` is not an island at all.** No island registration exists anywhere. It is a
   *named* export (`DeferIsland.tsx:111`); the scaffold calls `fresh()` with **no options**
   (`packages/cli/src/kernel/assets/app/vite.config.ts.template:41`); `createNetScriptVitePlugin` has
   **zero** island logic. It is reached only through a server-render path, so it never enters the
   client bundle.
2. **`f-client-nav` is false in exactly the failing case.** `DeferIsland.tsx:222` sets
   `f-client-nav={!(isPartialRequest && !hasCachedData)}` — that condition **is** `partial-miss`.
   PLAN-EVAL verified against Fresh core that `client.ts:256` gates form submission on
   `checkClientNavEnabled`, so with it false the `requestSubmit()` produces a **full document
   navigation**, not a `/partials/**` request. It also confirmed the client refresh mechanism is
   form/anchor interception only — **no background poll, no auto-refresh timer**, so nothing else
   rescues a missed region.

Fixing (1) without (2) leaves the reported symptom unfixed.

## LOCKED decisions

- **D1 — register the island via `islandSpecifiers`.** `@fresh/plugin-vite` exposes
  `islandSpecifiers?: string[]`, documented as *"Treat these specifiers as island files. This is used
  to declare islands from remote packages."*
  **B1 (binding):** the scaffold pins **`jsr:@fresh/plugin-vite@^1.1.2`** — verify against **1.1.2**
  (`utils.ts:59-63`; mechanism at `src/mod.ts:234-237`, `fConfig.islandSpecifiers.set(spec, name)`),
  **not** 1.0.8. Copy-mode and a consumer-owned shim are **rejected**.
- **B2 (binding) — the specifier must be created, not just referenced.** `packages/fresh/deno.json`
  has **no** sub-export for the defer island today. You must **(a)** add the sub-export and **(b)**
  name that specifier in `vite.config.ts.template`'s `fresh({ islandSpecifiers: [...] })`. Choose the
  concrete specifier string and say why.
- **D2 — fix `f-client-nav`** so `partial-miss` enables client nav. Semantics are already verified;
  do not re-litigate them.
- **D3 — move the coordinator form *inside* the region's `<Partial>`.** It currently renders as a
  sibling outside it (`DeferPage.tsx:257-275`), so a region swap leaves stale DOM and a page swap
  re-renders an inert form. **Fallback if that breaks the fallback-render contract:** stable `key` +
  remount. `SlotRef` is not pursued. State which landed and why.
- **D4 — do not change `decideDeferClientAction`'s policy logic** (`policy.ts:177-208`). It is correct
  and unit-covered; it is simply never executed. If your fix requires changing it, **stop and report**.
- **D5 — scope.** There is exactly **one** render site (`DeferPage.tsx:263`), and the streaming path
  provably never renders it (`runtime/mod.tsx:178`, `!shouldStream && …`). Out of scope: the dead
  `debug` prop (`DeferIsland.tsx:54`), and the #1457/#1548 surfaces (both already merged).
- **B4 — migration.** `islandSpecifiers` is a `fresh()` option, so this is a **scaffold-template
  change**: already-generated apps do **not** get the fix until regenerated. Carry either a
  template-regeneration commit or a tracked follow-up issue, and **say which in the PR**.

## Required tests

1. **Client-bundle presence — B3 (binding).** Build the client bundle and assert the defer island is
   in it. **You must commit to a fixture location and add it in this PR** — there is no `vite build`
   fixture under `packages/fresh/tests/` today. Either a fixture under `packages/fresh/tests/fixtures/`
   with a `Deno.test` wrapper, or a scaffolded-app fixture under `packages/cli/e2e/`. This attacks the
   exact evidence the issue reports: *"the generated client bundle contains none of `DeferComponent`,
   `decideDeferClientAction`, or `partial-miss`."*
2. **`f-client-nav` across all four** `isPartialRequest` × `hasCachedData` combinations, pinning that
   `partial-miss` **enables** client nav. This is the guard that would have caught defect (2).
3. **Island marker in server output**, reusing the JSX-tree harness
   (`define-page/tests/search-params.test.tsx:90-134`).
4. **Partial-swap behaviour** for whichever D3 technique lands.

Each must fail if its own defect returns. Where a shape matters more than a value, assert the shape —
the #1548 slice in this lane proved that a behaviour-only suite stays green through a silent
regression.

## Gates — hardcoded, not conditional

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/fresh --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/fresh --ext ts,tsx
deno task --cwd packages/fresh test
deno task doc:lint --root packages/fresh --pretty
```

`arch:check` (`deno.json:156`) **does not cover `packages/fresh`** (verified). Run `quality:gate`
**and** an explicit target quality scan over `packages/fresh/src`, and state in the PR that the
package-quality verdict rests on the explicit scan. If you touch the scaffold template, add the
`packages/cli` scoped wrappers and expect `scaffold-static` to exercise it in CI.

Never a bare `deno test <path>` — it omits `--allow-env` and exits 1 on `NotCapable`.

## PR contract — read this carefully

PR **#1558** exists. Its body already carries **`Refs #1459`, deliberately not a closing keyword**,
because the client-bundle *navigation* criterion is split to **#1557**. **Do not change `Refs` to
`Closes`.** If you believe your work fully resolves #1459 including browser-navigation proof, say so
in your report and let the orchestrator decide — do not decide it in the body.

Do **not** emit an `acceptance-evidence` block with an empty entry list; the mirror's parser throws
on it (#1561). If there is nothing to map, omit the block and say why.

Commit per slice, push by explicit refspec, post `[PHASE: IMPL]` with commit hash and **pasted real
gate output**, and move the label from `status:plan-eval` to `status:impl`.

## Reporting contract

Report what changed and where; the concrete specifier you chose and the fixture location you
committed to; the exact test names and what each catches; verbatim gate output; and **anything you
could not do, could not verify, or that surprised you**. If a gate goes red, report the red with its
output — do not work around it silently.

Do **not** flip the PR to ready (that fires the automatic IMPL-EVAL, which is the orchestrator's
trigger) and do **not** merge.
