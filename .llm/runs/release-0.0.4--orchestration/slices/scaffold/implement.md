use harness

# Slice: scaffold agent surface (#1071, #1072, #1073, #1024, #1061)

Worktree: `/home/codex/repos/ns004-scaffold` · branch `feat/1071-scaffold-agent-surface` · base
`origin/main` @ `f663fe0e4`.

## SKILL

Load, in order:

- `.agents/skills/netscript-harness` — run loop, slice contract, commit trail.
- `.agents/skills/netscript-cli` — `netscript init`, `agent init`, `ui:add`, scaffold output,
  fixture tests.
- `.agents/skills/deno-fresh` — the web layer the generated conventions describe.
- `.agents/skills/netscript-pr` — branch/PR/label/milestone rules. `Closes #N` goes in the PR
  **body**; every `gh` call passes `--repo rickylabs/netscript`.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers, `quality:scan`, `arch:check`.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Why this slice exists

Wave four ran the same brief, the same docs and the same version twice. Run 1 **deleted** the
generated service example before writing its UI and hand-rolled what those files demonstrated. Run 2
**kept** them, read them, and produced a materially better frontend. The variable was whether the
generated examples survived.

The defect is not minimal patterns — it is **signal dilution**. The first scaffold commit adds
14,398 lines across 143 dashboard files with nothing saying which five are canonical. #1071 is
described in its own issue as "the single change most likely to have changed wave four's outcome",
and it is cheap.

## Scope

Read every issue body in full before writing anything.

- **#1071 (p0)** generate an app-scoped `apps/<app>/AGENTS.md` + `WEB-LAYER.md` naming the canonical
  web-layer examples. The issue contains a drafted `AGENTS.md` body and a one-screen architecture
  path — treat it as a starting point, not a spec to paste. **A CLI fixture test must assert both
  files exist and that every path they name resolves** — a conventions file naming a file that does
  not exist is worse than none.
- **#1072 (p1)** `agent init` installs a diagnostic surface agents never load — make it **gate, not
  suggest**. Verbatim from a wave-four agent: *"Optional docs lose to curl every time."* Acceptance
  requires a drift/defect entry to be unrecordable without evidence of a doctor or otel pass, the
  installed surface announced where the driving agent must encounter it, and `help.md` symptom
  lookup reachable from the MCP tool surface.
- **#1073 (p2)** `ui:add` is invisible at the moment of need. It must be named in the generated
  conventions file exactly where hand-rolling is discouraged, and `ui:add --help` must describe the
  page + island + query-loader **triad** rather than listing flags.
- **#1024 (p2)** ship the agent-grade `.llm/tools` with `agent init` — JSON check/lint, host-port
  validation and scaffold e2e never reach consumers.
- **#1061 (p2)** `agent init --with-docs` — install a local documentation bundle for agents working
  offline.

## Rules

- **#1071 and #1073 both author the generated conventions file. They are in this one PR
  deliberately** — splitting them would have two slices authoring the same file, which cost this
  project 85+/80- of conflict once. Keep them in one commit sequence.
- #1072's "gate, not suggest" is the hard part and the reason this is not a docs slice. A banner
  nobody must read is not a gate. Prefer a mechanism the driving agent cannot route around.
- Every path named in generated prose must resolve in a freshly scaffolded project — assert it, do
  not eyeball it.
- Do not expand into the `llms.txt` task router (#1068) — a separate docs slice owns that on
  `/home/codex/repos/ns004-docs`. This slice owns **generated app-scoped** files; that one owns the
  **published documentation site**. Do not cross.

## Gates

`deno task check` · `deno task test` · scoped lint/fmt wrappers · `deno task quality:scan` ·
`deno task arch:check` · `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` for the
generated-output evidence (this gate is expensive — run it once, at merge-readiness, not per loop).
Verify the artefact, never the exit code.

## Deliverable

One draft PR closing #1071, #1072, #1073, #1024, #1061, driven to ready-for-merge. Commit per slice;
push and comment commit hash + gate evidence on the draft PR before the next slice.
