# PLAN-EVAL: agent init tooling and offline docs bundles

**Run:** `feat-1024-agent-tooling-bundle--agent-init`
**Branch:** `feat/1024-agent-tooling-bundle`
**PR:** #1092
**Evaluator:** OpenHands / OpenRouter / `qwen/qwen3.7-max` / high effort
**Phase:** PLAN-EVAL
**Verdict:** `PASS`

## Plan-Gate Checklist

- [x] **Research present and current.** `research.md` exists and is explicitly re-baselined from
      `ab0fa13fe` to `e5bae2858` to consume merged PR #1079's task router. The re-baseline is
      documented with the merge commit, the reason (avoid re-authoring #1068's router), and the
      clean-branch rebase evidence. Baseline gates (CLI doc lint 0 diagnostics, agent-init tests
      9/9) are recorded.
- [x] **Decisions locked.** Ten decisions (D1–D10) are stated with rationales. Each names the
      locked choice, the alternative considered, and the reason for rejection. Key decisions:
      eight-tool manifest boundary (D1), clone-independent public-CLI E2E (D3), optional docs
      corpus (D6), release-built prose + install-time API docs (D7/D8), fail-before-writes
      semantics (D8).
- [x] **Open-decision sweep.** Every still-open decision is listed and marked resolved or safe to
      defer. The one deferred item (#1072's drift-entry gate) is explicitly scoped out with a stop
      condition. No must-resolve-now decision remains.
- [x] **Commit slices.** Two slices, ordered, < 30 files each. Slice 1 proves tool installation,
      symptom routing, E2E independence, and host-port enforcement. Slice 2 proves the docs bundle,
      version matching, mismatch semantics, and reference docs. Each names what it proves, the gate
      that proves it, and the files it touches.
- [x] **Risk register.** Eight risks are listed with mitigations: embedded docs bloat, absent
      support files, monorepo E2E assumption, silent docs mismatch, missing executable, fixture
      mutation, concurrent #1072 overlap, and host resource contention.
- [x] **Gate set selected.** Archetype 6 + docs overlay gates are selected from the archetype-gate
      matrix. Fitness gates F-1/F-16, F-3/F-CLI-3..5, F-5/F-7/F-CLI-8, F-6/F-CLI-9..10,
      F-9/AP-19, F-10/AP-18, F-15/F-CLI-15..16, F-CLI-21..31, and the docs overlay are named with
      expected evidence.
- [x] **Deferred scope explicit.** Three deferred items are listed: #1072's drift-entry doctor/otel
      gate, MCP wrappers for installed scripts, and publishing/release cutting. Each is scoped out
      with a reason.
- [x] **jsr-audit (package/plugin waves).** The `jsr-audit` skill's publishability rubric has been
      applied. The surface scan covers `packages/cli/deno.json` exports (three entrypoints) and
      `deno doc packages/cli/mod.ts`. Planned surface risk is named: `--with-docs` is a command
      option, not a new export, but new internal symbols need JSDoc. Publish risk is named:
      compressed embedded prose and generated tool text must be TypeScript constants, not runtime
      filesystem reads.

## Challenge Responses

### 1. Project lock/config evidence for exact installed `@netscript/*` versions (D8)

**Plan claim:** "Generate API text during init from exact `@netscript/*` versions resolved from
the project lock/config and a same-release embedded export manifest."

**Evaluator finding:** The plan acknowledges the evidence source (`deno.lock` and `deno.json`
imports) and the failure mode (missing lock/package evidence aborts before writes). The exact
parsing mechanism is not specified, but the Semantic Test Strategy says "Feed the docs installer
fake locked packages/export maps and a fake doc runner; assert every subpath command, provenance
manifest, zero writes on mismatch/failure." This implies the mechanism will be injectable and
testable.

**Verdict:** Not a blocker. The plan names the evidence source, the failure mode, and the test
strategy. The exact parsing is an implementation detail that IMPL-EVAL will verify. **Advisory
note:** at IMPL-EVAL, verify that the docs installer handles three cases: (a) `deno.lock` exists
with exact `@netscript/*` versions, (b) `deno.lock` exists but `@netscript/*` are workspace
imports (file://), and (c) `deno.lock` does not exist yet.

### 2. Strict same-release docs/CLI matching and fail-before-partial-writes (D8)

**Plan claim:** "Abort before writes if the embedded prose version differs from the running CLI,
installed NetScript versions disagree, package evidence is absent, or any `deno doc` command
throws/exits non-zero."

**Evaluator finding:** The plan defines three version authorities: embedded prose version (from
the release-built bundle), running CLI version (`NETSCRIPT_RELEASE_VERSION`), and installed
NetScript versions (from lock/config). The plan commits to strict matching with rationale: #1061's
trap section says "A wrong bundle is worse than no bundle." The Drift Watch acknowledges the risk
that "installed package versions are mixed in a supported project and the strict same-release rule
would reject a legitimate configuration" but the plan accepts this as a design choice.

**Verdict:** Not a blocker. The plan's strict matching is a deliberate design choice with
rationale. The fail-before-writes semantics are correctly specified: all validation completes
before any `.netscript/docs` write, so a late `deno doc` failure cannot leave a plausible partial
bundle. The test strategy includes "matching/mismatching versions" fixtures.

### 3. Clone-independent E2E with host-port validation and missing-binary handling (D3/D4/D5)

**Plan claim:** D3 says "remove agentic teardown imports, infer the project root from its
installed path, select local maintainer CLI only when it exists, otherwise use the exact release
JSR CLI." D4 says "Invoke the shipped host-port validator as a critical semantic E2E step
immediately after scaffold generation and before runtime start." D5 says "Keep subprocess launch
errors structured and add a deno-only fixture with a deliberately absent Aspire executable."

**Evaluator finding:** The current E2E tool imports `probeAppHosts` and `registerAppHost` from
`../agentic/teardown/probes.ts` and `../agentic/teardown/run-resources.ts`. The plan says to
remove these imports and instead call `check-aspire-host-ports.ts` as a subprocess. The plan's
Semantic Test Strategy says "Exercise the E2E launch path with a guaranteed-missing Aspire
executable and assert a structured failed step rather than an uncaught exception." The current E2E
code already catches `Deno.Command` errors and reports them structurally; the plan preserves this
behavior.

**Verdict:** Not a blocker. The plan specifies the replacement mechanism (subprocess call to the
shipped validator) and the test strategy (missing-binary fixture). The exact error handling
structure is an implementation detail that IMPL-EVAL will verify. **Advisory note:** at IMPL-EVAL,
verify that the refactored E2E tool (a) does not import from `../agentic/teardown/*`, (b) infers
the project root from its installed path (not process CWD), and (c) selects the exact release JSR
CLI when no local maintainer binary exists.

### 4. Generated path-closure and no-fixture-mutation tests covering every installed reference (D1/D6)

**Plan claim:** Semantic Test Strategy says "Build a temp project through the real `initAgent` use
case; compare the checked-in consumer manifest with installed files and parse every generated
local path reference." Also: "Run installed tool `--help`/dry-run entrypoints from a different
process CWD and assert outputs remain under the fixture project." Also: "Tests mutate checked-in
fixtures or process CWD" is listed as a risk with mitigation "Use per-test temp projects; resolve
outputs from explicit project root; compare checked-in fixture status before/after."

**Evaluator finding:** The plan's Constants section lists `CONSUMER_AGENT_TOOL_PATHS` (eight
manifest-advertised entrypoints), `AGENT_TOOL_INSTALL_ROOT` (`.llm/tools`), and
`AGENT_DOCS_INSTALL_ROOT` (`.netscript/docs`). The test strategy explicitly mentions parsing
"every generated local path reference" and asserting outputs remain under the fixture project.
The risk register names fixture mutation and CWD leakage with mitigations.

**Verdict:** Not a blocker. The plan's test strategy is comprehensive and will be proven by
fixtures at IMPL-EVAL. The path-closure test will verify that every installed tool and docs path
resolves from the fixture project root, not process CWD. The no-mutation test will verify that
checked-in fixtures are unchanged after test runs.

### 5. Two commit slices independently reviewable with adequate gates

**Plan claim:** Two slices, ordered, < 30 files each. Slice 1 proves tool installation, symptom
routing, E2E independence, and host-port enforcement. Slice 2 proves the docs bundle, version
matching, mismatch semantics, and reference docs.

**Evaluator finding:** Slice 1's gate is "focused agent-init/tool/E2E tests; scoped
check/lint/fmt; `quality:scan`; `arch:check`; consumer path-closure fixture." Slice 2's gate is
"docs builder/installer tests including pre-fix and missing-binary paths; fixture install/path
closure; docs gates; CLI doc lint/publish dry-run; full required root gates." Each slice names
the files it touches. Slice 1 can be reviewed and merged without Slice 2. Slice 2 depends on
Slice 1's tool manifest but is otherwise independent.

**Verdict:** Not a blocker. The slices are independently reviewable and have adequate gates. Each
slice proves a distinct capability (tool bundle vs. docs bundle) and can be validated in
isolation.

## Advisory Notes

1. **Exact lock/config parsing mechanism (D8):** The plan does not specify whether the docs
   installer reads `deno.lock`'s "version" field, `deno.json` imports, or both. At IMPL-EVAL,
   verify that the installer handles workspace imports (file://) and missing `deno.lock`
   gracefully.

2. **Error handling structure (D3/D5):** The plan says "keep subprocess launch errors structured"
   but does not specify the exact error shape. At IMPL-EVAL, verify that the refactored E2E tool
   catches `Deno.Command` throws and reports them as structured failed steps, not uncaught
   exceptions.

3. **Host-port validator invocation (D4):** The plan says the E2E will "invoke the shipped
   host-port validator" but does not specify whether this is a subprocess call or an import. At
   IMPL-EVAL, verify that the validator is called as a subprocess (not imported) to maintain the
   consumer tool boundary.

4. **Docs bundle size (D7/D9):** The plan says the prose bundle is "several MB" and must be
   opt-in. At IMPL-EVAL, verify that the generated TypeScript constant (compressed prose + API
   text) does not push CLI publish limits or introduce JSR slow-type diagnostics. The publish
   dry-run gate will prove this.

5. **Task router presence (D7/D9):** The plan consumes merged PR #1079's task router from the
   site-generated `llms.txt`. At IMPL-EVAL, verify that the built site bundle includes the router
   and that the docs installer asserts its presence before writing.

## Conclusion

The plan is complete and sound. All ten Plan-Gate checklist boxes are satisfied. The five
challenges are either advisory notes (implementation details to verify at IMPL-EVAL) or design
choices with rationale. No unchecked box remains. Implementation may begin.

**Verdict:** `PASS`

OPENHANDS_VERDICT: PASS
