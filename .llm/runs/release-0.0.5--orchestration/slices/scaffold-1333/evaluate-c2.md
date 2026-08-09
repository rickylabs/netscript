# IMPL-EVAL cycle 2: PR #1427 — #1333 default-app reference quality

**Verdict: FAIL_FIX**

Evaluator session: separate from the generator; read-only against `/home/codex/repos/ns005-w3b1`.
All mutating verification ran in a disposable clone of the head at `/tmp/eval-1427-c2` and a
scratch scaffold at `/tmp/eval-scaffold` (both removed after evaluation); the writer worktree was
never modified. All commands below were executed by this session unless marked otherwise.

## Head and delta verification

- `git rev-parse HEAD` in the review worktree = `c0b25a2e1d0c79e41a2aaa5cce6cf63c023b9152`;
  `gh pr view 1427 --json headRefOid` = same; branch `feat/default-app-reference-quality`, OPEN.
  No divergence — evaluation proceeded.
- **The brief's delta claim is false.** `git diff --stat 2052551d7..c0b25a2e1` shows 24 files, of
  which 18 are product source: both `ServiceShowcaseLab` island templates, the new
  `(_lib)/optimistic-list-mutation.ts.template`, `embedded.generated.ts`, `manifest.ts`,
  `scaffold-template-assets.ts`, `write-example-service-app-files.ts`, `scaffold-defaults.ts`,
  `generate-appsettings.ts`, `quality-runner.ts`, `probe-app-reference.ts`, `packages/cli/e2e/README.md`,
  and five test files — all in remediation commit `fe04e8349`. Only `c0b25a2e1` is
  `.llm/runs/`-only. Consequence: the row-73 green `scaffold.runtime` receipt (head `2052551d7`)
  does **not** cover the head under review, and (per C2-F1 below) the suite would in fact fail at
  this head.

## Blocking findings

### C2-F1 — every generated app fails its own type-check: the islands import a nonexistent path

The cycle-1 F6 remediation introduced a new defect. Both island templates import the shared
rollback factory as:

- `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template:26`
  — `from '../service/(_lib)/optimistic-list-mutation.ts'`
- `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.memory.tsx.template:26`
  — same specifier

but the writer emits both the island and the factory under the **service-named** directory:
`write-example-service-app-files.ts:74` writes the factory to
`join(input.serviceExampleLibDir, 'optimistic-list-mutation.ts')` =
`routes/examples/<serviceName>/(_lib)/`, and the island lands in
`routes/examples/<serviceName>/(_islands)/`. From there, `../service/(_lib)/` resolves to
`routes/examples/<serviceName>/service/(_lib)/`, which is never emitted. The import was written
against the template-tree layout instead of the emitted layout; the **adjacent import in the same
file** shows the correct form (`from '../(_lib)/service-query.ts'`). No service name makes the
specifier resolve — even a service literally named `service` would resolve to
`service/service/(_lib)/`.

Executed proof at the reviewed head:

- `deno run -A packages/cli/bin/netscript.ts init eval-probe --path /tmp/eval-scaffold --db none
  --service --service-name users --ci --yes --no-git --force` → exit 0; app emitted as
  `apps/eval-probe-web` with the factory at `routes/examples/users/(_lib)/optimistic-list-mutation.ts`
  and the island importing `'../service/(_lib)/optimistic-list-mutation.ts'` at
  `routes/examples/users/(_islands)/ServiceShowcaseLab.tsx:22`.
- The generated project's own `deno task check` → **raw exit 1**: `TS2307 Cannot find module
  '.../routes/examples/users/service/(_lib)/optimistic-list-mutation.ts'` plus five cascading
  `TS7006` implicit-`any` errors in the factory callbacks.

Why no committed gate caught it: `route-templates_test.ts` renders each template in isolation and
imports the factory template directly via a `data:` URL, so the island's relative specifier is
never resolved; the island assertions check `createOptimisticListMutationCallbacks<ServiceListData`
presence, not resolution; the public-init golden asserts emitted paths exist, not that imports
resolve; the scoped check/lint/fmt batches cover CLI source, not generated output. The only gate
that resolves generated-app imports is `scaffold.runtime`'s generated type-check — which last ran
at `2150421e4`/`2052551d7`, before this import existed.

Concrete failure: every project scaffolded from this head fails its first `deno task check`;
`scaffold.runtime` at this head goes red at the generated-check gate; #1333's headline intent — a
default scaffold a real developer would keep — is violated at first contact.

Required fix: change both templates' line 26 to `'../(_lib)/optimistic-list-mutation.ts'`,
regenerate the barrel (`check:assets-barrel`), add a guard in the class that failed — resolve every
relative import in emitted example-app files against the emitted tree (the public-init golden
already walks a real scaffold and is the natural home) — and obtain a fresh serialized
`scaffold.runtime` receipt at the repaired head under a new ledger grant.

### C2-F2 — the PR's runtime-gate evidence claims exceed its coverage

The PR body Validation row "Serialized `scaffold.runtime` row 72 — raw exit 0; passed=80 …" and the
DoD row-9 evidence entry ("Token-granted 82-step runtime … receipt",
issuecomment-5233305155) present the receipt as evidence for the reviewed head, but it was earned
at `2052551d7`, and `fe04e8349` subsequently changed the very templates that suite type-checks and
boots. Given C2-F1 this is not merely stale bookkeeping — the cited gate would fail at the head the
evidence is attached to. Required fix: after repairing C2-F1, re-run the serialized gate and cite
the new receipt; do not carry a pre-remediation receipt as head evidence. Minor note: the PR labels
the run "row 72" while the ledger records the green run as row 73 under grant row 72 — align the
citation.

## Cycle-1 findings F1–F8: remediation verification

- **F1 (PR close-gate) — remediated.** PR body now carries the implementation template with nine
  checked DoD rows and a fenced `acceptance-evidence` block whose nine `box:` values match issue
  #1333's nine checkbox first lines byte-for-byte (compared against `gh issue view 1333`).
  Executed `check-close-gate.ts --repo rickylabs/netscript --pr 1427`: `prFindings: []` (the PR-side
  evidence structure parses and maps 9/9); the remaining red findings are exactly the issue boxes
  the mirror ticks only at `status:ready-merge`, which the worklog's close-gate preflight documents
  as the deliberate sequence. Spot-checked three receipt comments (5232880521, 5233574661,
  5233305155): all exist and match their claimed content, including the SERIALIZED-RUNTIME PASS
  receipt. Caveat: the row-9 evidence link is the receipt C2-F2 shows is superseded.
- **F2 (browser prerequisite docs) — remediated.** `packages/cli/e2e/README.md:48-58` now documents
  the fail-closed browser prerequisite and the Linux/WSL/native-Windows/macOS candidates;
  `probe-app-reference.ts:163-177` adds three macOS `/Applications` and two native-Windows
  candidates. The throw-not-skip behavior is unchanged.
- **F3 (debt registry) — remediated.** `arch-debt.md:2224` `scaffold-runtime-a8-f16-1333` carries
  reason (865→906 lines vs the A8/AP-1/F-1 cap; 41→43 children vs F-16), owner, target, linked
  plan, created date, status, and gate — the same shape as the #1404 precedent entry. Measured at
  head: `wc -l runtime-gates.ts` = 906; `ls … /scaffold | wc -l` = 43. Both match the entry.
- **F4 (doctrine numbers) — remediated.** Executed `check-doctrine.ts --root packages/cli` at the
  reviewed head: `FAIL=50 WARN=50 INFO=1`, matching the corrected worklog/drift/PR-body claim of
  baseline 50/51/1 → head 50/50/1; the false "byte-identical" claim is gone from drift.md.
- **F5 (no-op lint flag) — remediated.** `quality-runner.ts:172` reverts to
  `['lint', '--no-config', ...files]`; the source-self-grep assertion is deleted from
  `quality-runner_test.ts`; the drift entry now states the corrected diagnosis (`no-explicit-any`
  is recommended on Deno 2.9.5 and the prior exit-0 claim does not reproduce) while the behavioral
  explicit-`any` red remains.
- **F6 (rollback proof) — the test itself is remediated; its integration introduced C2-F1.**
  `route-templates_test.ts:546-579` renders the factory template, imports it live via a `data:` URL,
  and drives `onMutate`/`onError` with a stub query client; `assertStrictEquals` pins both the
  captured snapshot and the restored value by reference. Executed the cycle-1 falsifiability
  mutation (optimistic write before snapshot read) in the clone: with only the template edited the
  suite stays green (the test reads the embedded barrel — the guard is two-layer), and after
  `gen:assets-barrel` the named test fails (`AssertionError: Values are not strictly equal`,
  0 passed / 1 failed step); clean head passes 1 test / 26 steps. The barrel layer is held closed by
  `check:assets-barrel`, which CI runs (`.github/workflows/ci.yml:291`) and which exits 0 at the
  committed head. Both islands consume the shared factory and their private `onMutate`/`onError`
  copies are deleted (verified in the `fa2b5413d..fe04e8349` diff). The defect is solely the import
  path (C2-F1).
- **F7 (dashboard fallback) — remediated.** `SCAFFOLD_DEFAULTS.APP_NAME` is deleted;
  `generate-appsettings.ts:274` falls back to `deriveDefaultAppName(name)`;
  `generators_test.ts:248` now expects `my-app-web`. `grep -rn "APP_NAME" src/ e2e/` finds no
  remaining SCAFFOLD_DEFAULTS consumer (the sole hit is an unrelated desktop-e2e local constant).
  The executed scaffold confirms end-to-end derivation: project `eval-probe` produced app
  `eval-probe-web`.
- **F8 (guard gaps) — remediated.** `app-name_test.ts` adds the length-boundary separator-trim test
  (59×`a` + `-trailing-segment` → exactly `${prefix}-web`, which fails if the `-+$` trim is
  deleted); `probe-app-reference_test.ts` pins all nine expectation markers directly. Executed the
  four remediated test files: 15 passed / 29 steps / 0 failed.

## Priority questions — direct answers

1. **Can each new guard fail?** The rollback guard: yes, proven by executed mutation (exit 1 with
   the named test) — with the two-layer caveat that a template edit alone is invisible until barrel
   regeneration, held closed by CI's `check:assets-barrel`. The guard gap this cycle exposes is
   import-resolution: no test resolves the emitted islands' relative imports, which is exactly how
   C2-F1 shipped. That gap is named in C2-F1's required fix.
2. **Browser gate:** F2's documentation and candidate-path fixes hold; registration remains
   unconditional and fail-closed (probe logic unchanged apart from added candidates).
3. **Embedded corpus:** `check:assets-barrel` exit 0 at the committed head — the barrel matches the
   templates, so the template tests are not vacuous; the barrel also faithfully embeds the broken
   import (entries 79/81 both carry `'../service/(_lib)/optimistic-list-mutation.ts'`).
4. **Byte ceilings, recomputed:** app template sources 178,363 / 197,796 (`wc -c` over
   `assets/app`); embedded barrel 296,366 / 330,000; `git diff 35358886a..HEAD -- packages/mcp` is
   empty so cycle 1's measured MCP corpus 253,535 / 262,144 stands. The remediation delta only adds
   content (new template + factory extraction); nothing was dropped to fit.
5. **zod:** no remediation commit touches the catalog, `scaffold-app-catalog.ts`, or the generated
   import — cycle 1's verification (catalog law respected, no cast/allowance) stands.
6. **Doctrine debt:** corrected numbers independently reproduce (F4 above) and the registry entry
   is well-formed (F3 above).
7. **Intent:** currently violated — a developer's first `deno task check` in a fresh scaffold fails
   with nine errors (C2-F1 plus probe-environment noise). With the one-line import fix the answer
   flips: the flow the reference teaches is now genuinely executable and behaviorally proven, and
   the executed scaffold shows the derived identity, resource-local topology, and living design
   links all real.

## Observations explicitly not counted as findings

- Under this probe (default published-package source, no lock, `--db none`), three further errors
  appeared in templates unchanged since row 73's green local-source run (`TS2345` QueryClientPort at
  `(_shared)/service-showcase.ts:91`, `TS2345` on `withForm` and `TS18046` in
  `examples/users/index.tsx`). These are consistent with published-vs-workspace package drift in the
  probe environment, not attributed to this PR; the local-source `scaffold.runtime` re-run required
  by C2-F1 will adjudicate them. If any reproduce under local-source, they are in scope for the fix.
- The probe's Aspire `tsc` failure is the documented un-restored AppHost prerequisite, not a
  defect.
- Serialized-runtime rows 70/73 were relied on as ledger evidence per the brief, not re-run;
  `deno task e2e:cli` was not executed in any form.

## Process evidence

- `agentic:review-threads` PR 1427: PASS, threads=0 unanswered=0 (executed).
- Labels/milestone unchanged from cycle 1 (exactly one `status:` = `impl`, milestone 0.0.5); PR
  remains draft pending owner readiness, matching the close-gate preflight record.
- Not re-verified from cycle 1 (unchanged since): S1–S4 template content findings, canonical-link
  promotion, identity source-policy guard scope, `BEHAVIOR_APP_REFERENCE` state discrimination.

## Verdict rationale

Seven of the eight cycle-1 findings are remediated with executed, reproducible evidence, and the
close-gate mechanics are now sound. What blocks PASS is a single new defect introduced by the F6
integration: a wrong relative import in both island templates that makes **every** generated app
fail its own type-check (executed: TS2307 + 5 cascading errors, raw exit 1) — combined with the
fact that the cited serialized-runtime receipt predates the commit that introduced it, so no
runtime evidence covers the reviewed head. This is the eval-loop's second failure and triggers
escalation; it rests on an executed regression in the product's primary artifact, not preference.
The repair is small and fully specified: fix the two template import lines to
`'../(_lib)/optimistic-list-mutation.ts'`, regenerate the barrel, add an emitted-import-resolution
guard, and earn a fresh serialized `scaffold.runtime` receipt at the repaired head.
