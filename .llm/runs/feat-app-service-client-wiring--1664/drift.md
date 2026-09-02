# Drift Log: PR 1664 convergence

## 2026-09-02 — non-generated Fresh package-config conflict

- Severity: significant for evaluated-head carry; no scope expansion.
- Expected: convergence conflicts concentrated in generated carriers.
- Observed: `packages/fresh/deno.json` also conflicted because the evaluated branch registers the
  query-hydration browser fixture while current `main` adds the `./navigation` subpath and its
  check/doc-lint surfaces and updates dependency pins.
- Resolution: retained both independently authored changes. No behavioral implementation was
  added or altered by this convergence slice.
- Consequence: six branch-touched non-generated package files differ from evaluated head
  `377811da8` due to intervening `main` commits. The prior IMPL-EVAL PASS cannot be claimed as a
  byte-identical carry; the converged head needs fresh evaluation.

## 2026-09-02 — inherited run-artifact whitespace

- Severity: informational; attributable to `main`.
- `git diff --cached --check` over the complete merge reports trailing/new-EOF whitespace in
  unrelated `.llm/runs/**` artifacts introduced by `main`.
- The convergence slice does not rewrite those historical artifacts. A scoped diff check over the
  two conflict resolutions and this run's three updated artifacts is the applicable hygiene check.

## 2026-09-02 — CLI wrapper coverage refusal inherited from main

- Severity: gate-attribution note; no scope expansion.
- The exact requested CLI lint/fmt wrapper commands exit 2 because root `deno.json` excludes
  `packages/cli/`; they report zero findings but drop 733 of 930 selected files.
- A clean detached checkout of `origin/main` reproduces the same refusal (723 of 915 files dropped),
  proving it is not introduced by this branch. The result is reported as red rather than weakened
  or relabeled as a pass.

## 2026-09-02 — Cliffy help wrapping can split inside words

- Severity: test-portability trap; no product-surface or architecture change.
- Expected: collapsing whitespace in rendered help would make complete-description assertions
  independent of terminal width.
- Observed: Cliffy 1.2.1 obtains width from `Deno.consoleSize()`, not `COLUMNS`. At an explicit
  width of 40 its table shrinker splits tokens (`Selec t`, `gener ated`, `servi ce`, `clien t`), so
  ordinary whitespace normalization cannot reconstruct the original words.
- Resolution: help contract tests render at a deterministic width of 80 with colors disabled, then
  normalize whitespace on both actual and expected complete strings. Width 80 still exercises
  multi-line wrapping without the lossy sub-word behavior.
- General lesson: tests calling Cliffy's `getHelp()` without explicit render options inherit the
  runner's console width. Complete-line assertions should use a deliberate test width and one
  two-sided whitespace-normalization seam.

## 2026-09-02 — documented RTK binary unavailable

- Severity: informational tooling drift; no product impact.
- The selected `rtk` skill documents a machine-level binary, but `rtk` was not present on PATH in
  this WSL environment. Ground-truth Git reads used raw Git as permitted by `netscript-tools`.

## 2026-09-02 — serial gate failure masked a cold fixture budget

- Severity: test-evidence trap; no product-surface or architecture change.
- At `7f076f875`, the repo-wide test step stopped on the CLI help assertion before the managed Fresh
  browser step could run. Once that assertion was corrected at `573d01d35`, CI exposed the
  branch-added query-hydration fixture's approximately five-second startup budget for the first
  time.
- The hosted timeout path proves the Vite child was still alive throughout the old budget. The
  waiter now uses a bounded 60-second wall-clock deadline and emits Vite stdout/stderr on failure.
- General lesson: a serial gate that stops on its first failure provides no evidence for later
  phases. Treat everything behind the stop as unmeasured, not implicitly green, and give process
  startup failures enough captured output to distinguish slowness from a crash on the next run.

## 2026-09-02 — URL-only timeout hid the module-resolution cause

- Severity: test-diagnostics trap; no product-source or architecture change.
- The query fixture appeared to be merely slow across three CI cycles because its timeout reported
  only the URL. Once the bounded waiter preserved Vite stderr, the next run named the real failure:
  Vite could not resolve bare `@opentelemetry/api` reached through the Fresh query/telemetry graph.
- The exact sibling fixture precedent maps this bare import through the workspace catalog. Applying
  that one virtual-module mapping produced HTTP 200 with empty Vite stderr and no need for a
  speculative `zod` bridge.
- General lesson: readiness timeouts must carry bounded child stdout/stderr. A URL and elapsed time
  cannot distinguish cold startup, module resolution, process configuration, or a silent crash—the
  information needed to repair the failure is otherwise discarded at the failure boundary.

## 2026-09-02 — Fresh 2 island boundaries are comment markers

- Severity: browser-evidence contract correction; no product-source change.
- Exact-head CI observed `queryClientFound=true`, `islandHydrated=true`, and
  `islandInteractive=true` in both modes, but the initial `freshIslandElement` probe returned null
  because it searched for a `<fresh-island>` ancestor.
- The fixture's measured HTML uses Fresh 2's actual boundary representation:
  `<!--frsh:island:app:0:-->...<!--/frsh:island-->`. The proof now asserts that exact opening
  boundary immediately before the island root, instead of assuming a custom-element wrapper.
- General lesson: hydration diagnostics must follow the framework version's emitted DOM contract.
  A missing legacy wrapper is not evidence of failed hydration when the client effect, context,
  and interaction all execute inside a valid Fresh boundary.
