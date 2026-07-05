# Evaluation — beta3-cut-A-deploy--impl

## SKILL

- netscript-harness — evaluator protocol, verdict rules.
- netscript-cli — CLI e2e suite architecture (suites/gates/registry), scaffold surface.
- netscript-doctrine — epic #327 deployment doctrine; gate:e2e acceptance semantics.
- netscript-tools — gate evidence rules.

## IMPL-EVAL #470

| Field | Value |
| ----- | ----- |
| Run ID | `beta3-cut-A-deploy--impl` |
| Branch | `test/deploy-e2e-gate-394` (stacked on `fix/deploy-compose-target-393`) |
| PR | #470 |
| Issues referenced | Closes #394, refs #393 |
| Milestone | 0.0.1-beta.3 |
| Verdict | **PASS** |

### Adversarial Scrutiny Points

#### 1. Coverage Authenticity: Real Acceptance or Rubber Stamp?

**Verdict: REAL acceptance, not a rubber stamp.**

The `deploy.deno-deploy.plan` gate executes `netscript deploy deno-deploy plan --project-root <scaffold> --app <name>` against a real scaffolded project. The `plan` method in `DenoDeployTarget` (packages/cli/src/kernel/domain/deploy/deno-deploy-target.ts) performs:

- **Config resolution**: Reads `deno.json`/`deno.jsonc` from project root via `DenoDeployPreflightReader`.
- **Source scanning**: Reads entrypoint source files (`main.ts`, `src/main.ts` candidates).
- **Adapter wiring**: Instantiates `DenoDeployTarget` with `DenoDeployCliAdapter` (ProcessPort-backed) + `DenoDeployPreflightReader`.
- **Unstable-API guard**: Scans sources for `--unstable-*` flags in imports, blocks on violations, reports Deploy-readiness.

This exercises a **non-trivial slice** of the production deploy path: config resolution → adapter wiring → artifact planning → unstable-API validation. It is NOT a help-text dump.

The `deploy.compose-resolution` gate uses `deploy compose/docker --help` to assert verb exposure (plan/up/down/status/logs). This is **resolution-level** coverage per LD-394-3 in the plan — it proves #393 without invoking Aspire publish or Docker (which would violate the credential-free constraint). The limitation is explicitly documented in the plan §Non-Scope and worklog §Deferred Scope.

**Issue #394 ask**: "at least one deploy target has real acceptance coverage." **Met honestly**: Deno Deploy `plan` is real acceptance (reads config, scans sources, validates unstable APIs). Compose/docker is resolution-level (documented limitation).

#### 2. E2E Re-run from Native WSL Path

**Command**: `deno task e2e:cli run deploy.targets --cleanup --format pretty`

**Raw output**:
```
Running deploy.targets
> preflight.deno: Deno CLI is available
  PASSED 8ms
> scaffold.init: Scaffold generated project
  PASSED 519ms
> deploy.deno-deploy.plan: Preflight generated project for Deno Deploy
  PASSED 1714ms
> deploy.compose-resolution: Resolve Docker and Compose deploy target routers
  PASSED 568ms
> cleanup.userland-smoke-root: Remove deploy target smoke project
  PASSED 190ms
Summary: passed=5 failed=0
```

**Exit code**: 0

**Status**: ✓ GREEN

#### 3. Suite Registration Hygiene

**cli-surface.ts changes**:
- Added `DEPLOY = { TARGETS: 'deploy.targets' } as const`
- Added `DEPLOY_TITLE = { TARGETS: 'Deploy target acceptance smoke' } as const`
- Added `DEPLOY_DENO_DEPLOY_PLAN: 'deploy.deno-deploy.plan'` and `DEPLOY_COMPOSE_RESOLUTION: 'deploy.compose-resolution'` to `GATE` enum
- Added `DeploySuiteId` type export

**registry.ts changes**:
- Imported `DEPLOY, DEPLOY_TITLE` and `createDeployTargetsSuite`
- Added `{ id: DEPLOY.TARGETS, title: DEPLOY_TITLE.TARGETS, create: createDeployTargetsSuite }` to `builtInSuites` array.
- Added `DeploySuiteId` to `SuiteId` union type.

**Suite registration verification**:
```bash
$ deno task e2e:cli suites
deploy.targets  Deploy target acceptance smoke

$ deno task e2e:cli gates deploy.targets
preflight.deno  preflight       Deno CLI is available
scaffold.init   scaffold        Scaffold generated project
deploy.deno-deploy.plan behavior        Preflight generated project for Deno Deploy
deploy.compose-resolution       behavior        Resolve Docker and Compose deploy target routers
cleanup.userland-smoke-root     cleanup Remove deploy target smoke project
```

**Status**: ✓ Consistent with existing scaffold suite architecture.

#### 4. Global State Mutation & Cleanup

**With `--cleanup`**: The `cleanup.userland-smoke-root` gate ran successfully (PASSED 190ms). The cleanup script:
- Removes `context.project.projectRoot` recursively (the scaffolded project).
- Attempts to remove `context.project.smokeRoot` (the parent smoke directory), tolerating NotFound.

**Interference with `scaffold.runtime`**: None. The deploy suite uses a different project name (`${baseOptions.projectName}-deploy`) and different smoke root (`${repoRoot}/.llm/tmp/cli-e2e/${baseOptions.projectName}-deploy`). No shared state with scaffold.runtime.

**Status**: ✓ Cleanup works; no global state leakage or scaffold.runtime interference.

#### 5. Cast Budget & Lock Churn

**Type casts in diff**:
- `as unknown as PublicCommandDependencies` — test-only mock wiring (target-deploy-command_test.ts).
- `as keyof DeployTargetPort` — test-only dynamic property access (deploy-target-port_test.ts).
- `as const` and `as const satisfies` — type narrowing assertions, not casts.

**Cast count**: 2 test-only casts (within accepted budget). No new runtime casts.

**deno.lock churn**: `git diff origin/main...HEAD -- deno.lock` → exit code 0, no output. **Zero lock churn.**

**Status**: ✓ No cast creep; no lock churn.

#### 6. Issue #394 Accepted Gate Checkboxes

Per evaluator protocol rule 12 (close-gate): boxes may only be checked for gates that actually RAN green.

The worklog §Gate Results documents:
- **gate:e2e**: `deno task e2e:cli run deploy.targets --cleanup --format pretty` — passed=5 failed=0.

The supervisor owns the GitHub issue checkbox update per the workflow. The evidence here is the green gate run with exit code 0 and summary passed=5/failed=0.

**Status**: ✓ Gate ran green; evidence recorded.

### Static Gates

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| check | PASS | Worklog: 589 files selected; 5 batches; 0 failed; 0 diagnostics. |
| lint (changed files) | PASS | Worklog: `deno lint --no-config <6 changed ts files>` — `Checked 6 files`. |
| fmt (changed files) | PASS | Worklog: `deno fmt --check --no-config --line-width 100 --indent-width 2 --single-quote <6 changed ts files>` — `Checked 6 files`. |
| e2e check | PASS | Worklog: 77 files selected; 1 batch; 0 diagnostics. |
| e2e lint | PASS | Worklog: 77 files selected; 1 batch; 0 findings. |
| e2e fmt | PASS | Worklog: 77 files selected; 1 batch; 0 findings. |

**Drift note**: Scoped lint/fmt wrappers exit 1 with "No target files found" because root deno.json excludes packages/cli/. Workaround: direct file lint/fmt with --no-config and repo-equivalent options. Drift logged in worklog.md §Drift.

### Fitness Gates

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| F-DEPLOY-1 (every default target resolves, every advertised op has a handler) | PASS | `deploy-target-port_test.ts`: 3 new tests — "the default deploy target registry resolves every first-party target", "the default deploy target registry exposes only operations with implemented handlers", "compose and docker targets resolve the Aspire adapter operation subsets". Unit test run: 23 passed, 0 failed. |
| F-DEPLOY-2 (router verbs are derived from registry targets) | PASS | `target-deploy-command_test.ts`: "deploy docker/compose routers resolve their default registry targets" — asserts docker/compose routers expose [down, logs, plan, status, up] verbs from registry. |
| gate:e2e (deploy acceptance) | PASS | `deno task e2e:cli run deploy.targets --cleanup --format pretty` — passed=5 failed=0, exit code 0. Independently re-run by evaluator. |

### Consumer Gates

| Consumer | Result | Evidence |
| -------- | ------ | -------- |
| Public deploy command router | PASS | Unit test: "deploy docker/compose routers resolve their default registry targets" in target-deploy-command_test.ts. |
| CLI e2e deploy suite | PASS | `deno task e2e:cli suites` lists deploy.targets; `deno task e2e:cli gates deploy.targets` lists all 5 gates. |

### Doctrine Check

**AP-24 (registry as single source of truth)**: The plan and implementation move compose/docker registration into `DEFAULT_DEPLOY_TARGETS` (deploy-target-registry.ts) and remove the duplicate manual registration from `public-command-dependencies.ts`. The registry is now the authoritative source. ✓

**Thin-router violation**: `deploy-group.ts` remains unchanged; target-specific behavior stays in the adapter. The router remains target-agnostic. ✓

**CLI restructuring debt (doctrine file 10)**: This is a narrow registry/test fix that does not author compose YAML, redesign the deploy verb vocabulary, or expand the CLI surface. It does not deepen the existing CLI restructuring debt. ✓

### Arch-Debt Implications

| Entry | Action | Status |
| ----- | ------ | ------ |
| `packages/cli` restructure verdict | none | Narrow fix does not deepen existing CLI restructuring debt. No new debt entry required. |

**No new unrecorded doctrine violations introduced or deepened.**

### Evidence Summary

| Gate | Command | Result |
| ---- | ------- | ------ |
| targeted unit tests | `deno test --unstable-kv packages/cli/src/kernel/domain/deploy/deploy-target-port_test.ts packages/cli/src/kernel/domain/deploy/deno-deploy-target_test.ts packages/cli/src/public/features/deploy/target/target-deploy-command_test.ts` | 23 passed, 0 failed (178ms) |
| deploy e2e suite | `deno task e2e:cli run deploy.targets --cleanup --format pretty` | passed=5 failed=0, exit 0 |
| suite registration | `deno task e2e:cli suites` | deploy.targets listed |
| gate registration | `deno task e2e:cli gates deploy.targets` | All 5 gates listed |
| lock churn | `git diff origin/main...HEAD -- deno.lock` | No changes |

### Verdict Rationale

**PASS** because:

1. **Approved scope complete**: compose/docker registered in defaults (#393), deploy.targets e2e suite added (#394). Both PR commits present.
2. **Static gates pass**: check/lint/fmt pass (with documented drift for scoped wrapper root exclusion).
3. **Fitness gates pass**: F-DEPLOY-1, F-DEPLOY-2, gate:e2e all have evidence.
4. **Consumer gates pass**: Public router and CLI e2e suite both verified.
5. **No unrecorded doctrine violations**: AP-24 resolved, thin-router honored, CLI debt not deepened.
6. **Docs/run artifacts updated**: plan.md, worklog.md, commits.md, drift.md, context-pack.md all present and current.
7. **Coverage authentic**: deploy.deno-deploy.plan exercises real config resolution + unstable-API guard, not help-text. Credential split documented.
8. **Cleanup works**: --cleanup passed, no global state leakage.
9. **Cast budget honored**: 2 test-only casts, no runtime casts.
10. **No lock churn**: deno.lock unchanged.

### Remaining Risks

- **Compose resolution is resolution-level only**: The compose/docker gate uses --help output, not full Aspire publish or Docker runtime. This is explicitly documented as a limitation (credential-free constraint) and does not violate #394's ask ("at least one deploy target has real acceptance coverage" — met by Deno Deploy plan).
- **Credentialed Deno Deploy operations deferred**: push/delete/status/logs require external credentials and are future scope. The credential split is clearly documented in the plan §Non-Scope and worklog §Deferred Scope.
- **Scoped lint/fmt wrapper drift**: Root deno.json excludes packages/cli/, causing wrappers to exit 1 with "No target files found". Workaround documented; not a blocker.

### Process Note

The harness V3 protocol requires a separate PLAN-EVAL pass before implementation. The drift.md documents that this run proceeded as a combined implementation-lane run (implementation #393 + #394) without a separate PLAN-EVAL session. The supervisor/OpenHands path owns the final evaluator separation. This evaluation is the IMPL-EVAL pass against the committed state.

**Final verdict: PASS**
