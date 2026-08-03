# Drift Log: plugin wiring and doctor truth

## 2026-08-03 — owner-launched supervisor and PR boundary

- **What:** The active supervisor/plan generator is Codex, and it must not open/edit/comment on the
  PR.
- **Source:** Owner brief and current session identity.
- **Expected:** Canonical planning primary is Fable; normal harness commit trail includes PR
  comments.
- **Actual:** Owner directly launched Codex and retained all PR authority in an external supervisor.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; owner deliverable.

## 2026-08-03 — existing doctor work exceeds unchecked issue state

- **What:** Main already contains named Zod field reporting and a real failing plugin-owned workers
  check.
- **Source:** `doctor-plugin-command_test.ts` and `doctor-plugin-use-case.ts`.
- **Expected:** The owner brief listed named config failures among remaining work.
- **Actual:** The behavior has focused unit evidence on main; only live AppHost resource truth
  remains implementation work unless broader tests disprove it.
- **Severity:** minor
- **Action:** accept and verify; do not re-fix
- **Evidence:** tests named in `research.md` findings 5–6.

## 2026-08-03 — canonical formal evaluator credential absent

- **What:** The required separate-session PLAN-EVAL could not launch.
- **Source:**
  `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.7-max --effort high --worktree /home/codex/repos/ns004-plugins`.
- **Expected:** Live Qwen evaluator route with tools/reasoning/streaming capability.
- **Actual:** `status: blocked`, `credential: absent`, diagnostic `auth_required`; no
  process/session.
- **Severity:** significant
- **Action:** waived by supervisor after independent canary reproduction.
- **Evidence:** provider-canary JSON captured in the active session and summarized in `worklog.md`.

## 2026-08-03 — dependency declarations are the wiring source

- **What:** Slice 1 will consume existing `officialSource.dependencies` rather than duplicate
  `streams` into `pluginReferences`, and will cover workers as well as sagas/triggers.
- **Source:** Supervisor plan correction plus all official manifests.
- **Expected:** Initial D3 proposed new manifest `pluginReferences` for sagas/triggers and deferred
  workers.
- **Actual:** All three producers already declare `dependencies: ["streams"]`; install wiring is the
  missing consumer.
- **Severity:** significant
- **Action:** fix plan and implementation before source changes.
- **Evidence:** corrected `research.md`, `plan.md` D3, and `worklog.md` decision.

## 2026-08-03 — fail-fast producer removes an exported option

- **What:** Slice 1 removes the exported `ServiceStreamProducerOptions.assertResolvable` member
  from `@netscript/plugin-streams-core`.
- **Source:** Slice 1 implementation review.
- **Expected:** The initial surface scan described stricter constructor semantics without naming a
  public type change.
- **Actual:** Keeping `assertResolvable: false` would expose an option that cannot defer discovery
  after `DurableStreamProducer` moved required URL resolution into construction. The member is
  intentionally removed for 0.0.4, and both streams documentation pages now state the fail-fast
  contract and the install plus `netscript service generate` remedy.
- **Severity:** significant
- **Action:** accept as an intentional 0.0.4 breaking change and declare it in release/PR notes.
- **Evidence:** `create-service-stream-producer.ts`, its focused test, and streams documentation.

## 2026-08-03 — local-path doctor metadata trips the userland source-leak assertion

- **What:** The all-four no-samples userland E2E completed every install successfully, then its
  generic content scan rejected absolute `file:` doctor entrypoints persisted in workers/sagas
  `scaffold.plugin.json`.
- **Source:** `plugin-smoke-20260803-092131.log`.
- **Expected:** The suite's final assertion accepts the intentionally local-path-backed install
  while rejecting copied framework source and sample artifacts.
- **Actual:** Sample artifacts were absent and all four commands received `--no-samples`, but the
  local doctor module locator necessarily names the checkout used by this development-mode suite.
- **Severity:** minor
- **Action:** record as a 0.0.5 candidate to separate local development provenance from portable
  consumer metadata; do not expand the residual acceptance-test slice.
- **Evidence:** four passed scaffold gates and the final assertion's two manifest-only findings.

## 2026-08-03 — reconciliation stabilizes generated resource ordering

- **What:** Reconciliation sorts the `Plugins` and `BackgroundProcessors` records, which changes the
  order of resource blocks emitted into generated Aspire helpers for existing projects.
- **Source:** Slice 1 deterministic appsettings contract and the `runtime.flow-b-fixture` CI gate.
- **Expected:** Existing insertion order placed workers before another resource, and an E2E fixture
  assumed every workers block had a following marker.
- **Actual:** Stable alphabetical records can place workers last. The fixture now treats end-of-file
  as the valid end of a final resource block while still failing when the workers marker is absent.
- **Severity:** minor
- **Action:** accept as an intentional visible generated-artifact change; include stable ordering in
  PR/release notes.
- **Evidence:** reconciler permutation test and `scaffold.runtime` `runtime.flow-b-fixture` gate.
