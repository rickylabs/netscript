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

### Follow-up measurement

- CI run `33633076918` showed that Fresh also removes its server boundary comments during boot, so
  the exact comment is not a post-hydration DOM invariant either.
- The stable fixture contract now marks the island component's root with `data-fresh-island`, which
  is the alternate form already understood by the #1845 diagnostic selector. The element-presence
  check therefore identifies the actual `main` island root, while the separate effect and click
  checks prove that it is no longer merely SSR markup.

## 2026-09-02 — branch-only probe prevents historical main attribution

- Severity: evidence-boundary clarification; no product impact.
- The generated service-client browser probe was introduced on this branch, so otherwise-green
  clean-main scaffold-runtime logs do not contain the same hydration/refetch measurement. Static
  byte identity can exclude changed source seams, but cannot be promoted into an unobserved browser
  result.
- The focused hydration fixture also carries an explicit `data-fresh-island` evidence marker that
  the generated island does not. That marker makes the fixture assertion stable after Fresh removes
  its SSR boundary comments, but it is instrumentation rather than a framework-provided wrapper.
- General lesson: comparative attribution needs the same probe at both heads. When the probe is
  branch-only, name the exact clean-baseline experiment instead of inferring a runtime result from
  a passing older suite that never executed the check.

## 2026-09-02 — convergence introduced a new README quality ratchet

- Severity: gate-set drift; branch-owned documentation defect exposed.
- The branch was green before main added `docs:readme-fences` to `quality`. After convergence, that
  current gate compiled a branch-authored fence for the first time and rejected its seven unbound
  contextual references.
- General lesson: a converged head must run the gate set that exists at the converged revision, not
  only the gates that existed when the branch content was authored or previously evaluated.

## 2026-09-02 — truncated touch-set caused incorrect fence attribution

- Severity: evidence-attribution correction; no scope expansion after owner authorization.
- The supervisor initially attributed the added checked fence to `packages/cli/README.md` and
  classified `packages/fresh/README.md` as main-owned. Ref-level extraction and `git blame` showed
  the inverse: CLI's one checked fence is unchanged, while branch commit `1df8a5274` added Fresh's
  sixth checked fence and all seven new errors.
- The lane stopped rather than editing a prohibited file or forcing an ineffective CLI change; the
  owner then authorized the measured Fresh README scope.
- General lesson: on a branch with more than 160 changed files, a truncated touch-set display is not
  an ownership proof. Use untruncated path queries plus per-ref fence extraction before assigning a
  ratchet delta.

## 2026-09-02 — clean-read-set generator guard during a merge

- Severity: convergence mechanics; no scope or product-contract change.
- `gen:mcp-export-corpus` initially refused to run because an unresolved merge necessarily presents
  S9's package changes as a dirty staged read set. After the three source conflicts were resolved,
  the generator was rerun with its explicit `--allow-dirty` override; the non-writing
  `check:mcp-export-corpus` mode then passed against the combined tree.
- `check:assets-barrel` also performed the required downstream regeneration: its first diff named
  only `embedded.generated.ts`, and it passed after that generated combined-head carrier was staged.
- General lesson: merge convergence can require an explicitly recorded dirty-read override for a
  generator, but the final clean/check mode remains the verdict and must pass before delivery.

## 2026-09-03 — pre-refresh row made the optimistic assertion self-inconsistent

- Severity: browser-probe correctness; no product-template change.
- The service-refetch probe read the row name before deliberately refreshing the list, then derived
  its expected optimistic rename from that stale value. Running #1885's hydration interaction first
  made the divergence deterministic: SSR showed the app server cache's prior value while Refresh
  loaded the newly persisted value, so the correct optimistic row had one more `*` than the probe
  expected.
- Resolution: retain the initial row-presence gate, but derive the mutation expectation from a
  second row read after the completed, stable Refresh baseline. The response-paused optimistic and
  exactly-one-refetch assertions remain unchanged.
- General lesson: a probe that mutates its own baseline must derive later expectations after that
  mutation, especially when earlier gates intentionally modify the same persisted fixture.

## 2026-09-03 — QueryClient introspection was not hydration evidence

- Severity: browser-evidence contract correction; no Fresh runtime change.
- The generated island produced a paused update request and updated its DOM, while the bounded
  Preact-object crawl still returned no QueryClient. The old diagnostic therefore emitted the
  contradictory pair `islandInteractive=true` and `islandHydrated=false`.
- Resolution: hydration/interactivity follow the #1885 observable interaction contract and the
  concrete `ul[data-state]` surface; QueryClient discovery remains supplemental cache diagnostics.

## 2026-09-03 — response interception required an explicit release

- Severity: CDP transport correctness; no product behavior change.
- In cached Chrome 151, `Fetch.continueResponse` alone acknowledged the command but left the held
  cross-origin mutation pending. Both the branch probe and a direct CDP reproduction observed no
  settled invalidation until interception was disabled.
- Resolution: after continuing the single held response, call `Fetch.disable`; the unchanged gate
  then measures mutation success and exactly one completed list refetch.

## 2026-09-03 — sqlite maintainer DB commands started Aspire unexpectedly

- Severity: constraint violation / tooling surprise.
- The generated project's `netscript-dev db init/generate/seed` path announced and launched an
  isolated project AppHost even though the intended operation was local sqlite codegen. The lane
  stopped invoking that wrapper, terminated the exact run-owned Aspire/DCP process tree, and
  verified it was gone before continuing with standalone Vite and Deno service processes.
- General lesson: a database CLI wrapper may use Aspire as its command transport even for sqlite;
  no-Aspire investigations must invoke the underlying generated database tasks directly.

## 2026-09-03 — preview query did not explain the hosted missing DOM

- Severity: rejected environment hypothesis; hosted discriminator improved.
- Static route semantics and byte/count measurements from the exact-branch generated app showed
  that `/examples/users` and `/examples/users?preview=success` both return HTTP 200 with the same
  Fresh island boundary, Rename control, and success-state list. The preview query only adds
  serialized preview state in the standalone Vite path.
- The refetch probe nevertheless moved to the canonical no-query path so it consumes the same
  document the immediately preceding served-surface and hydration gates certify. A future hosted
  failure will now distinguish absent/incorrect server markup, hydration failure, and a refetch-only
  failure instead of short-circuiting before the independent evidence runs.
- General lesson: when a composite suite short-circuits, order discriminating prerequisites before
  the narrow behavior gate, and retain HTTP/DOM/browser-network evidence at the failure boundary.
