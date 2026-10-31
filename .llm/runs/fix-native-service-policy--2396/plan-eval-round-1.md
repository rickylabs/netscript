# PLAN-EVAL for issue 2396 adoption (blockers only, read-only)

The plan fails on four blocking defects, all cheap to fix in the plan. The research holds up: every fact I checked matches the tree.

## Facts I checked against the tree (they hold)
- [x] **Baseline:** `origin/main` is `6a71cd0599673d70cd6311de3bb20b2d6a9dde2c`. HEAD is `origin/fix/native-host-policy` plus one S0 docs commit, with no product edits yet.
- [x] **Merge bases:** 2422 is at `11e99987`; 2423 and 2421 are at `1582e1c9` (18 commits behind main).
- [x] **Footprints:** the non-run footprints match `research.md` exactly: 26/2025/120, 15/981/107 and 21/3614/48.
- [x] **Native types:** `ServiceAuthPolicy`, `assertServiceAuthPolicy`, `CorsOptions`, `ServeOptions`, `RunningService` and the internal-credential exports all exist on main. The plan reuses them rather than copying them.
- [x] **Decision 5:** 2423 behaves as described. Omitted headers fall back to `getStreamsAuth()`, and any supplied record, including `{}`, replaces it.
- [x] **Decision 4:** 2421's workers legacy entrypoint already delegates to `startWorkersService`. The streams legacy `services/src/main.ts` is untouched and still duplicates the factory, so the delegation is new work.
- [x] **Plan-gate boxes:** the plan locks its decisions, has a risk register, lists deferred scope (#829, #2364), includes a JSR planned-surface scan, and has 5 ordered slices.
- [ ] **Not verified:** I couldn't read the issue text live because the read-only `gh` call was denied. I relied on the acceptance mapping in `research.md`.

## Blocking defects
1. **The required runtime gate can never be triggered.**
   - **Why it's needed:** Archetype 5 requires runtime/Aspire validation. S3 changes both official plugin legacy service entrypoints, which are the paths `scaffold.runtime` starts and health-checks.
   - **Why the plan's route doesn't work:** the plan's only route is "CI e2e-cli for each final head". On pull requests, `.github/workflows/e2e-cli.yml` only runs the scaffold jobs when one of the labels `e2e-cli-gate`, `desktop-native-gate` or `ci:full` is present, and the owner forbids labels. It also schedules nothing on draft PRs, and 2421 is a draft.
   - **Second gap:** `release-gates.md` also requires `e2e-cli-prod` handling when the plugin publish shape changes, and the new `./service` exports in both plugins' `deno.json` do that. The plan doesn't mention it.
   - **Fix:**
     - Name the trigger for each exact head, for example a coordinator `workflow_dispatch` of e2e-cli on the branch. If no trigger is allowed, record an owner decision that runtime acceptance stays unproven.
     - Record `e2e-cli-prod` as post-publish `DEBT_ACCEPTED`.
2. **Locked decision 1 doesn't say how main gets merged, and a command-line push may be refused.**
   - **Problem:** since both merge bases, main has changed `.github/workflows/fresh-ui-quality.yml` and `pages.yml`. The repo's own e2e-cli header says a command-line push of a merge that touches workflow files is refused unless the credential has `workflow` scope.
   - **Fix:** lock the mechanism. Either do a server-side Update-branch/merge through the API and then fetch, or prove the credential has that scope. Add this to the risk register.
3. **One acceptance gap has no owner.**
   - **Gap:** `research.md` entry 1 lists "characterize saga/trigger entrypoints" as missing.
   - **Problem:** no slice covers it, those paths are outside the supervisor's allowed writes, and the deferred-scope list doesn't mention it.
   - **Fix:** either assign it to a slice with exact paths and a recorded scope expansion, or explicitly defer it with a reason.
4. **S3 doesn't name all its files and writes outside the approved scope without recording it.**
   - **Problem:** the streams `services/src/main.ts`, the "host-policy integration tests/guide" and the "documented host startup recipe" aren't in 2421's file list. No path is named for the guide.
   - **Rule broken:** the supervisor requires scope expansions to be recorded before writing, and `drift.md` records none.
   - **Fix:** name the exact paths, including any docs-site page and the generated files it forces, and record the expansion in `drift.md`.

Owner constraints the plan already respects: it reuses the existing PRs and branches, keeps historical evidence, uses Refs-only bodies, applies no labels or milestones, skips local `scaffold.runtime`, and keeps all three PRs under one owner.

VERDICT: FAIL_PLAN
