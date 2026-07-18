# Evaluation: G7 #457 native-first thin-client deploy E2E

## Metadata

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g7-457-e2e`                  |
| Target         | `deploy.desktop-native` suite + Linux native driver + honesty  |
| Archetype      | `6 — CLI / Tooling`                                            |
| Scope overlays | `none`                                                         |
| Evaluator      | `open-model qwen3.7-max (Claude Code + OpenRouter) / 2026-07-18` |

## Process Verification

| Check                                  | Result | Evidence                                                                                 |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict PASS; D1–D19 locked; four commit slices ordered.                  |
| Design section exists in worklog       | PASS   | `## Design` section with public surface, vocabulary, ports, constants, deferred scope.   |
| Commit slices match design plan        | PASS   | Three commits on branch (`4ccfac47`, `097327b1`, `bd3ba218`) match S1/S2/S3 in order.    |
| Each slice has a passing gate          | PASS   | S1: preflight EXPECTED_FAIL; S2: fixture+preflight PASS; S3: Linux FAIL (honest).        |
| No speculative seams (unused files)    | PASS   | All adapters consumed by the suite definition; no dead imports.                          |
| Constants used for finite vocabularies | PASS   | `EXECUTION_PLATFORMS`, `NATIVE_DESKTOP_SUITE_STATUSES`, `GATE.*`, `DEPLOY.*` constants.   |

## Static Gates

| Gate             | Command or check                                         | Result | Evidence                        | Notes                                                      |
| ---------------- | -------------------------------------------------------- | ------ | ------------------------------- | ---------------------------------------------------------- |
| Narrow typecheck | `run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` | PASS   | 104 files; 0 findings           | Independently re-verified from worktree.                   |
| Lint             | `run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx`  | PASS   | 104 files; 0 findings           | Independently re-verified from worktree.                   |
| Format           | `run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`   | PASS   | 104 files; 0 findings           | Independently re-verified from worktree.                   |
| Full E2E tests   | `deno test --allow-all packages/cli/e2e/tests/`          | PASS   | 47 passed, 0 failed (worktree)  | Independently re-ran from worktree; matches worklog claim. |
| Fixture tests    | `deno test --allow-all tests/` (fixture root)            | PASS   | 4 passed, 0 failed              | Independently re-ran from fixture root.                    |

## Fitness Gates

| Gate      | Function                         | Result | Evidence                                          | Violations |
| --------- | -------------------------------- | ------ | ------------------------------------------------- | ---------- |
| F-1       | File-size lint                   | PASS   | quality:scan ok:true; 0 findings; 7 pre-existing allowances | none       |
| F-3       | Layering check                   | PASS   | domain→ports→adapters layered; `Deno.build` at adapter edge   | none       |
| F-5       | Public surface audit             | N/A    | `publish:false`; no published surface changed                   | N/A        |
| F-6       | JSR publishability gate          | N/A    | `publish:false`; JSR rubric not applicable                      | N/A        |
| F-7       | Doc-score gate                   | PASS   | `PlatformPort` has JSDoc; existing 83 errors pre-existing       | none       |
| F-9       | Permission declaration check     | PASS   | README matches actual fixture operations                       | none       |
| F-10      | Test-shape audit                 | PASS   | 47 tests across 14 files; no monolith                          | none       |
| F-11–F-18 | Forbidden naming/folder lints    | PASS   | scoped wrappers; 0 findings                                    | none       |
| F-19      | Scoped source gate runners       | PASS   | scoped check/lint/fmt wrappers over `packages/cli/e2e` only    | none       |

## Runtime Gates

| Gate                            | Validation                                | Result        | Evidence                                                                                                                     |
| ------------------------------- | ----------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| S1 preflight (EXPECTED_FAIL)    | Preflight fails without S2 fixture        | PASS          | `deno eval await Deno.stat(manifest)` fails because `fixtures/desktop-native/deno.json` does not exist before S2; exit 1.    |
| S2 fixture suite (preflight+contract) | Preflight PASS + 4 fixture tests PASS | PASS          | `deploy.desktop.preflight` finds manifest; `deploy.desktop.fixture` runs 4 contract tests green.                             |
| S3 Linux native suite           | Real one-pass suite on native WSL ext4    | FAIL (honest) | Structured `evidence.json` recorded: dpkg install succeeded; TLS release server served signed manifest; `op_desktop_verify_ed25519` unavailable in packaged runtime stopped staging. |
| Platform skip (NOT_RUN)         | Windows/macOS gate execution prevented    | PASS          | `gate-runner.ts:skipUnsupportedPlatform` returns `skipped` with `NOT_RUN` evidence before command execution. Gate-runner test proves this contract. |
| Windows MSI staged/manual       | Owner-hosted execution                   | NOT_RUN       | Documented in README; unavailable-platform-driver throws if reached; `skipUnsupportedPlatform` prevents reach on Linux.      |
| macOS DMG apply/rollback        | Owner-hosted execution                    | NOT_RUN       | Documented in README; same skip chain as Windows.                                                                            |

## Consumer Gates

| Consumer                                   | Validation                                | Result  | Evidence                                                                                                             |
| ------------------------------------------ | ----------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| Portable renderer remote-services contract  | Fixture test + suite gate                  | PASS    | `services__remote__http__0` fetch → `createDesktopServiceClient` RPC → `bindDesktopRpcWindow` → `acknowledge` writes evidence file. |
| Native window remote-services path         | Requires installed native runtime         | NOT_RUN | Worklog correctly notes: "Do not upgrade the portable contract result into a native-window claim." evidence.json confirms. |
| #841 seam consumer                         | `startAutoUpdate` only; no direct `Deno.autoUpdate` | PASS    | `grep -r "Deno.autoUpdate" packages/cli/e2e/` returns 0 results. Fixture `main.ts` imports `startAutoUpdate` only.    |
| #842 public RPC surfaces                   | `bindDesktopRpcWindow` + `createDesktopServiceClient` | PASS    | Used in `main.ts` (server) and `renderer.ts` (client); tested in `fixture-contract_test.ts`.                         |
| #456 production signing path              | `createReleaseRequestHandler` + PKCS8 Ed25519 | PASS    | `linux-native-driver.ts:288` consumes `createReleaseRequestHandler`; `release-signing-fixture.ts` uses `crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])`. |
| Exact discovery key                        | `services__remote__http__0`               | PASS    | `constants.ts:2` defines `REMOTE_SERVICE_ENV = 'services__remote__http__0'`; consumed in `router.ts:35`.             |

## Anti-Pattern Check

| AP    | Status | Evidence                                                                                          | Notes |
| ----- | ------ | ------------------------------------------------------------------------------------------------- | ----- |
| AP-1  | CLEAR  | No monolith; suite=131 lines, driver=451 lines, platform=20 lines, workspace=58 lines.            |       |
| AP-2/AP-6 | CLEAR | Ports used at real seams: `PlatformPort`, `CommandExecutor`, `HttpClient`, injected into runner.  |       |
| AP-3  | CLEAR  | `skipUnsupportedPlatform` dispatches by platform; no multi-platform god function.                 |       |
| AP-7  | CLEAR  | Uses Web APIs (`crypto.subtle`), `@std/path`, `@std/fs`, `Deno.Command`, `dpkg`/`openssl`/`bsdiff`. No home-grown crypto/updater/installer. |       |
| AP-8  | CLEAR  | Platform/gate definitions have JSDoc; `runGate`, `skipUnsupportedPlatform`, `PlatformPort.current()` documented. |       |
| AP-9  | CLEAR  | Full native Linux gate attempted; portable fixture tests; 47 unit tests.                         |       |
| AP-11 | CLEAR  | `EXECUTION_PLATFORMS`, `NATIVE_DESKTOP_SUITE_STATUSES`, `GATE.*`, `DEPLOY.*` all constant-derived. |       |
| AP-13 | CLEAR  | `runNativeCommand` has timeout; `launchDesktop` has bounded file polling; `main()` has `finally` for server shutdown. Cleanup is idempotent. |       |
| AP-18/AP-19 | CLEAR | README documents prerequisites, permissions, platform ownership, owner-host invocations.         |       |
| AP-23 | CLEAR  | Suite definition (`desktop-native-suite.ts`) is declarative gate list; orchestration lives in `linux-native-driver.ts` adapter. |       |
| AP-25 | CLEAR  | `Deno.Command` at `command.ts`; filesystem at adapter edges; TLS/effect at adapter edges.          |       |

## Truthfulness Machinery Verification

### Platform-gated NOT_RUN evidence shape

**Verified.** `gate-runner.ts:52-70` produces:
```json
{
  "status": "NOT_RUN",
  "platform": "<current-platform>",
  "supportedPlatforms": ["<required-platform>"],
  "reason": "Gate requires one of: <required-platform>."
}
```
The `gate-runner_test.ts` test confirms: zero command executions, verdict `skipped`, structured evidence with correct shape. This was independently verified (test passes in the suite).

### EXPECTED_FAIL preflight behavior

**Verified.** Before S2 lands: `deploy.desktop.preflight` runs `deno eval await Deno.stat(manifestPath)` on a non-existent fixture manifest, which fails. The preflight gate is `critical: true` so the suite halts — no subsequent gates execute. This prevents a false green from an incomplete fixture. After S2 lands: preflight passes because the manifest exists.

### No portable-to-native claim upgrade

**Verified.** Three independent controls:
1. `evidence.json` FAIL report has `unsupported: { windows: { status: 'NOT_RUN' }, darwin: { status: 'NOT_RUN' } }` — no green claim.
2. The portable fixture test (test #1 in `fixture-contract_test.ts`) is scoped to the contract layer and does not invoke a native window.
3. `worklog.md` Runtime Gates table explicitly says: "Do not upgrade the portable contract result into a native-window claim."

### Linux FAIL structure

**Verified.** `evidence.json` at `.llm/tmp/desktop-native-e2e/evidence.json`:
- `status: "FAIL"`
- `failure`: verbatim stderr including `op_desktop_verify_ed25519 is not a function`
- `installMode: "isolated-root-dpkg"` — real dpkg transaction, not a mock
- `package`: path to the real generated `.deb`
- `releaseBaseUrl`: the ephemeral HTTPS server that served the signed manifest
- `unsupported`: correctly records Windows/macOS as NOT_RUN

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                |
| --------------------- | ----- | ----------------------------------------------------------------------- |
| New entries           | 0     | No new doctrine violations introduced.                                   |
| Resolved entries      | 0     | `cli-deploy-linux-integration-untested` explicitly not closed by this gate. |
| Deepened violations   | 0     | Suite stays within archetype 6; no published surface changes.            |
| Unrecorded violations | 0     | No speculative production code changes.                                  |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| medium   | Product gap: `op_desktop_verify_ed25519` absent in packaged Deno 2.9.3 runtime | `evidence.json` failure message; G6 investigation verdict in `g6-456-packaging/op-verify-investigation.md` | Product-scope reconciliation (#841 SDK seam + Deno runtime); NOT this E2E slice |
| low      | PR body claims "47 passed" — verified correct from worktree but not from main checkout (44 from wrong cwd) | Independent re-run from both locations | No action; worklog is correct, shell cwd was the variable |
| low      | `unavailable-platform-driver.ts:14` throws unconditionally when reached on its own platform; this is correct but the throw message could be more structured | Source review of the driver | Acceptable; the `skipUnsupportedPlatform` chain prevents reach on the current Linux host |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Honest FAIL is more valuable than false green | Structured evidence + NOT_RUN legs + no claim upgrade | Archetype 6, 7 | high |
| Platform applicability as a gate pre-filter | Inject `PlatformPort`; check before execution; emit machine-readable skip | All CLI/E2E archetypes | high |
| Preflight gates prevent partial-implementation false greens | Fail-closed before dependent artifacts exist | All archetypes with ordered slices | high |

## Verdict

| Field     | Value  |
| --------- | ------ |
| Verdict   | PASS   |
| Rationale | The slice correctly proves the truthfulness machinery (platform-gated NOT_RUN, EXPECTED_FAIL preflight, no portable-to-native claim upgrade), the Linux FAIL is structured and evidence-backed (real dpkg install, real TLS server, real signed manifest fetched, upstream `op_desktop_verify_ed25519` gap), fixture purity is maintained (#841 seam only, #842 public RPC, exact discovery key, production #456 signing path, no direct `Deno.autoUpdate`), and owner-runnable invocations are documented without false-closed-checkbox claims. The product gap (missing Deno desktop verify op) is outside this E2E slice's scope and is correctly recorded as drift, not silently fixed. All static/fitness gates pass, 47 tests pass, quality scan is clean, and the draft PR is properly scoped with `Refs #457`. |

PASS
