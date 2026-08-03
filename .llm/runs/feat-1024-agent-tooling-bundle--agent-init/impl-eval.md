# IMPL-EVAL: agent init tooling and offline docs bundles

**Run:** `feat-1024-agent-tooling-bundle--agent-init`
**Branch:** `feat/1024-agent-tooling-bundle`
**PR:** #1092
**Evaluator:** OpenHands / OpenRouter / `qwen/qwen3.7-max` / xhigh effort
**Phase:** IMPL-EVAL
**Baseline:** `e5bae2858` (origin/main at run start)
**Current HEAD:** `6dccf2f9` (15 commits from baseline)
**Verdict:** `PASS`

---

## Evaluation Scope

This evaluation covers the implementation of issues #1024 and #1061:

- **#1061 (Closes #1061):** Offline documentation bundle with exact-version API generation
- **#1024 (Refs #1024):** Agent tooling bundle with consumer-facing diagnostic tools

The PR honestly reduces scope: criterion 6 of #1024 (scaffold runtime passes) remains unchecked because the public `@netscript/cli@0.0.3` scaffold emits pinned host ports that the validator rejects. This is scaffold-owned work, not tooling-owned. The PR uses `Refs #1024` (not `Closes #1024`) and leaves the issue open for the scaffold lane.

---

## Challenge Responses

### 1. Generated/installed paths resolve from fresh project; no fixture mutation

**Finding:** All installed paths are resolved from `projectRoot` parameter, never from process CWD.

**Evidence:**
- `init-agent.ts` lines 81-99: tool and docs installation uses `join(input.projectRoot, ".llm", "tools", path)` and `join(input.projectRoot, ".netscript", "docs", path)`.
- `init-agent_test.ts` "installed consumer tools resolve from the project when process CWD differs" (lines 243-289): creates a temp directory, changes process CWD to it via `Deno.chdir(tempCwd)`, runs `initAgent` with an explicit `projectRoot`, then asserts all 8 tool files exist at `projectRoot/.llm/tools/` and not at `tempCwd`. The test passed (14ms).
- `deno-agent-docs-generator.ts` `generate(projectRoot)` method (line 177): all file reads (`deno.json`, `deno.lock`, workspace discovery) use `projectRoot`-relative paths. The `DenoAgentDocsCommandRunner.run(specifier, cwd)` passes `cwd` to `Deno.Command` (line 154-160), ensuring `deno doc` runs in the project context.
- `init-agent_test.ts` "offline docs failure occurs before any project write" (lines 343-362): the fake generator throws during `generate()`, and the test asserts `changedFiles` is empty and no docs files were written. Passed (1ms).

**Verdict:** PASS. Path closure is correct. No fixture mutation.

---

### 2. Eight-tool boundary: dependency-closed, symptom-routed, missing-binary safe, host-port validation after scaffold

**Finding:** The manifest is dependency-closed, each tool has a symptom, the E2E handles missing binaries structurally, and host-port validation runs after plugin/registry generation but before Aspire start.

**Evidence:**
- `.llm/tools/consumer-tools.json` (lines 1-55): lists exactly 8 tools with `source`, `path`, `symptom`, and `permissions`. Support files (`consumer-tools.json`, `README.md`, `release.json`) are declared separately. The manifest schema version is 1.
- `init-agent.ts` lines 66-71: verifies the embedded tool bundle hash before installation, throwing on mismatch. Lines 81-88 install all 8 tools from the embedded asset files.
- `.llm/tools/e2e/scaffold-e2e-test.ts` line 872: `validate-generated-host-ports` step runs after `generate-registries` (line 863) and before `aspire-start` (line 891). The step is marked `critical: true` (line 874) and calls the shipped `check-aspire-host-ports.ts` as a subprocess (line 879).
- `scaffold-e2e-test_test.ts` "missing Aspire binary becomes a structured failed step" (lines 67-89): sets `aspireCommand` to `/nonexistent/aspire`, runs the E2E, and asserts the result has `ok: false` with a structured error message, not an uncaught exception. Passed (16ms).
- `run-deno-check_test.ts` "runner fails when deno check excludes every explicit target despite exit 0" (lines 47-68): proves the excluded-file exit-0 trap. The test passes a config that excludes all requested files and asserts the runner returns a non-zero exit with a structured finding. Passed (73ms).
- `run-deno-check_test.ts` "runner fails when its own selection is empty" (lines 32-45): proves empty selection detection. Passed (49ms).

**Verdict:** PASS. All four sub-requirements are met.

---

### 3. Clone-independent consumer mode selects exact public CLI

**Finding:** When run from an installed project (not a framework clone), the E2E tool infers the project root from its installed path and selects `jsr:@netscript/cli@<exact-version>`.

**Evidence:**
- `.llm/tools/e2e/scaffold-e2e-test.ts` line 155-176: `inferProjectRoot()` walks up from the script's directory looking for `.llm/tools/e2e`, then returns the project root (the directory containing `.llm`).
- Line 210-256: `defaultOptions()` uses `inferProjectRoot()` when no `--repo` is provided. If the inferred root exists, it sets `cli` to `netscriptJsrSpecifier("cli")` (the exact release JSR specifier) and `source` to `"auto"`.
- Line 743: when `cli` starts with `jsr:`, the tool adds `--minimum-dependency-age=0` to bypass Deno's 24h quarantine policy on JSR packages. This is necessary because Deno 2.9 rejects packages published within the last 24 hours by default.
- `scaffold-e2e-test_test.ts` "consumer mode selects the exact released CLI without a framework clone" (lines 91-112): calls `normalizeCommandOptions({})` with no repo, asserts `options.cli` starts with `jsr:@netscript/cli@`, and asserts `options.source` is `"auto"`. Passed (8ms).

**Advisory note:** The `--minimum-dependency-age=0` flag is a workaround for Deno's quarantine policy. It is only applied when the CLI is a JSR specifier (not a local path), so it does not weaken security for local development.

**Verdict:** PASS. Clone-independent mode is correct.

---

### 4. --with-docs absent-by-default, fails before project write, resolves exact versions, runs deno doc over every export subpath

**Finding:** Without `--with-docs`, no docs corpus is written. With the flag, generation completes entirely in memory before any file write. Version resolution is exact (from `deno.json` imports and `deno.lock` specifiers). Every export subpath of every detected installed package is documented.

**Evidence:**
- `init-agent.ts` lines 72-77: `input.withDocs ? await dependencies.docsGenerator?.generate(input.projectRoot) : undefined`. If `withDocs` is false, `docs` is `undefined`, and lines 89-99 skip the docs write loop entirely.
- `deno-agent-docs-generator.ts` lines 177-227: `generate()` method:
  - Line 178-182: checks embedded prose version matches `NETSCRIPT_RELEASE_VERSION`, throws on mismatch.
  - Line 183-190: resolves installed packages from `deno.json` and `deno.lock`, checks each matches CLI version, throws on mismatch or missing evidence.
  - Line 192-217: iterates over installed packages and their export subpaths (from `EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS`), runs `deno doc` for each, throws on launch error (line 203-205), non-zero exit (line 206-209), or empty output (line 206-209).
  - Line 219-226: only after all generation completes, returns the file map. The caller (`initAgent`) writes files after receiving this result, so a late failure cannot leave partial output.
- `deno-agent-docs-generator_test.ts` "offline docs cover every export subpath at the exact installed version" (lines 28-58): provides a fake lock with exact versions and a fake runner that returns success for each specifier. Asserts the result has 2 API packages and 4 export subpaths, and that each specifier was passed to the runner. Passed (47ms).
- `deno-agent-docs-generator_test.ts` "lock evidence resolves a non-exact JSR range" (lines 60-78): provides a lock where the import is `^1.0.0` and the lock has `1.2.3`. Asserts the resolved version is `1.2.3`. Passed (959µs).
- `deno-agent-docs-generator_test.ts` "workspace evidence resolves a local package version without a lock" (lines 80-97): provides a workspace with a local package (no lock file). Asserts the version is read from the workspace package's `deno.json`. Passed (1ms).
- `deno-agent-docs-generator_test.ts` "missing lock evidence, version mismatch, and launch throws fail loudly" (lines 99-124): tests three failure modes:
  - No `deno.json` package evidence: throws "No installed @netscript/* package evidence".
  - Installed version differs from CLI version: throws "does not match CLI".
  - `deno doc` runner throws (simulating missing `deno` executable): throws "Failed to launch deno doc".
  All three assertions passed (33ms).

**Verdict:** PASS. All four sub-requirements are met.

---

### 5. Prose provenance/router assertions prevent stale bundles; docs asset in JSR publication

**Finding:** The embedded prose asset is integrity-checked (SHA-256), the task router presence is asserted, and the generated TypeScript asset is included in the CLI publish surface.

**Evidence:**
- `deno-agent-docs-generator.ts` lines 129-145: `inflateProse()` decodes the gzip base64, checks the SHA-256 hash against `EMBEDDED_AGENT_DOCS_PROVENANCE.sha256` (line 131-133), and asserts the task router is present: `!/^## Task router$/m.test(decoded.files['llms.txt'] ?? '')` throws "missing the #1068 task router" (line 141-143).
- `packages/cli/src/kernel/assets/agent-docs.generated.ts` (474 lines): contains `EMBEDDED_AGENT_DOCS_GZIP_BASE64` (the compressed prose payload), `EMBEDDED_AGENT_DOCS_PROVENANCE` (version, source commit, extraction timestamp, file list, SHA-256), and `EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS` (export map for each `@netscript/*` package).
- `packages/cli/deno.json` publish configuration: the worklog records "Final publish dry-run: Success Dry run complete" and "JSR simulation lists the 1.51 MB docs asset plus tool/skill assets". The generated asset is included in the publish file list.
- `build-agent-docs-bundle_test.ts` "docs prose builder requires the #1068 task router and writes only its output root" (lines 23-41): provides a fake site build output without the task router marker and asserts the builder throws. Also provides valid output and asserts it writes only to the specified output root. Passed (18ms).

**Advisory note:** The compressed docs asset is 1.18 MB (gzip source) / 1.6 MB (JSR-safe generated TypeScript). This is large but fits within JSR's package size limits. The asset is reproducible: the worklog records byte-stable SHA-256 after regeneration.

**Verdict:** PASS. Provenance and publication are correct.

---

### 6. Tests cover Deno.Command launch throws and excluded-file exit-zero trap

**Finding:** Both failure modes are covered by focused tests.

**Evidence:**
- `deno-agent-docs-generator_test.ts` "missing lock evidence, version mismatch, and launch throws fail loudly" (lines 99-124): includes a fixture where the command runner throws (simulating a missing `deno` executable). The test asserts the generator throws "Failed to launch deno doc". Passed (33ms).
- `run-deno-check_test.ts` "runner fails when deno check excludes every explicit target despite exit 0" (lines 47-68): provides a Deno configuration that excludes all requested TypeScript files (via `exclude` in `deno.json`). The runner returns exit 0 (because `deno check` succeeded on zero files), but the test asserts the runner detects this and returns a non-zero exit with a structured finding. Passed (73ms).
- `run-deno-check_test.ts` "runner fails when its own selection is empty" (lines 32-45): provides a root directory with no TypeScript files matching the requested extensions. The test asserts the runner returns a non-zero exit with a "no files selected" finding. Passed (49ms).

**Verdict:** PASS. Both failure modes are covered.

---

### 7. Public package JSDoc, architecture boundaries, lock hygiene, generated-asset freshness

**Finding:** All static gates pass. No lock file mutations. Generated assets are byte-stable.

**Evidence:**
- Worklog "Final CLI doc lint" (line 218): `deno task doc:lint --root packages/cli --pretty` returned "3 entrypoints, 0 diagnostics". This proves all public package symbols have JSDoc.
- Worklog "Final quality/doctrine" (line 216): `deno task quality:scan` returned "zero findings" and `deno task arch:check` returned "FAIL=0". This proves architecture boundaries are maintained.
- Worklog "Final generated asset freshness" (line 217): "regenerate + identical SHA-256". The worklog records: "Docs `71606ae0…`, tools `ea4529fb…`, skills `42880579…`". This proves the generated assets are byte-stable and the committed versions match the freshly generated versions.
- Lock hygiene: `deno.lock` does not appear in the diff stat (line 1-49 of `git --no-pager diff --stat e5bae2858..HEAD`). No lock file mutations occurred.
- Worklog "Final root check" (line 213): "2,524 files; 22 batches; 0 diagnostics". Type checking passes across the entire repository.
- Worklog "Final root test" (line 214): "2,535 passed (564 steps), 0 failed, 16 ignored". All tests pass.

**Verdict:** PASS. All static gates are clean.

---

### 8. Issue/PR boxes already checked are supported by evidence

**Finding:** All checked boxes are evidenced. #1061 is fully evidenced and closed. #1024 is partially evidenced (5/6 criteria), with criterion 6 honestly left unchecked.

**Evidence:**
- **#1061 acceptance criteria** (5/5 checked):
  1. "Offline framework and API documentation is installed by `netscript agent init --with-docs`" — Evidenced by worklog S2 acceptance table: "real temp-project install: 168 files, router present, one package / four export subpaths".
  2. "Exact installed `@netscript/*` versions are resolved from project evidence" — Evidenced by `deno-agent-docs-generator.ts` `resolveInstalledNetScriptPackages()` and its tests (lock, workspace, and missing-lock fixtures).
  3. "Every export subpath of every detected installed package is documented" — Evidenced by `deno-agent-docs-generator_test.ts` "offline docs cover every export subpath" and the real install's 4/4 export sections.
  4. "Generation failures occur before any project write" — Evidenced by `init-agent_test.ts` "offline docs failure occurs before any project write" and the fail-before-writes design in `deno-agent-docs-generator.ts`.
  5. "The offline documentation bundle is absent by default" — Evidenced by `init-agent_test.ts` "agent init leaves the offline docs corpus absent unless requested" and the conditional in `init-agent.ts` line 72-77.

- **#1024 acceptance criteria** (5/6 checked):
  1. "A discoverable, self-contained agent-grade tool bundle is installed" — Evidenced by `init-agent_test.ts` "agent init installs the complete diagnostic surface" and `consumer-tools.json`.
  2. "Each tool is symptom-routed from the installed skills/help/AGENTS surface" — Evidenced by `init-agent.ts` `agentsSection()` (line 23-28) and `skills/help.md` symptom routing.
  3. "The scaffold E2E is executable from a consumer project without a framework clone" — Evidenced by `scaffold-e2e-test_test.ts` "consumer mode selects the exact released CLI without a framework clone" and the worklog S3 consumer run.
  4. "The host-port validator runs against the generated project after scaffold/plugin generation" — Evidenced by `scaffold-e2e-test.ts` line 872-890 and `scaffold-e2e-test_test.ts` "generated host-port validation is critical and inspects the final pre-runtime artifact".
  5. "A fresh installed tool, invoked from `/tmp`, completed 22 exact-release steps" — Evidenced by worklog S3 consumer run: "passed 22 steps through generated type-check but rejected six pinned host ports emitted by public `0.0.3`".
  6. **Unchecked:** "The scaffold runtime passes" — The worklog honestly reports: "scaffold.runtime passed 47/48; `behavior.service-health` database-unhealthy; exact same 503/Prisma shape as prior clean baseline". This is a pre-existing scaffold issue, not caused by this PR. The PR uses `Refs #1024` (not `Closes #1024`) and leaves the issue open.

- **PR closing keywords:**
  - `Closes #1061` — Correct. All 5 criteria evidenced.
  - `Refs #1024` — Correct. Criterion 6 is scaffold-owned and unchecked.

**Verdict:** PASS. All checked boxes are evidenced. The reduced scope is honest.

---

## Runtime Evidence

The worklog and drift.md honestly disclose the runtime gap:

- **scaffold.runtime** (local-source, quiet host): passed 47/48 gates and cleanup. Sole failure: `behavior.service-health` returned HTTP 503 because Prisma's raw query cannot reach the generated database. This matches the pre-existing baseline shape (prior clean runs also fail this gate).
- **Leak-check**: post-run reporter found zero survivors. All run-owned containers were removed.
- **Evaluator instruction:** "Do not treat that as a green runtime result."

**Assessment:** The runtime gap is pre-existing, honestly disclosed, and outside this PR's scope. The tooling/docs diff does not cause or worsen the Prisma/database-unhealthy shape. The PR may pass its honestly reduced close scope without a green runtime gate.

---

## Advisory Observations (non-blocking)

1. **Compressed docs asset size:** 1.18 MB gzip source / 1.6 MB generated TypeScript. Large but within JSR limits. Byte-stable regeneration proven.
2. **`--minimum-dependency-age=0` workaround:** Necessary for Deno 2.9's 24h quarantine policy on JSR packages. Only applied when CLI is a JSR specifier (not local path). Does not weaken security for local development.
3. **Task router presence assertion:** `inflateProse()` checks for `## Task router` in `llms.txt`. If the site build ever omits the router, the docs generator will fail loudly. This is correct defensive design.
4. **Workspace version discovery:** `findWorkspaceVersion()` recursively searches for `deno.json` files up to 4 levels deep. This handles monorepo layouts but could be slow on very large workspaces. Not a blocker.

---

## Conclusion

The implementation is complete for the claimed scope. All focused tests pass (25 tests across 5 suites). All static gates pass at final product head `04757a018`. All checked issue boxes are evidenced. The runtime gap is honestly acknowledged and pre-existing. The PR correctly uses `Refs #1024` for partial work and `Closes #1061` for fully evidenced work.

The plan's two slices (tool bundle and docs bundle) are both implemented, independently reviewed, signed off, and committed. The worklog records 10 red/green cycles where consumer-run findings were fixed before the final evidence block. The opposite-family reviews (Claude Opus 4.8) returned `SLICE_REVIEW: PASS` for both slices after fixes.

No doctrine violations were introduced. No architecture debt was created. No lock file mutations occurred. The generated assets are byte-stable and included in the JSR publication surface.

**Verdict:** `PASS`

OPENHANDS_VERDICT: PASS
