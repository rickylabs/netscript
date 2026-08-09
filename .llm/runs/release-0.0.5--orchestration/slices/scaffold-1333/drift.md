# Drift: #1333

No implementation drift. Planning finding: issue row 10 is observational and cannot be truthfully
closed by repository implementation evidence; #1090 already owns the controlled adoption study.
This is a must-resolve scope/closure decision for the milestone owner before implementation.

## 2026-08-09 — observational row relocated

The owner moved row 10 to #1090 and approved rows 1-9 for implementation. This resolves the
planning finding without weakening or deleting the observational criterion.

## 2026-08-09 — bounded derivation at the validation limit

The locked `<project>-web` rule would exceed the existing 64-character name contract for a maximum
length project. S1 keeps the suffix and trims only the project prefix to fit; ordinary names and the
no-duplicate-suffix rule are unchanged. A unit test fixes the boundary. This is a validation-edge
refinement, not a scope or naming-policy change.

## 2026-08-09 — one template, two intentional destinations

Research during S2 found `service add --with-client` also consumed the old manifest key while
writing the #1373-approved `apps/<app>/lib/<service>.ts` path. S2 moves init's canonical example to
resource-local `(_lib)` but keeps service-add's public destination and points it at the same query
template. Duplicating the template or changing the already-accepted service-add topology would be
unrelated drift.

## 2026-08-09 — route schema makes zod an app-owned direct dependency

The planned resource-local route contract imports `zod`, but the generated Fresh app manifest did
not own that dependency even though the workspace root catalog did. A fresh generated-consumer
check failed with TS2307. S3 adds `zod: "catalog:"` to the app import map and locks that ownership
in the app-manifest test. This is required by the planned typed route/form contract and preserves
central catalog control; it is not a dependency-version fork.

## 2026-08-09 — runtime identity followed the S1 naming rule

S5 found that the runtime suite still waited for and probed a hard-coded Aspire resource named
`dashboard`. After S1, the runtime scaffold intentionally omits `--app-name`, so its app resource is
derived from the project name and the old gates would target a resource that no longer exists.
S5 shares `deriveDefaultAppName` with the wait, home, UI, and browser gates and adds project-derived
command tests. This is required integration of the approved S1 rule, not a second naming decision.
The full CLI test sweep in S6 found one additional stale presentation expectation for JSON init
next steps (`apps/dashboard`); the emitted `apps/json-smoke-web` value was correct, so S6 updates
the exact assertion and retains the full-string check.

## 2026-08-09 — generated lint made the quality contract executable

IMPL-EVAL corrected the development diagnosis: on pinned Deno 2.9.5, `no-explicit-any` is already a
recommended rule and `deno lint --no-config` rejects an explicit `any`. The generated runner's
explicit `--rules-include=no-explicit-any` flag was therefore decorative, and the recorded claim
that the default mutation exited 0 does not reproduce. The flag and its source-self-grep assertion
were removed; the behavioral explicit-`any` test remains and exits 1 naming `no-explicit-any` under
the same default lint invocation consumers run. The five template lint corrections remain valid,
but they are ordinary fixes exposed during the generated-quality work, not evidence that the flag
activated a previously disabled rule. No lint allowance or exclusion was added.

## 2026-08-09 — runtime gate file remains over the doctrine size cap

`packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` grew from 865 to 906 lines while
adding the project-derived wait and browser reference gates, against the A8/AP-1/F-1 500-line cap.
The scaffold gate directory grew from 41 to 43 direct children against F-16. Splitting the
established registry is not a safe mechanical change inside the final scaffold feature slice, so
the debt is now registered as `scaffold-runtime-a8-f16-1333` in
`.llm/harness/debt/arch-debt.md`, with an owner, target, linked plan, and close gate.

## 2026-08-09 — IMPL-EVAL made rollback proof behavioral

The S3 mutation table changed strings that structural goldens asserted; it did not prove the saved
snapshot behavior. The generated DB and memory islands now share a resource-local callback factory,
and the focused test executes `onMutate`/`onError` against a stub query client. It asserts identity
of the pre-mutation snapshot, the optimistic value, and exact restoration. Moving the cache read
after the optimistic write leaves the former string assertions intact but makes this test exit 1;
restoring the order returns it to green. This is a proof repair within the planned S3 behavior, not
a relaxation or a new UX decision.

## 2026-08-09 — dead dashboard fallback removed

IMPL-EVAL found `SCAFFOLD_DEFAULTS.APP_NAME = 'dashboard'` remained reachable through the optional
`generateAppsettings` API even though the production init path always passed S1's derived name.
The constant is removed, and the generator's own fallback now calls `deriveDefaultAppName(name)`.
The explicit `appName` option remains authoritative. This closes the latent re-consumption boundary
instead of documenting a wrong-but-plausible legacy default.

## 2026-08-09 — cycle-2 emitted-import integration repair

The behavioral rollback factory was emitted beside `service-query.ts`, but both island templates
initially imported it through an extra `service/` segment copied from the template-tree layout.
That path cannot exist in the emitted resource tree and made every generated app fail its first
type-check. Both imports now use the adjacent resource-local form
`../(_lib)/optimistic-list-mutation.ts`. The public-init golden now walks every emitted TypeScript
file under `routes/examples`, resolves each relative import against the full app tree, and fails with
source/specifier/target evidence when a target is missing. Reintroducing the bad memory-island
specifier and regenerating the barrel produced raw exit 1 naming the nonexistent target; restoring
it produced raw exit 0. This is an integration correction to the approved F6 proof, not a second
rollback design.

The prior green runtime receipt is ledger row 73 under grant row 72 and was earned at `2052551d7`.
It predates the F6 product changes and cannot evidence the repaired head. PR closure/runtime claims
are narrowed pending a new owner-granted one-pass receipt; no runtime command ran in this repair.

## 2026-08-09 — ledger row 74 restores current-head runtime evidence

The single authorized run at repaired product head `08e56bfad` completed 80 passed / 0 failed / 2
expected #1398 skips / 82 total with raw exit 0. `generated.deno-check` passed, directly adjudicating
the broken-import class, and `behavior.app-reference` passed at both browser viewports. None of the
cycle-2 evaluator's three published-package-source diagnostics reproduced under local-source: the
generated check emitted no QueryClientPort TS2345, `withForm` TS2345, or route TS18046. Pre/post leak
checks found no run-owned resources and left the same foreign Redis container untouched; manifest
and lock diffs were empty. Closure evidence now links ledger row 74, while the older green run is
retained only as historical row 73 under grant row 72.

## 2026-08-09 — serialized runtime stopped at stale project-boundary app identity

The single ledger-row-70 runtime execution at `2150421e4` exited 1 with 16 passed / 1 failed / 2
skipped / 19 total steps. `behavior.project-boundary-dev` still defaults its optional app argument
to `dashboard`, and the gate registry supplies only the project root. After S1, the runtime project
`prod-local-test` correctly contains `apps/prod-local-test-web`, so the probe failed while
canonicalizing the nonexistent `apps/dashboard` cwd. Its child then produced a secondary
already-terminated-process error during cleanup.

Fail-fast prevented `behavior.app-reference` from running, so the browser/Windows-Chrome interop
path has no verdict. The authorized run was not retried. Pre/post leak checks found no run-owned
resources and left one stale foreign Redis container untouched; manifest and lock diffs remained
empty. This blocks runtime row 9 and therefore blocks `Closes #1333` at this head.

## 2026-08-09 — stale identity was a three-consumer class

The owner identified the fail-fast-hidden MCP endpoint-directory consumer after gate 70. The
required sweep then found a third consumer: the clean-clone README probe scaffolded an omitted-name
project but asserted generated artifacts under `apps/dashboard`. All three now consume the S1
derivation rule, with required probe arguments where a caller owns the context. A new source-policy
test makes both forbidden forms executable and excludes the unrelated Aspire-dashboard telemetry
surface. This is an authorized completion of the gate-70 finding, not a change to S1's naming rule.

## 2026-08-09 — row 72 closes the runtime evidence gap

After the identity repair, the one authorized ledger-row-72 execution at `2052551d7` completed all
82 steps with 80 passed, 0 failed, and the two expected #1398 deferrals. Both formerly stale probes
passed, and `behavior.app-reference` rendered the nine canonical expectations at desktop and mobile
through Windows Chrome over WSL interop. Pre/post leak checks found no run-owned resources, the
foreign Redis container remained untouched, and manifest/lock diffs were empty. This supersedes the
gate-70 closure blocker without erasing that honest red receipt.
