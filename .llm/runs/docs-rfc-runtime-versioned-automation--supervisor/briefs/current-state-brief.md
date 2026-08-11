use harness

# Slice brief — Current-state capability matrix: runtime-versioned workers/tasks/triggers

## SKILL

Load and honor: `netscript-harness`, `netscript-doctrine`, `netscript-tools`,
`netscript-deno-toolchain` (use `deno doc` / `deno doc --filter` before broad source reads),
`netscript-cli`. Research slice inside
`.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/`.

## Identity and hard constraints

- Codex GPT-5.6 Sol research sub-agent for a Claude Fable 5 RFC supervisor.
- Worktree: `/home/codex/repos/ns-rfc-runtime-versioned-automation`, branch
  `docs/rfc-runtime-versioned-automation` (== origin/main @ 2256a67bf). **Do not commit, push, or
  modify tracked files.** Writes allowed only under
  `.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/evidence/`.
- Bounded disposable proofs ARE allowed and wanted: `deno check` probes, `deno doc`, targeted
  `deno test` of existing suites, CLI invocations against throwaway scaffolds under
  `.llm/tmp/rfc-probes/` (create, use, then note; do not leave services running). Do NOT run the
  expensive `scaffold.runtime` E2E; do not start Aspire or containers. Do not run
  `deno cache --reload` or touch lock files.
- Prefix read-heavy git/grep/ls with `rtk`.
- A prior report exists at `evidence/legacy-capability-map.md` (legacy `netscript-start`
  archaeology). Read its executive summary first; your job is the CURRENT repo side of the same
  story.

## Mission

Build the current-state half of a legacy → current → gap matrix for runtime-versioned
workers/tasks/triggers. **Do not infer support from exported types alone** — for each high-value
claim, either point at a test/E2E that proves it or run a bounded disposable proof yourself.
Tag every capability `PROVEN` (test/E2E/probe evidence), `IMPLEMENTED-UNPROVEN` (code path
complete, nothing exercises it), `PARTIAL`, or `ABSENT`.

Context you must know: the owner has authorized a **complete redesign with no
backward-compatibility layer** — this matrix decides what ideas/seams are worth KEEPING and what
gets inventoried for REMOVAL, not how to migrate. So for every surface also record a
keep/extract-idea/delete disposition hint, and be precise about which types/commands/files are
exported-but-unused (they are removal candidates).

## Parent hypotheses to verify or refute (each needs a verdict + evidence)

H1. The versioned read model (`runtime-config` loader/watcher) and the CLI versioned store
    (`runtime-config-store-port.ts`, `deno-runtime-config-store.ts` temp+rename activation,
    `manage-runtime-overrides.ts`) both work, but **no production worker/trigger composition
    consumes the snapshots** — `loadRuntimeConfig`/`watchRuntimeConfig`/`getRuntimeTask`/
    `getTriggerOverride` are used only by the package's own docs/tests. Build the real call graph
    (exclude generated/embedded assets like `agent-docs.generated.ts`).
H2. Two drifting task schemas: permissive `RuntimeTask` (runtime-config domain, 7 runtimes) vs
    rich `TaskDefinition` (plugin-workers-core domain). The executor executes `TaskDefinition`;
    nothing feeds `RuntimeConfig.tasks` into it; `NETSCRIPT_TASKS_DIR` remaps entrypoint paths
    rather than loading additive versioned definitions (`local-runtime-backend.ts::runTask`,
    `plugins/workers/worker/job-execution.ts`).
H3. Triggers: `TriggerOverride {id, enabled?, paths?}` is override-only (no additive runtime
    trigger definitions); the trigger runtime processor (KV idempotency, DLQ, deferred replay,
    OTel) loads generated TS registries (`project-trigger-registry.ts`) and does NOT compose
    versioned overrides from runtime-config.
H4. `generate runtime-schemas` plans/writes real JSON Schema objects and rejects duplicate topic
    owners, but on this baseline `plugin-registry.ts::resolveRegisteredPluginSnapshot` collapses
    declared `runtimeConfigTopics` to `runtimeConfig: { schemas: [] }` — so output is empty in
    practice. (PR #1444 fixes configured-module loading; state what baseline behavior is, do not
    re-derive #1444.)
H5. Competing/duplicate CLI surfaces: generic `netscript config override` (real versioned store)
    vs workers-plugin `config-edit`/`config-publish` writing `.netscript/runtime/<topic>.json`
    without versioning/activation — unfinished duplicate DX.
H6. The versioned store has: no optimistic concurrency/revision preconditions, no author/approval
    metadata, no multi-instance propagation, local-fs atomicity only. Also check path-traversal
    handling on topic/version inputs and partial multi-topic promotion consistency.

## Behavioral proofs (bounded, disposable, highest value)

Under `.llm/tmp/rfc-probes/` (throwaway scaffold or minimal fixture dirs; record commands + exit
codes; leave nothing running):

P1. Publish → activate → rollback via the real store adapter; verify temp+rename atomicity and
    what a concurrent second writer does (best-effort observation).
P2. Watcher reload: start a tiny consumer using `watchRuntimeConfig`, flip `current`, observe
    callback; malformed version doc → observe silent-empty behavior.
P3. `generate runtime-schemas` on a minimal consumer fixture: capture real output (or its
    absence/emptiness) on baseline.
P4. Additive task attempt: put a task into the versioned `tasks` topic and demonstrate whether ANY
    existing execution path picks it up (expected: none — prove the disconnect).
P5. Executor polyglot smoke: run one trivial deno + one shell/cmd task through
    `MultiRuntimeTaskExecutor` directly (unit-level, no services) to confirm the engine executes.

### Required coverage

1. `packages/runtime-config` — types, loaders, accessors, `current` pointer semantics, version
   document format, the watcher (`src/application/watcher.ts`): what triggers reload, atomicity,
   error handling on malformed documents, who actually calls `loadRuntimeConfig`/the watcher in
   apps/plugins/scaffold output.
2. `netscript generate runtime-schemas` — implementation path, what it emits where, and its real
   behavior on a clean consumer (note: PR #1444 is fixing the configured-module loader; document
   the on-main behavior and mark the known #1445 breakage rather than re-deriving it).
3. Workers: the workers CLI surface, `MultiRuntimeTaskExecutor`, runtime adapters (which runtimes
   actually execute: deno/node/python/shell/...?), permission model per task, polyglot execution
   reality. Where do runtime task definitions come from at execution time (versioned tree? static
   registry?).
4. Triggers: runtime processor, stores, streams integration, idempotency/dead-letter behavior,
   how trigger definitions are loaded/reloaded.
5. Plugin scaffold output: what `plugin install workers|triggers` actually emits today —
   `workers/runtime.ts`, `triggers/runtime.ts`, `workers/runtime/**` config trees (`current`
   pointer, `schema.json`, versioned JSON docs), and whether anything consumes them at runtime.
6. Aspire wiring: how workers/triggers services are declared, env plumbing for runtime config dirs,
   deployment/runtime reload behavior (does a deployed stack see pointer changes without restart?).
7. Telemetry/management: any OTel spans/events/metrics for task/trigger execution; any management
   API or UI endpoints touching runtime config; execution-history persistence.
8. Test/docs/E2E truth: which of the above are covered by tests or `e2e:cli` suites (name them),
   what the docs claim vs what is proven. List every claim that is documented but unproven.

## Output contract

- Full report → `evidence/current-state-matrix.md`. Start with a ≤25-line executive summary.
- Include a `## Legacy → current mapping` table: for each legacy capability in the legacy report's
  summary, state current equivalent, status tag, and gap.
- Cite `path:line` for load-bearing claims; record every probe command + exit code in a
  `## Probe log` section.
- Final section `## Claims the supervisor should re-verify` (5 weakest inferences).
- Reply exactly `DONE` on the final line, or `BLOCKED: <reason>`.
