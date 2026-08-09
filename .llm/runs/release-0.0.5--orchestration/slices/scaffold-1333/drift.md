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

The planned deliberate-`any` negative proved that the generated `lint` task used Deno's default
recommended rules, which do not include `no-explicit-any`; the mutation exited 0. The generated
quality runner now opts into `no-explicit-any`, and the same mutation exits 1 naming that rule.
Turning on the real gate surfaced five clean-scaffold lint findings: one S3 `require-await` and four
existing memory-router findings (`require-await`, `prefer-const`, and an unused transition table).
They were corrected in their owned templates so a fresh no-Aspire consumer now checks and lints 108
selected files at exit 0. No lint allowance or exclusion was added.

## 2026-08-09 — runtime gate file remains over the doctrine size cap

`packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` grew from 865 lines at the S4
head to 905 lines while adding the project-derived wait and browser reference gates. It was already
over the A8 500-line cap, and the package doctrine aggregate remains 50 FAIL / 51 WARN / 1 INFO.
Splitting the established runtime gate registry is architecture debt, not a safe mechanical change
inside the final scaffold feature slice; no finding was hidden or allowed.

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
