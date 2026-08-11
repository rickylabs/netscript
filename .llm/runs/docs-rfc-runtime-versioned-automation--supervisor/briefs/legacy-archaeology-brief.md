use harness

# Slice brief — Legacy capability archaeology: runtime-versioned workers/tasks/triggers

## SKILL

Load and honor: `netscript-harness` (run mechanics), `netscript-doctrine` (vocabulary only — the
legacy repo predates doctrine; do not grade it), `netscript-tools` (rtk usage, evidence rules).
This is a **research-only** slice inside the harness run
`.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/`.

## Identity and hard constraints

- You are a Codex GPT-5.6 Sol research sub-agent for a Claude Fable 5 RFC supervisor.
- Working directory / git worktree: `/home/codex/repos/ns-rfc-runtime-versioned-automation`
  (branch `docs/rfc-runtime-versioned-automation`). **Do not commit, push, stage, or modify any
  tracked file.** Your only writes are new files under
  `.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/evidence/`.
- Evidence subject: the legacy product repo at `/home/codex/repos/netscript-start-ref`
  (HEAD `6ba9ba0`, branch master). It is **strictly read-only**: never run git mutations, never
  edit files, never push. Reading files and running read-only `git log`/`git show` there is fine.
- Do not start services, containers, or long-running processes. Static archaeology only.
- Prefix read-heavy git/grep/ls with `rtk` to save tokens.

## Mission

Reconstruct — from code evidence, not aspiration — what an **operator** could actually do with the
legacy runtime-versioned workers/tasks and triggers system in `netscript-start-ref`. This feeds a
production RFC; wrong claims poison the RFC, so every claim must carry a file path (and line refs
for load-bearing claims) and an explicit confidence tag: `IMPLEMENTED` (wired end-to-end),
`PARTIAL` (code exists but path incomplete), `ASPIRATIONAL` (UI/schema/docs only), or `DEAD`
(unreachable/unused).

Known anchor points (verify and expand; do not assume this list is complete or correct):

- `config/runtime/mod.ts`
- `workers/runtime/tasks/v1.0.0.json`, `workers/runtime/current`, `workers/runtime/schema.json`
- the corresponding `triggers/runtime/**` tree
- cockpit routes under `apps/playground/routes/(dashboard)/dashboard/plugin/workers/tasks` and the
  triggers dashboard equivalents
- CLI: `netscript generate runtime-schemas` (find its implementation and what it emitted)

## Required report sections (answer each concretely)

1. **Version pointer + immutable version documents** — how `current` pointers and `vX.Y.Z.json`
   documents worked: format, who read them, who wrote them, atomicity, validation on load.
2. **Schema generation/validation** — how `schema.json` was produced and enforced; drift between
   schema and actual loader behavior.
3. **Hot add/update/rollback** — could an operator add or change a task/trigger on a *running*
   stack without rebuild/restart? Trace the actual reload path (fs watch? poll? API mutation?
   restart-required?). This is the single most load-bearing question — give the strongest evidence
   either way.
4. **Worker tasks + scheduled/background jobs** — task definition shape, runtimes supported,
   scheduling, execution loop.
5. **Triggers + event handling** — trigger definition shape, event sources, dispatch, coupling to
   workers.
6. **Execution history / status / observability** — what was persisted (tables/collections), what
   the cockpit displayed, gaps.
7. **Cockpit workflows** — enumerate the dashboard routes/components for workers tasks + triggers;
   for each, which operations were wired to real APIs vs mock/dead UI.
8. **Permissions, runtime selection, polyglot/legacy-wrapper support** — evidence of running
   non-TS scripts (shell/python/etc), permission model per task, sandboxing if any.
9. **Persistence/synchronization** — filesystem vs DB source of truth, sync between them,
   multi-instance behavior, race/failure handling.
10. **Operational limitations + why it was not production-ready** — concrete defects, TODOs,
    missing auth, race conditions you can point at.

## Output contract

- Write the full report to
  `.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/evidence/legacy-capability-map.md`.
- Start the report with a ≤25-line executive summary of what an operator could genuinely do.
- Use the confidence tags everywhere. Cite `path:line` for every load-bearing claim.
- Include a final section `## Claims the supervisor should re-verify` listing your 5 weakest
  inferences.
- When finished, reply with exactly `DONE` on the final line. If blocked, reply
  `BLOCKED: <reason>`.
