use harness

# Slice: scaffold agent surface (#1071, #1072, #1073, #1024, #1061)

Worktree: `/home/codex/repos/ns004-scaffold` · branch `feat/1071-scaffold-agent-surface`
Base: `origin/main` @ `4634afe56` (already rebased — do NOT rebase again).

## SKILL

Load, in order: `.agents/skills/netscript-harness`, `.agents/skills/netscript-cli`,
`.agents/skills/deno-fresh`, `.agents/skills/netscript-tools`, `.agents/skills/rtk`.

## Non-negotiables

- Every `gh` call passes `--repo rickylabs/netscript`. You do NOT open or edit PRs — the supervisor
  owns the PR. You commit and push only.
- **Verify the artefact, never the exit code.** Never pipe a gate through `tail`/`head` and read the
  pipe's status. Read the actual output.
- A new `// deno-lint-ignore`, `@ts-ignore`, `as unknown as`, or `as any` added to green a gate is a
  review-blocking finding. Do not add them.
- `deno task gen:assets-barrel` regenerates `packages/cli/src/kernel/assets/*.generated.ts` and
  `skills.generated.ts`. `deno task check:assets-barrel` is a gate — if you change anything under
  `skills/` or add embedded assets, you MUST rerun `gen:assets-barrel` and commit the regenerated
  file, or CI goes red.
- Deno refuses dependencies younger than ~24h: pass `--minimum-dependency-age=0` where needed.
- Commit per numbered slice below, push after each, and append the commit hash + the gate output you
  actually read to `.llm/runs/release-0.0.4--orchestration/slices/scaffold/worklog.md` in the
  **orchestrator** repo at `/home/codex/repos/ns-004` (that path is outside your worktree; write to
  it directly, do not commit it).
- Do NOT touch `llms.txt` or `docs/` site content — a concurrent slice owns #1068.
- Do NOT run `deno task e2e:cli` — it is expensive and the supervisor runs it once at
  merge-readiness.

## Map of the code you will touch (already surveyed — trust this)

- App scaffold writer: `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts`.
  It creates `apps/<app>/` and writes every route/component. `options.includeExampleService`,
  `options.serviceName`, `options.appName`, `options.dbEngine` are available there.
  The example-service files are written by `write-example-service-app-files.ts`.
- App template assets are loaded via
  `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts` and live under
  `packages/cli/src/kernel/templates/…` (embedded through `embedded.generated.ts`).
- `ui:add`: `packages/cli/src/public/features/ui/add/add-ui-command.ts`; page/island scaffolders in
  `packages/cli/src/kernel/application/ui/web-scaffold.ts`.
- `agent init`: `packages/cli/src/public/features/agent/init/init-agent.ts`. It writes `.mcp.json`,
  `.claude/skills/**` from `EMBEDDED_SKILL_FILES`, and upserts a marked section in the project root
  `AGENTS.md` (`AGENTS_SECTION`, markers `<!-- netscript-agent:start/end -->`).
  Input type: `init-agent-input.ts`; command: `init-agent-command.ts`; tests: `init-agent_test.ts`.
- Skill bundle source of truth: `skills/` at repo root (`help.md`, `manifest.json`, `netscript/`,
  `netscript-build/`, `netscript-operate/`, `aspire/`, `deno/`).
- MCP: `packages/mcp/`. Tool names `packages/mcp/src/domain/tool-types.ts` (`TOOL_NAMES`), schemas
  `src/domain/tool-contracts.ts`, registry `src/application/tool-registry.ts`, flows
  `src/application/flows/`, server `src/application/runner/mcp-server.ts`.
  **`initialize` currently returns no `instructions` field** — that is your unskippable announcement
  channel for #1072.
- MCP server is launched by the CLI: `packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts`.

---

## Slice 1 — #1071 + #1073: generated app-scoped conventions (ONE commit sequence)

These two issues author the same file. Do them together.

**Emit two files into `apps/<app>/` from `write-app-files.ts`:**

1. `apps/<app>/AGENTS.md` — dashboard conventions. Use the drafted body in issue #1071 as a starting
   point, not a paste. It must:
   - name the canonical local examples by path,
   - state the default architecture as numbered steps,
   - at the "do not hand-write Button/Input/Card/Badge equivalents" point, **name
     `netscript ui:add page <path> --island` / `ui:add island <Name> --query` / `ui:add data-table`
     and say what each produces** (#1073 acceptance box 1),
   - state the copy-vs-delete distinction (architecture-to-copy vs sample-data-to-delete).
2. `apps/<app>/WEB-LAYER.md` — a one-screen architecture path
   `contract → createQueryFactories → definePage layers → QueryIsland/useMutation → live stream`,
   and an explicit "copy this architecture / delete this sample data" section.

**The correctness trap you must design against.** These files name paths. The set of paths that
exist depends on `options.includeExampleService`, `options.serviceName` and `options.dbEngine`.
A conventions file naming a file that does not exist is worse than none. So:

- Generate the path list **from the same data the writer uses**, not from a hardcoded string. The
  cleanest shape: a pure module (e.g.
  `packages/cli/src/kernel/templates/app/agent-conventions.ts`) exporting
  `buildAppAgentsMarkdown(input)` / `buildWebLayerMarkdown(input)` **plus**
  `appConventionsReferencedPaths(input): readonly string[]` derived from one internal source of
  truth, so the prose and the assertable path list cannot drift apart.
- When `includeExampleService` is false, the service-example paths must be **absent from the prose**,
  not merely absent from disk.

**Also mark the example itself (#1071 acceptance box 4).** The generated example-service route and
its island(s) must carry a short header comment (or a `README.md` in the example directory) saying
which parts are the architecture to copy and which are sample data to delete. Cheapest correct
option: write `apps/<app>/routes/examples/<service>/README.md` from
`write-example-service-app-files.ts`.

**The fixture test (#1071 acceptance box 3) — this is the load-bearing part.**
Add a CLI fixture test that runs a real scaffold into a temp dir and asserts:
- both files exist,
- **every path named in them resolves on disk**. Extract paths by parsing the emitted Markdown
  (backticked tokens that look like paths), not by re-reading the generator's own list — a test that
  asserts the generator against itself proves nothing. Resolve each relative to `apps/<app>/`.
  Route-style references like `/design/composition` are URLs, not files: handle them explicitly by
  mapping to the route file that serves them and asserting that file exists.
- assert the same for the **no-example-service** variant (`--no-example-service` or the equivalent
  option), proving the conditional prose is correct.
- assert `ui:add` is named in the emitted `AGENTS.md`.

Follow the existing fixture-test conventions in `packages/cli/` — find a neighbouring scaffold test
and match its harness rather than inventing one.

**#1073 second box: `ui:add --help`.** Rewrite the command `.description()` and per-flag help so
running `netscript ui:add --help` explains the **page + island + query-loader triad** and when to use
it, rather than listing flags. Add a test asserting the help text names all three parts of the triad.

Gates for this slice: `deno task check`, `deno task test` (or scoped), scoped lint/fmt wrappers,
`deno task quality:scan`, `deno task arch:check`.

Commit: `feat(cli): generate app-scoped AGENTS.md and WEB-LAYER.md naming canonical examples`.

---

## Slice 2 — #1072: make the agent harness gate, not suggest

Three acceptance boxes are in scope. The fourth ("a follow-up agent run shows non-zero MCP
diagnostic tool usage") is **not achievable inside this PR** — do not fake it, do not tick it, and do
not build anything that pretends to measure it. Report that in your worklog.

**Box 1 — a drift/defect entry cannot be recorded without evidence of a doctor or otel pass.**

Build a real gate, not a banner:

- Add a CLI command under the `agent` group, e.g. `netscript agent drift record`, which appends a
  drift/defect entry to a project-local log (e.g. `.netscript/agent/drift.md` or `drift.jsonl`).
- It **refuses** (non-zero exit, actionable message naming the exact commands to run) unless a
  diagnostic **evidence receipt** exists for the named resource and is not stale.
- Receipts are written by the CLI when a diagnostic actually runs: `netscript plugin doctor` and the
  MCP `doctor` / telemetry tools should write a receipt (resource, command, timestamp, exit status)
  under `.netscript/agent/diagnostics/`. Keep the receipt writer a single small port so both the CLI
  path and the MCP path record through it.
- Expose the same `record_drift` capability over MCP **with the same gate**, so an agent cannot route
  around the CLI by using the tool surface. Refusal must be identical in both paths.
- Test both: refusal with no receipt, refusal with a stale receipt, acceptance with a fresh receipt,
  and that a receipt is actually written by a doctor run.

Keep it small and honest. If a design decision is forced (receipt TTL, receipt location), pick one,
state it in the generated docs, and record the decision in the worklog.

**Box 2 — the installed surface is announced where the driving agent must encounter it.**

- Return an `instructions` string from MCP `initialize` in
  `packages/mcp/src/application/runner/mcp-server.ts`. MCP hosts inject this into the agent's context
  automatically — this is the channel the agent cannot skip. It must name the diagnostic tools, when
  each applies, the `help.md` symptom lookup, and the drift gate.
- Also strengthen the existing root-`AGENTS.md` `AGENTS_SECTION` in `init-agent.ts` to name the same
  three things and the drift gate.
- Test the `instructions` field is present and non-empty and names the diagnostic tools.

**Box 3 — `help.md` symptom entries reachable from the MCP tool surface.**

- Make `help.md`'s symptom sections queryable through MCP. Prefer indexing the installed
  `.claude/skills/help.md` into the existing docs corpus so `search_docs` / `list_docs` / `get_doc`
  reach it, **or** add one dedicated symptom-lookup tool if the corpus shape does not fit. If you add
  a tool, register it properly in `TOOL_NAMES`, `TOOL_INPUT_SCHEMAS`, `TOOL_OUTPUT_SCHEMAS`, `kinds`
  and `summaries` — a half-registered tool is a review-blocking finding.
- Test: a symptom query ("Healthy is not proof", "hang", "dangling AppHost") returns the matching
  help.md section through the MCP surface.

Commit: `feat(cli,mcp): gate drift entries on diagnostic evidence and announce the agent surface`.

---

## Slice 3 — #1024: ship the agent-grade `.llm/tools` subset with `agent init`

Six acceptance boxes. Read the issue body in full — it names the exact tool table.

- Add an **explicit, documented manifest** naming which `.llm/tools/` scripts are agent-grade and
  consumer-facing versus repository-internal. The manifest is the source of truth; do not scatter the
  list.
- `netscript agent init` installs that subset into the generated project (`.netscript/tools/`), by
  the same embed-as-asset mechanism the skill bundle uses (`gen:assets-barrel`). Add matching
  `deno task` entries to the generated project `deno.json` (e.g. `check:json`, `lint:json`,
  `validate:ports`) so the tools are reachable without knowing a path.
- The installed skills must reference each shipped tool **from the symptom it solves** — edit
  `skills/help.md` and the relevant `skills/*/SKILL.md` so the tool appears under the symptom, not
  only in a capability table. Then rerun `deno task gen:assets-barrel`.
- `run-deno-check.ts` must be documented as the way to type-check, with the **`deno check` excluded-
  file exit-0 trap** called out explicitly in the installed prose.
- `check-aspire-host-ports.ts` must run against generated scaffolds so the rule is enforced on what
  consumers receive — wire it into the scaffold validation path, not only shipped as a file.
- The scaffolded project must be able to run the e2e smoke without cloning the framework repo.
- Test: `agent init` installs the manifest's files, the generated `deno.json` gains the tasks, and
  the installed tool actually executes in a scaffolded fixture.

If the e2e-smoke box cannot be satisfied without unbounded work, **stop and say so in the worklog**
rather than half-shipping it.

Commit: `feat(cli): install the agent-grade tool subset with agent init`.

---

## Slice 4 — #1061: `agent init --with-docs`

Five acceptance boxes.

- `netscript agent init --with-docs` installs a local documentation bundle; without the flag,
  behaviour is unchanged (assert this in a test).
- The bundle includes per-package API surfaces generated from the **installed** package versions via
  `deno doc`, covering **every export subpath**, not just the root — read each package's `exports`
  map and generate per subpath.
- The bundle records the version it was built for and **fails loudly on mismatch** with the installed
  CLI rather than emitting a mismatched bundle. Test the mismatch path explicitly — this is the trap
  the issue is written around.
- Discoverable from the symptom in the installed agent surface ("I cannot find how to do X in
  NetScript"), not only as a CLI flag — add it to `skills/help.md` under that symptom and rerun
  `gen:assets-barrel`.
- Documented in the CLI reference **with its size implication stated**.

Commit: `feat(cli): agent init --with-docs installs a version-asserted local docs bundle`.

---

## Ordering and reporting

Do slices in order 1 → 2 → 3 → 4. Slice 1 is p0 and is the reason this slice exists; do not start
slice 2 until slice 1 is committed, pushed and green.

After each slice, append to the orchestrator worklog: commit hash, the gate commands you ran, and
**the output you actually read** (not "passed"). If a gate is red, report the error text verbatim.

If you conclude an acceptance criterion cannot be met, say so explicitly with the reason. A stated
gap is a good outcome; a silently narrowed scope is not.
