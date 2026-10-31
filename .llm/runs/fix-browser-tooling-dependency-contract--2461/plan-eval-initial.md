**Verdict: FAIL_PLAN**

The overall approach is right: a standalone npm project chosen with an explicit `--project` flag, never added to the Deno workspace, plus truthful coverage notices on the default reports. But four parts of the plan would either fail existing gates or misreport freshness, and the gate controls and Dependabot settings are not specified concretely enough to implement and test. Each item below is a required change before PASS.

### Blocking

**R1. Two of the wrappers ship to consumers, so changing them also changes a CLI file.** `.llm/tools/deps/outdated.ts` and `.llm/tools/deps/why.ts` are listed in `.llm/tools/consumer-tools.json`. `generate-cli-assets-barrel.ts` copies their text exactly into `packages/cli/src/kernel/assets/agent-tools.generated.ts`, along with a bundle hash. So the plan's claim of "no source/carrier change" is false, and those files are outside the authorized writes. Any edit to them without regenerating will fail the assets-barrel check. Two further problems:
- A consumer bundle cannot import a new `./standalone-projects.ts` unless it is registered under `modules`.
- A consumer's project has no `tools/fresh-ui-browser`, so a repo-specific registry and its exclusion notice make no sense there.

The plan must pick one of these:
- **(a)** Leave both shipped tools byte-identical and route standalone `outdated`/`why` through repo-internal code only.
- **(b)** Make `--project <dir>` a generic npm-project selector that consumers can use too. In that case: put the NetScript registry (used for defaults and notices) in internal code only, register any shared helper as a consumer module, fix the tool's `permissions` metadata (`run`), add the carrier and dogfood regeneration to the authorized writes, and add the assets-barrel, publish-assets, preflight-text-imports and consumer-bundle tests to the gates.

**R2. The Aspire manifest row can't be edited by hand.** `fixtures/aspire-surface-manifest.tsv` is generated from `RULES` in `.llm/tools/validation/aspire-surface-manifest.ts`. The parity checker fails with `manifest:freshness` whenever the committed file differs from a fresh build. The plan needs to:
- Add `aspire-surface-manifest.ts` to the authorized writes.
- Insert an exact-path rule for `.github/workflows/fresh-ui-quality.yml` before the generic `.github/workflows/` rule, the same way `generated-carriers.yml` is handled.
- Keep class `ci:workflow` and a non-`archival` owner, so phase-1 enforcement still applies and nothing becomes an exemption. Suggested rationale: "standalone npm/Playwright browser job; `--no-aspire` scaffold; no Aspire host/DB/service".
- Regenerate the file with the generator, with 0 unmatched paths.
- Regenerate again if any new or edited file mentions "aspire" (for example the README, `standalone-projects.ts` comments, or `dependabot.yml`).

**R3. The npm commands must work from the lock alone, or fail loudly.** Research only proved `npm ls --package-lock-only`. As far as I know, `npm outdated` (and possibly `npm explain`) read the installed `node_modules` tree. Without an install, current versions come back as `MISSING`, which would be reported as freshness data. The plan must name the exact command and flags for each mode, and show each one running from the project directory with no `node_modules`:
- Provenance (`why`): `npm ls <pkg> --all --package-lock-only --json`.
- Freshness (`outdated`): locked versions from the lock inventory compared with the registry, or a nonzero operational error when no installed tree exists. `MISSING` must never be treated as a valid row.
- `audit`: `npm audit --json --audit-level=<mapped>` with dev dependencies included. Do not pass `--omit=dev`; every dependency is a devDependency, so that would give a false "clean". Report the number of packages covered so an empty scan is visible.

**R4. Census must stay read-only.** The `deps:census` task only has `--allow-read`, and editing `deno.json` is not authorized. Census must read `package.json` and `package-lock.json` directly (`packages["node_modules/<name>"].version`) without starting npm. It should also flag any difference between the declared version and the locked version. The new data must be a separate field (for example `standaloneProjects`, plus separate counts), leaving the existing `dependencies` and `counts` keys unchanged.

**R5. Adding a YAML parser would change the lock.** No `@std/yaml` appears in `deno.lock`, and the plan's structural workflow check would need one. Adding a new `jsr:`/`npm:` import to the contract test or helper breaks the no-lock-change rule. Extend the existing bespoke parser in `fresh-ui-quality_test.ts`, or reuse the job-block extraction approach from `ci-shard-workflow.test.ts`, with no new imports. The before/after hash check must cover `deno.lock` too, not just the browser manifest and lock.

### Required specification (needed for implementation and IMPL-EVAL)

**R6. Exit-code table.** Define the code for each mode × outcome:
- report OK = 0
- `--fail-behind` / `--fail-on-find` = 1
- usage error, unknown or missing selector, or unsupported mode (`prod-install --project`) = 2, with nothing executed
- operational error (npm failed to start, non-JSON output, an npm `error` object, missing lock) = a distinct nonzero code

`npm outdated` returning exit 1 with valid rows maps to 0. `npm audit` returning exit 1 with advisories, and no `error` object, maps to "advisories found".

**R7. Argument parsing in `why.ts`.** It currently picks the first argument without `--` as the package name, so `--project tools/fresh-ui-browser` would be read as the package. Require explicit selector parsing and a test for that case. Source search in project mode should cover only the project directory.

**R8. Latest.** `fetchLatestStable` and `basePinnedVersion` in `latest.ts` are private. State that they will be exported or extracted, with no change to how the Deno workspace is resolved. Project mode reports both the declared and locked versions.

**R9. Hermetic tests.** Unit tests must run npm through an injected runner with fixed output, with no network or real npm calls in the root test job. Live npm runs belong in the run's evidence, recording the npm version used. CI's Node 24 ships npm 11.x, while research used 12.1.0.

**R10. Browser-contract controls, enumerated.** The positive case must pass on the current workflow. Each of these changes must fail:
1. The step is removed.
2. The gate ID is changed to one not in the catalog in `.llm/tools/gates/catalog.ts`.
3. The text appears only in a comment or a `name:`.
4. `continue-on-error` is set on the step or the job.
5. The step's `if:` no longer depends on `env.RUN == 'true'`.
6. A shell bypass such as `|| true` or `; exit 0` is added.
7. `--cwd` is not `tools/fresh-ui-browser`.
8. The step is moved before `npm ci`, after the browser-matrix step, or into another job.
9. Its receipt or report path falls outside the uploaded `.llm/tmp/gate-receipts/fresh-ui-browser/`.

Every existing assertion in `fresh-ui-quality_test.ts` must stay. If a separate helper file is added, add it to both trigger-path arms of the workflow and to the classifier paths.

**R11. Dependabot setup.**
- Weekly npm schedule, `directory: "/tools/fresh-ui-browser"`.
- Group `@playwright/test` with `playwright-core`, and `axe-core` with `@axe-core/playwright`, so paired pins never split across PRs. Note that an `axe-core` bump will intentionally trip the axe-baseline engine-version check.
- Set `labels` explicitly. The defaults (`dependencies`, `javascript`) are not in `.github/labels.yml`, so either use taxonomy labels or `labels: []`.
- Use `versioning-strategy: increase` to keep exact pins.
- Add a machine check: ecosystem is npm, the directory matches the registry constant, and both the manifest and the lock exist there. Negative control: a wrong directory fails.

**R12. Coverage notices.** Every default (non-`--project`) report must state, in both JSON (a coverage field) and `--pretty`/`--behind-only` output, which standalone projects were left out and the command to select them. Census includes the standalone inventory itself. Notices inside shipped consumer tools follow the R1 decision.

Once R1–R5 are resolved in `plan.md` and `supervisor.md` (including the expanded write set) and R6–R12 are spelled out there, the plan should pass on re-review in this same evaluator session. The deferral boundaries (#2460, #2462, releases, installs) and the dev-only refusal for `prod-install` are fine as written. I couldn't read the #2461 issue text itself, so I checked the plan against the scope listed in your request.
