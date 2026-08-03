# IMPL-EVAL: agent init tooling and offline docs bundles (post-rebase)

**Run:** `feat-1024-agent-tooling-bundle--agent-init`
**Branch:** `feat/1024-agent-tooling-bundle`
**PR:** #1092
**Evaluator:** OpenHands / OpenRouter / `qwen/qwen3.7-max` / xhigh effort
**Phase:** IMPL-EVAL (post-rebase replacement)
**Base:** `d0802e150` (current `origin/main` after rebase)
**Current HEAD:** `7c55403f` (9 commits from base)
**Replaces:** Previous IMPL-EVAL at `fcd10f82` against pre-rebase baseline `e5bae2858`
**Verdict:** `PASS`

---

## Evaluation Scope

This is a fresh post-rebase evaluation. The branch was rebased onto current `origin/main` at
`d0802e150`, consuming six merged commits including #1078 (MCP diagnostics and gated drift-receipt
contract). Two conflicts in `init-agent.ts` were resolved by composing #1078's language with this
slice's symptom-indexed tool and optional-docs routing in the generated `AGENTS.md` section.

The PR closes #1061 (offline documentation bundle, 5/5 acceptance criteria evidenced) and
references #1024 (agent tooling bundle, 5/6 criteria evidenced; criterion 6 scaffold-owned and
honestly unchecked). The PR uses `Closes #1061` and `Refs #1024`.

---

## Challenge Responses

### 1. Generated/installed paths resolve from fresh project; no fixture/repo artifact mutated

**Evidence:**

- `init-agent.ts` lines 81-99: all tool writes use `join(input.projectRoot, ".llm", "tools", path)`
  and all docs writes use `join(input.projectRoot, ".netscript", "docs", path)`. No path is
  resolved from process CWD.
- `init-agent_test.ts` "installed consumer tools resolve from the project when process CWD differs":
  changes `Deno.cwd()` to a temp directory, runs `initAgent` with an explicit `projectRoot`, asserts
  all 8 tool files exist under `projectRoot/.llm/tools/` and not under the foreign CWD. Passed.
- `deno-agent-docs-generator.ts` line 177: `generate(projectRoot)` reads `deno.json` and `deno.lock`
  relative to `projectRoot`. `DenoAgentDocsCommandRunner.run(specifier, cwd)` passes `cwd` to
  `Deno.Command`, ensuring `deno doc` runs in the project context.
- `init-agent_test.ts` "offline docs failure occurs before any project write": fake generator throws
  during `generate()`, test asserts `changedFiles` is empty and no docs files were written.
- Path safety: `init-agent.ts` line 92 rejects any docs path starting with `/` or containing `..`.

**Verdict:** PASS. Path closure is correct. No fixture mutation.

### 2. Eight-tool boundary: dependency-closed, symptom-routed, missing-binary safe, host-port validation after scaffold/plugin generation

**Evidence:**

- `.llm/tools/consumer-tools.json`: exactly 8 tools with `source`, `path`, `symptom`, and
  `permissions`. Support files (`consumer-tools.json`, `README.md`, `release.json`) declared
  separately. Schema version 1.
- `init-agent.ts` lines 66-71: verifies embedded tool bundle SHA-256 hash before installation,
  throws on mismatch. Lines 81-88 install all 8 tools from the embedded asset.
- `.llm/tools/e2e/scaffold-e2e-test.ts`: `validate-generated-host-ports` step runs **after**
  `generate-registries` and **before** `aspire-start`. The step calls the shipped
  `check-aspire-host-ports.ts` as a subprocess with `critical: true`.
- `scaffold-e2e-test_test.ts` "missing Aspire binary becomes a structured failed step": sets
  `aspireCommand` to `/nonexistent/aspire`, asserts `ok: false` with structured error, not uncaught
  exception. Passed.
- `run-deno-check_test.ts` "runner fails when deno check excludes every explicit target despite exit
  0": proves the excluded-file exit-0 trap. Also "runner fails when its own selection is empty":
  proves empty-selection detection. Both passed.
- Symptom routing: installed `AGENTS.md` section routes each tool symptom from `skills/help.md` and
  the `.llm/tools/README.md` index.

**Verdict:** PASS. All four sub-requirements are met.

### 3. Clone-independent consumer mode selects exact public CLI; avoids repository dependencies

**Evidence:**

- `.llm/tools/e2e/scaffold-e2e-test.ts` `inferProjectRoot()`: walks up from the script's own
  directory looking for `.llm/tools/e2e`, returns the project root (directory containing `.llm`).
- `defaultOptions()`: when no `--repo` is provided, uses `inferProjectRoot()`. If the inferred root
  exists, sets `cli` to `netscriptJsrSpecifier("cli")` (exact release JSR specifier) and `source` to
  `"auto"`.
- When `cli` starts with `jsr:`, the tool adds `--minimum-dependency-age=0` to bypass Deno 2.9's 24h
  quarantine policy. Only applied for JSR specifiers, not local paths.
- `scaffold-e2e-test_test.ts` "consumer mode selects the exact released CLI without a framework
  clone": asserts `options.cli` starts with `jsr:@netscript/cli@` and `options.source` is `"auto"`.
  Passed.
- The E2E tool no longer imports from `../agentic/teardown/*` — those agentic teardown dependencies
  were removed in favor of subprocess-based host-port validation.

**Verdict:** PASS. Clone-independent mode correctly selects the exact public CLI.

### 4. --with-docs absent-by-default, fails before project write, resolves exact versions, runs deno doc over every export subpath

**Evidence:**

- `init-agent.ts` line 72-77: `input.withDocs ? await dependencies.docsGenerator?.generate(...) :
  undefined`. Without the flag, `docs` is `undefined` and the docs write loop is skipped entirely.
- `deno-agent-docs-generator.ts` `generate()`:
  - Line 178-182: checks embedded prose version matches `NETSCRIPT_RELEASE_VERSION`, throws on
    mismatch.
  - Line 183-190: resolves installed packages via `resolveInstalledNetScriptPackages()`, checks each
    matches CLI version, throws on mismatch or missing evidence.
  - Line 192-217: iterates over installed packages and their export subpaths from
    `EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS`, runs `deno doc` for each, throws on launch error, non-zero
    exit, or empty output.
  - Only after all generation completes does it return the file map. The caller writes files after
    receiving this complete result, so a late failure cannot leave partial output.
- `deno-agent-docs-generator_test.ts`: tests cover lock/workspace/no-lock version resolution, every
  export subpath generation, missing evidence, version mismatch, and launch throws. All passed.
- `init-agent-input.ts` adds `withDocs?: boolean` — optional, absent by default.

**Verdict:** PASS. All four sub-requirements are met.

### 5. Prose provenance/router assertions prevent stale bundles; docs asset in JSR publication at informed size

**Evidence:**

- `deno-agent-docs-generator.ts` `inflateProse()`: decodes gzip base64, checks SHA-256 hash against
  `EMBEDDED_AGENT_DOCS_PROVENANCE.sha256`, and asserts `## Task router` is present in `llms.txt`
  (the #1068 router from merged #1079).
- `agent-docs.generated.ts` (474 lines): contains `EMBEDDED_AGENT_DOCS_GZIP_BASE64`,
  `EMBEDDED_AGENT_DOCS_PROVENANCE` (version, source commit, extraction timestamp, file list,
  SHA-256), and `EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS`.
- Worklog records "Final publish dry-run: Success Dry run complete" with "generated docs 1.51 MB"
  in the JSR simulation file list. The compressed asset (1.18 MB gzip source → 1.6 MB generated
  TypeScript) is within JSR limits.
- `build-agent-docs-bundle_test.ts`: proves the builder throws when the task router is absent and
  writes only to its designated output root. Passed.
- Byte-stable regeneration proven: worklog records identical SHA-256 after regeneration
  (`71606ae0…`).

**Verdict:** PASS. Provenance and publication are correct.

### 6. Tests cover Deno.Command launch throws and excluded-file exit-zero trap

**Evidence:**

- `deno-agent-docs-generator_test.ts` "missing lock evidence, version mismatch, and launch throws
  fail loudly": includes a fixture where the command runner throws (simulating missing `deno`
  executable). Asserts generator throws "Failed to launch deno doc". Passed.
- `run-deno-check_test.ts` "runner fails when deno check excludes every explicit target despite exit
  0": provides a config that excludes all requested files, asserts non-zero exit with structured
  finding. Passed.
- `run-deno-check_test.ts` "runner fails when its own selection is empty": empty directory, asserts
  non-zero exit. Passed.

**Verdict:** PASS. Both failure modes covered.

### 7. Public package JSDoc, architecture boundaries, lock hygiene, generated-asset freshness

**Evidence:**

- CLI doc lint: "3 entrypoints, 0 diagnostics" (worklog, post-rebase).
- Architecture: `quality:scan` zero findings; `arch:check` FAIL=0 (worklog, post-rebase).
- Lock hygiene: `deno.lock` does not appear in the diff stat. No lock file mutations.
- Generated-asset freshness: "asset-barrel diff clean" after post-rebase regeneration (worklog).
- Post-rebase root check: 2,541 files in 22 batches, 0 diagnostics.
- Post-rebase root test: 2,571 passed (567 steps), 0 failed, 16 ignored.
- Post-rebase agent-surface lint/fmt: clean.

**Verdict:** PASS. All static gates are clean.

### 8. Issue/PR boxes already checked are supported by evidence

**#1061 acceptance criteria (5/5 checked):**

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | Offline docs installed by `agent init --with-docs` | Worklog S2: real temp-project install produced 168 files, router present, 4/4 export subpaths. |
| 2 | Exact installed versions resolved from project evidence | `resolveInstalledNetScriptPackages()` + 3 test fixtures (lock, workspace, no-lock). |
| 3 | Every export subpath documented | `EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS` iteration + test "offline docs cover every export subpath". |
| 4 | Generation failures before any project write | `init-agent_test.ts` "offline docs failure occurs before any project write" + fail-before-return design. |
| 5 | Absent by default | `init-agent_test.ts` "agent init leaves the offline docs corpus absent unless requested" + conditional line 72. |

**#1024 acceptance criteria (5/6 checked):**

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | Discoverable, self-contained tool bundle | `consumer-tools.json` manifest + `init-agent_test.ts` "agent init installs the complete diagnostic surface". |
| 2 | Symptom-routed from installed surface | `agentsSection()` in `init-agent.ts` + `skills/help.md` + `.llm/tools/README.md`. |
| 3 | Clone-independent E2E | `scaffold-e2e-test_test.ts` "consumer mode selects the exact released CLI" + `inferProjectRoot()`. |
| 4 | Host-port validator after scaffold/plugin generation | E2E `validate-generated-host-ports` step ordering (after `generate-registries`, before `aspire-start`). |
| 5 | Fresh installed tool from `/tmp` completed 22 steps | Worklog S3: "passed 22 steps through generated type-check but rejected six pinned host ports emitted by public `0.0.3`". |
| 6 | Scaffold runtime passes | **Unchecked.** Pre-existing `behavior.service-health` Prisma/database-unhealthy. PR correctly uses `Refs #1024`. |

**Closing keywords:** `Closes #1061` (correct, 5/5 evidenced). `Refs #1024` (correct, criterion 6 scaffold-owned).

**Verdict:** PASS. All checked boxes are evidenced. The reduced scope is honest.

### 9. Rebase conflict resolutions in init-agent.ts correctly preserve #1078's MCP diagnostics and gated drift-receipt contract

**Evidence:**

The current `agentsSection()` in `init-agent.ts` (lines 24-29) contains:

1. **From merged #1078 (preserved intact):**
   - MCP `doctor` for prerequisites: "Use MCP `doctor` for NetScript, Aspire, project-wiring, and plugin prerequisites."
   - MCP telemetry routing: "Use `get_app_status` and `get_recent_errors` for live telemetry symptoms; use the `analyze_*` tools and `aspire otel logs|spans|traces` for performance and database evidence."
   - Gated drift-receipt contract: "Drift is gated, not suggested: `netscript agent drift record` and MCP `record_drift` refuse unless the same resource has a successful `netscript plugin doctor --resource <name>` or MCP diagnostic receipt from the last 15 minutes. Receipts live under `.netscript/agent/diagnostics/`; accepted entries append to `.netscript/agent/drift.jsonl`."

2. **From this slice (composed into the same section):**
   - Symptom-indexed tool routing: "Route Deno runtime, type, permission, and module-resolution symptoms to the `deno` skill. The symptom-indexed project tools are listed in `.llm/tools/README.md`; for type evidence use `.llm/tools/run-deno-check.ts`, which fails when configuration excludes every requested file."
   - Optional docs routing: conditional sentence about `.netscript/docs/llms.txt` or `--with-docs` suggestion.

3. **No scaffold-owned implementation was edited:** The conflict was limited to the generated `AGENTS.md` guidance string. The scaffold-owned `initAgent` orchestration, ports, and adapters were not modified by the rebase resolution.

**Post-rebase gate evidence:**
- Focused conflict-surface tests: 26/26 passed.
- 17-file lint/fmt: clean.
- CLI doc lint: clean.
- Asset-barrel diff: clean.

**Verdict:** PASS. Both merged and slice-owned language are correctly composed.

---

## Runtime Evidence

- **scaffold.runtime** (local-source, serialized quiet-host): passed 47/48 gates and cleanup.
  Sole failure: `behavior.service-health` returned HTTP 503 because Prisma's raw query could not
  reach the generated database. This reproduces the pre-existing clean-baseline failure shape.
- **Leak-check:** zero survivors post-run.
- **Evaluator instruction:** "Do not treat that as a green runtime result."

The runtime gap is pre-existing, honestly disclosed, and outside this PR's scope. The tooling/docs
diff does not cause or worsen the Prisma/database-unhealthy shape.

---

## Advisory Observations (non-blocking)

1. **Compressed docs asset size:** 1.18 MB gzip source / 1.6 MB generated TypeScript. Large but
   within JSR limits and byte-stable.
2. **`--minimum-dependency-age=0` workaround:** Necessary for Deno 2.9's 24h JSR quarantine policy.
   Only applied when CLI is a JSR specifier (not local path). Does not weaken local security.
3. **Workspace version discovery depth:** `findWorkspaceVersion()` recurses up to 4 levels. Handles
   monorepo layouts correctly.
4. **Published scaffold pinned ports:** The current `@netscript/cli@0.0.3` emits 6 literal
   `withHttpEndpoint({ port: ... })` pins that the shipped validator correctly rejects. This is
   scaffold-owned work tracked in #1024 criterion 6.

---

## Conclusion

The implementation is complete for its honestly reduced close scope:

- **#1061** is fully evidenced (5/5 criteria) and correctly uses `Closes #1061`.
- **#1024** is substantially evidenced (5/6 criteria) and correctly uses `Refs #1024`, leaving the
  issue open for the scaffold-owned criterion 6.

All focused tests pass (26/26 conflict-surface, 37/37 combined regression). All static gates pass at
post-rebase product head `b1a3a97bfe`. All checked issue boxes are evidenced. The rebase conflict
resolutions correctly compose merged #1078's MCP diagnostics and gated drift-receipt contract with
this slice's symptom-indexed tool and optional-docs routing. No scaffold-owned implementation was
edited. No doctrine violations, no architecture debt, no lock file mutations.

**Verdict:** `PASS`

OPENHANDS_VERDICT: PASS
