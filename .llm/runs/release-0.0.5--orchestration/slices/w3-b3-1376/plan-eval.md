# PLAN-EVAL: W3-B3 / #1376 / PR #1400

| Field | Value |
| --- | --- |
| Evaluator | Claude · Fable 5 · medium — separate session from the generator (Codex · GPT-5.6 Sol · low) |
| Route | `formal_plan_evaluation`, evaluates=openai → native opposite family |
| Subject | Slice plan on `origin/fix/mcp-execute-command-host-cli@1ee8f5030` (artifacts under `.llm/runs/release-0.0.5--orchestration/slices/w3-b-1376/`), diffed against `origin/main@aa8e151e6` |
| Date | 2026-08-09 |

## Verdict

**FAIL_PLAN** — one load-bearing research claim fails the mandated spot-check and leaves a rework-forcing decision open; everything else in the plan holds.

## Findings (by severity)

### F1 — blocking. Decision 3 rests on a version-equality assertion that does not exist

- Claim under test: plan.md locked decision 3 — "Existing publish-assets generation remains the
  release-equality authority" — and research.md — "publish-assets generation must continue to prove
  CLI/MCP release-version equality."
- Evidence:
  - `.llm/tools/generate-publish-assets.ts` — `generateMcpAssets()` reads
    `packages/mcp/deno.json` (line ~112) and `generateCliAssets()` reads
    `packages/cli/deno.json` (line ~126) **independently**; the file contains no comparison of the
    two versions. Its `--check` mode only verifies each generated file matches its own package
    manifest.
  - `rtk grep -rln "CLI_PACKAGE_VERSION.*MCP_PACKAGE_VERSION|MCP_PACKAGE_VERSION.*CLI_PACKAGE_VERSION" .`
    → matches only in run artifacts and audit docs; **no product or tooling file asserts equality**.
    `.llm/tools/validation/check-netscript-jsr-specifiers.ts` references neither constant.
  - The actual equality mechanism is the workspace-wide release bump:
    `.llm/tools/deps/bump-version.ts:32` ("Apply an exact release version to root, every declared
    workspace member") plus its residue check (`:46`). Equality is an emergent property of that
    process; nothing gates a hand-edited divergence between `packages/mcp/deno.json` and
    `packages/cli/deno.json`.
- Why it blocks: issue #1376's target contract 3 gives exactly two truthful paths for the
  standalone pin — "asserted equal to the CLI version by the existing publish-assets generation,
  **or** explicitly decoupled with a stated policy." The plan claims path one is already satisfied
  by an assertion that does not exist. As planned, S4 would publish a `packages/mcp/README.md`
  claim about a nonexistent gate, or the implementer discovers the gap mid-slice and improvises
  scope (no slice's Files column includes `.llm/tools/generate-publish-assets.ts` or an equality
  test). This is the assumed-shape failure class that produced five of six Wave-2 runtime-gate
  failures — caught here at the cheap end.
- Required change: re-attribute the equality authority to the workspace release bump, then decide
  explicitly — (a) add a cheap equality assertion (named slice + files, e.g. a repo validation
  test asserting `CLI_PACKAGE_VERSION === MCP_PACKAGE_VERSION`, or a check inside
  `generate-publish-assets.ts --check`), or (b) state the decoupling policy the issue permits.
  Whichever is chosen, the README text S4 ships must describe the mechanism that actually exists.

### F2 — minor/process. Run artifacts landed in the wrong slice directory

- Evidence: the brief (`implement.md`, Identity table) assigns
  `.llm/runs/release-0.0.5--orchestration/slices/w3-b3-1376/`; the branch created
  `slices/w3-b-1376/` instead (`git ls-tree origin/fix/mcp-execute-command-host-cli`). The branch's
  `drift.md` records "assigned slice directory ... did not exist" — the assigned directory exists
  on the orchestrator side and holds `implement.md`.
- Required change: consolidate on `w3-b3-1376/` (or record a corrected drift entry naming the
  divergence); one canonical run dir before implementation slices start.

### F3 — minor. S1's decisive RED is a type-check failure, not a behavioral failure; record which is which

- Evidence: pre-fix, `createAgentMcpOptions` (`packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts`)
  accepts no version/identity injection and `CommandExecutionResult`
  (`packages/mcp/src/infrastructure/spawn-command-executor.ts`) carries no identity field — a test
  asserting host identity in the result cannot compile at baseline, so its RED exit is a check
  failure. The receipt RED **is** behavioral at baseline: `execute_command` is bound without
  `withReceipt` (`packages/mcp/cli.ts:195-200`), so `execute_command` → `record_drift` refuses
  (`record-drift-flow.ts:29-42`) with no source change needed to observe it.
- Required change (worklog discipline, not redesign): S1's recorded evidence must label each RED as
  behavioral or compile-time so IMPL-EVAL can verify the identity tests were not merely
  written-then-passed against the new API. The plan's raw-exit-recording requirement stands.

### F4 — minor, safe to defer once stated. Denial-receipt behavior is "may", not a decision

- Evidence: plan.md decision 5 — "A denial may write a failure receipt, but can never write or
  preserve a success receipt." Both branches (write `exitStatus: 1` vs. write nothing) satisfy the
  acceptance rows, which forbid only a success receipt. Note the status-1 branch overwrites a fresh
  legitimate success receipt (e.g. from `doctor`) for the same resource — fails closed, so safe,
  but it silently invalidates evidence the agent just earned.
- Required change: pick one branch in the plan text before S4 lands; a one-line amendment.

## Orchestrator questions

1. **Separability vs #1375** — respected. research.md "Scope boundary" and plan.md deferred scope
   exclude `--docs-root`, `writeHostConfig`, `NETSCRIPT_DOCS_ROOT`, and the docs corpus; the
   `run-agent-mcp.ts` edit is restricted to version/executor injection; risk register carries the
   collision risk with a disclose-the-diff mitigation. Verified against the S0 diff (run artifacts
   only, no source touched).
2. **Version identity, not just spawn** — yes. Decision 1 defines one executor-owned identity
   (mode, CLI version, resolved prefix) shared by `list_commands` and `execute_command`; S3 injects
   `CLI_PACKAGE_VERSION` and removes `version: "current"` (`run-agent-mcp.ts:29`, verified at
   baseline).
3. **Standalone decided** — decided (pinned `jsr:@netscript/cli@MCP_PACKAGE_VERSION`, mode
   `standalone`, command and version visible) and defensible, **except** its supporting equality
   claim is false — F1.
4. **Can the tests fail** — the receipt/`record_drift` REDs fail behaviorally at baseline; the
   mismatched-version identity RED fails only at type-check pre-fix — F3 requires the distinction
   recorded. The denied-command negative and standalone-fallback tests have concrete pre-fix
   failure states (no receipt surface, no identity surface).
5. **`record_drift` honesty** — decision 7 sequences the refusal-text update
   (`diagnosticEvidenceRefusal`, exported on the published surface via `packages/mcp/mod.ts:15`)
   strictly after receipt behavior is proven; acceptance row 7 covers accuracy. Adequate.
6. **Safe, not merely consistent** — decision 8 states the position: policy untouched (the issue's
   own "Not a goal"), safety from default-deny + guaranteed host-binary identity + truthful
   receipts, which removes the named hazard (a different release writing to the project). A stated,
   checkable rationale; accepted.
7. **Acceptance and gates** — all ten live `- [ ]` rows are quoted verbatim in plan.md (compared
   against `gh issue view 1376` on 2026-08-09); each maps to a slice (rows 1-2→S3, 3-4→S2/S3,
   5-7→S4, 8-10→S1/S3/S4); none is observational — row 2 is provable by asserting the resolved
   prefix contains no JSR specifier. Gates named: focused tests, scoped wrappers, `quality:gate`,
   `arch:check` (separately), `doc:lint` over the `packages/mcp` export map, JSR audit,
   `publish:dry-run`, review-thread gate, and the serialized `scaffold.runtime` by token request
   only.

## Plan-Gate checklist

| Box | Result | Evidence |
| --- | --- | --- |
| Research present and current | **FAIL** | `research.md` exists and is baselined at `aa8e151e6`; five of six load-bearing claims verified against the tree (executor default, no override in `run-agent-mcp.ts`, `version: "current"`, unwrapped `list_commands`/`execute_command`, compiled-vs-script detection at `deno-platform.ts:161-182`); the sixth — publish-assets equality authority — fails the spot-check (F1) |
| Decisions locked | FAIL (via F1) | Decisions 1-2, 4-8 locked with rationale; decision 3's rationale rests on the nonexistent assertion |
| Open-decision sweep | **FAIL** | The equality-assertion mechanism is an unflagged open decision that forces rework if deferred (F1); F4 is open but deferred-safe once stated |
| Commit slices | PASS | S0-S5 ordered, 6 < 30, each names files, change, and proving gate (plan.md table) |
| Risk register | PASS | Six risks with mitigations, including recursion, compiled-mode, receipt-authorization, and #1375 collision |
| Gate set selected | PASS | See question 7; matches the framework-wave set the brief requires, runtime gate token-gated |
| Deferred scope explicit | PASS | Policy edits, #1375 surfaces, #1343 E2E, release operations all named |
| jsr-audit (package wave) | PASS (manual evidence) | research.md names the three `@netscript/mcp` exports, the annotation/slow-type risk on extended result/option types, and plans full export-map `doc:lint` + audit + dry-run; no export-map key change |

## Fix list for the repair cycle

1. F1 — re-attribute the equality authority and lock the assertion-or-decoupling choice, with the
   owning slice and files named. (Blocking.)
2. F2 — one canonical slice directory. (Process.)
3. F3 — label behavioral vs compile-time RED in S1's evidence contract. (One sentence.)
4. F4 — replace "may write a failure receipt" with the chosen behavior. (One line.)

One `FAIL_PLAN` cycle consumed; one remains before escalation.

## Cycle 2

| Field | Value |
| --- | --- |
| Evaluator | Claude · Fable 5 · medium — fresh separate session, same route as cycle 1 |
| Subject | Repair commit `46016bc4c`, head `e833c5be3` (verdict-preservation commit), diffed against `1ee8f5030` and `origin/main@aa8e151e6` |
| Date | 2026-08-09 |

### Verdict

**PASS** — all four cycle-1 findings are repaired, the repairs verify against the tree, and no new plan defect was introduced.

### Disposition

| Finding | Disposition | Evidence |
| --- | --- | --- |
| F1 equality-authority claim | **FIXED** | See breakdown below — all four parts verified |
| F2 slice directory | **FIXED** | `git diff 1ee8f5030 46016bc4c` renames every artifact `w3-b-1376/` → `w3-b3-1376/`; old dir gone from the branch tree (`git ls-tree` shows only `w3-b3-1376` and the unrelated `w3-b-1102-1197`); `drift.md` entry "slice path corrected after PLAN-EVAL" explicitly withdraws the earlier absence claim |
| F3 RED-class labels | **FIXED** | Labels present in S1 row and "Baseline proof strategy", and **correct** against the baseline: identity RED is compile-time (no identity fields exist on `CommandExecutionResult` / `createAgentMcpOptions` at `aa8e151e6`); execute→drift RED is behavioral (`packages/mcp/cli.ts:195-200` binds `execute_command` unwrapped; `record-drift-flow.ts:29-42` refuses without a receipt — composable from existing exported flows with no new types); standalone fallback correctly labeled baseline characterization (`DEFAULT_CLI_COMMAND` already pinned, the assertion passes pre-fix and is not RED) |
| F4 denial-receipt "may" | **FIXED** | Decision 5 now reads "always write status `1` for the named resource, overwriting any earlier success"; S4 row carries "denial always overwrites with failure" with `drift-evidence_test.ts` named |

### F1 breakdown

1. **False claim gone from both files.** `plan.md` decision 3 and `research.md` "Standalone policy" both rewritten; `git grep` across the branch's run dir finds the old wording only in historical records of the cycle-1 finding (`plan-eval.md`, `worklog.md` evidence row, `pr-body.md` note), which is correct preservation, not residue.
2. **New attribution is true.** Verified: `.llm/tools/deps/bump-version.ts:32` applies one exact release version to root and every declared workspace member; `.llm/tools/release/publish-readiness.ts:123` runs `lockstep-residue` → `auditLockstepAndResidue` (`:226-252`), which fails any `deno.json`/`scaffold.plugin.json` manifest whose `version` differs from the release version and any internal JSR specifier retaining another version (test coverage at `publish-readiness_test.ts:61`). Critically, `research.md` frames this as "contextual evidence, not a runtime or generation equality guarantee" — the exact distinction cycle 1 required; this is not a second false attribution.
3. **Decoupling policy is publishable truthfully.** Decision 3: standalone spawns `jsr:@netscript/cli@${MCP_PACKAGE_VERSION}`, reports mode `standalone` plus that command and version, rationale stated ("absent a host, the MCP package selects the CLI version it was released to drive"). A README reader can determine what a standalone server will spawn and why. This is the second of the two paths #1376's target contract 3 permits.
4. **Ownership named.** S2 owns `packages/mcp/src/infrastructure/spawn-command-executor.ts` + `packages/mcp/tests/command_adapters_test.ts`; S4 owns `packages/mcp/README.md`. S1/S2/S4 Files columns are now concrete paths, closing the improvise-mid-slice gap.

### F4 consistency check (as directed)

The unconditional overwrite is consistent with existing receipt semantics: the current `withReceipt` wrapper (`packages/mcp/cli.ts:236-264`) already writes `exitStatus: succeeded ? 0 : 1` unconditionally per resource, so every wrapped flow today overwrites a prior success on failure — the receipt store is latest-diagnostic-state, one receipt per resource. A denial overwriting a fresh `doctor` success forces the agent to re-run a diagnostic before `record_drift`; that fails closed under the TTL/refusal gate (`exitStatus !== 0` → refusal) and cannot mask a success in the only sense the system consumes one, because `record_drift` is defined over the freshest receipt, not receipt history. No change required.

### New findings

None. One observation, not a finding: S1's committed compile-time RED will fail branch-wide type-check between the S1 and S2 commits; this is inherent to the brief's recorded-RED-first mandate, the S1 proving gate is the recorded targeted failure, and S2 immediately restores compilation.

### Verdict record

Cycle 1: `FAIL_PLAN`. Cycle 2: `PASS`. Implementation may begin; the S1 evidence contract (raw exits and failure reasons per RED class, labeled) is binding for IMPL-EVAL.
