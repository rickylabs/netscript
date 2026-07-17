# Drift Log: fix #808 MCP live-validation blockers

Drift is append-only.

## 2026-07-17 — Owner waived formal evaluator dispatch

- **What:** PLAN-EVAL and IMPL-EVAL will not be launched for this run.
- **Source:** User directive: “Do NOT dispatch evals; do not merge.”
- **Expected:** Harness normally requires separate-session PLAN-EVAL before implementation and
  IMPL-EVAL after gates.
- **Actual:** `workflow/run-loop.md` permits an explicit written owner waiver at the Plan-Gate; the
  PR must remain draft at `status:impl-eval` without any claimed evaluator verdict.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `supervisor.md`, user brief, and final draft PR state.

## 2026-07-17 — Existing CLI subpath JSR diagnostics

- **What:** The MCP `./cli` export references five types that it imports but does not re-export.
- **Source:** `deno doc --lint packages/mcp/cli.ts`.
- **Expected:** The prior run context and wrapper combined summary described the full export map as
  clean.
- **Actual:** Raw Deno doc lint reports five `private-type-ref` errors; the structured wrapper's
  per-entry data sees them but its combined summary incorrectly returns zero.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `research.md` JSR scan; planned S3 entrypoint correction with no new API concept.

## 2026-07-17 — Main advanced during bootstrap

- **What:** `origin/main` advanced from `6e8528a0` to `7bc256a1` after the first bootstrap push.
- **Source:** GitHub PR base SHA and `git fetch origin main`.
- **Expected:** Initial local `origin/main` was current when the branch was created.
- **Actual:** PR #807 merged an MCP README-only change; the branch was rebased before source work.
- **Severity:** minor
- **Action:** accept
- **Evidence:** baseline fields in `supervisor.md`/`research.md`; PR #809 base SHA.

## 2026-07-17 — Detached Aspire start does not survive tool invocation

- **What:** `aspire start --non-interactive --isolated` returned a Dashboard URL, but the detached
  AppHost processes exited when the command invocation ended and `aspire ps` returned `[]`.
- **Source:** live capture setup against the generated scaffold.
- **Expected:** The Aspire skill's preferred detached `aspire start` path would keep the AppHost
  running for follow-up `aspire wait`/Dashboard requests.
- **Actual:** The validator report's attached foreground `aspire run --non-interactive --isolated`
  transport is required in this execution environment to keep the runtime alive.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Aspire 13.4.6 detached log
  `/home/codex/.aspire/logs/cli_20260717T050036315_detach-child_7819f130deb240feab60e9e6e27d1ed3.log`;
  empty `aspire ps` and absent PIDs.

## 2026-07-17 — Telemetry blocker also includes local Dashboard TLS and OTLP enum semantics

- **What:** The live report correctly identified the envelope/nesting loss but did not separately
  name the preceding Deno TLS failure or the off-by-one OTLP numeric span-kind mapping.
- **Source:** Fresh live Dashboard `https://localhost:43909` after a worker health-check trigger.
- **Expected:** Fixing `{data:{resourceSpans}}` parsing alone would restore live MCP telemetry.
- **Actual:** Default Deno fetch fails `UnknownIssuer` and is swallowed to empty; loading the
  generated ASP.NET localhost PEM succeeds. The resulting live payload also proves
  `1=internal … 5=consumer`, unlike the current mapping.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `.llm/tmp/mcp-808-live-spans.json`; Deno direct-fetch error; successful custom
  `Deno.HttpClient({caCerts:[pem]})` request; `research.md` findings 9–10.

## 2026-07-17 — Live `get_run` success exposed an output-schema omission

- **What:** The first repaired all-tool run reached `get_run` success, which the prior validation
  could not exercise because `list_runs` was false-empty.
- **Source:** Live MCP stdio call using the fresh health-check execution id.
- **Expected:** The successful flow result validates against its advertised output schema.
- **Actual:** The flow correctly emitted optional `traceId`, `outcome`, and `errorMessage` fields,
  but the closed schema omitted them and returned JSON-RPC `-32603 invalid_tool_result`.
- **Severity:** significant
- **Action:** fix
- **Evidence:** First `.llm/tmp/mcp-808-live-driver.ts` run; schema regression added to the captured
  Aspire fixture flow test.

## 2026-07-17 — Scoped lint wrapper cannot parse the root workspace with Deno 2.9.3

- **What:** The required lint wrapper selected the intended files but Deno exited before linting.
- **Source:** Final scoped static gate over `packages/mcp` and the CLI MCP composition directory.
- **Expected:** `run-deno-lint.ts` would emit a scoped lint verdict.
- **Actual:** `deno lint` rejected the root wildcard workspace with
  `invalid type: string
  "packages/*", expected struct WorkspaceConfig`; the wrapper correctly
  classified this as a tooling failure with zero lint findings. The same explicit file selections
  pass when supplied a package/standalone config that avoids root workspace discovery.
- **Severity:** minor
- **Action:** accept
- **Evidence:** wrapper exit 1/tooling-failure report; explicit-config lint passes for 59 MCP and 6
  CLI MCP TypeScript files. No source suppression or workspace edit was introduced.

## 2026-07-17 — Round-two doctor assumed a registry layout the generator does not emit

- **What:** External live re-validation found `project/plugin_registry` failing on the canonical
  E2E-green scaffold even after `generated.plugins-check` passed.
- **Source:** Validator report section `Re-validation (post-#808 fixes)` and captured scaffold
  `plugin-smoke-20260717-074108`.
- **Expected:** Doctor derives registry presence from the generator's emitted module contract.
- **Actual:** Doctor required only `.netscript/generated/plugins.ts`; the real generator emitted
  nested `*.registry.ts` and `*-registry.ts` modules for AI and workers.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Captured three-path fixture in `packages/mcp/tests/fixtures/doctor/healthy` and focused
  doctor regression.
