# PLAN-EVAL — mcp-skills--orchestrator / S7

- Plan evaluator session: opposite-family PLAN-EVAL (Opus 4.8), 2026-07-12
- Run: mcp-skills--orchestrator / S7 — CLI integration (`agent mcp` + `agent init`)
- Surface / archetype: Archetype 6 — CLI/Tooling (`@netscript/cli`); MCP composition folded into CLI
  application layer
- Scope overlays: none (run artifacts are evidence, not a docs product; S9 owns docs-site)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` present; Baseline re-baselines carried design + S5/S6 drift against this tree (`cac53d66` ancestor of HEAD — confirmed in git log; on `feat/netscript-mcp-skills-s7-cli`). Load-bearing findings spot-checked against tree (see below).                                                                                                                                                                                                                                                                     |
| Decisions locked                        | PASS   | `plan.md` §Locked decisions 1–8, each with rationale (additive `agent` registration, batteries-included MCP in app layer, adapt typed doctor use case, public JSR CLI edge, docs-root default, embedded skill map + SHA-256, host selection, atomic content-aware writes).                                                                                                                                                                                                                                                |
| Open-decision sweep                     | PASS   | `plan.md` §Open-decision sweep lists deferrals ("safe to defer") + "Must resolve now: none." Evaluator re-ran sweep (below) — no deferred decision forces rework; each deferral sits behind an injectable/additive seam.                                                                                                                                                                                                                                                                                                  |
| Commit slices (< 30, gate + files each) | PASS   | 3 ordered slices in `plan.md` §Commit slices; each names what it proves, its proving gate, and the files it touches (asset gen + init feature; MCP composition + agent group + root registry; merge-readiness evidence).                                                                                                                                                                                                                                                                                                  |
| Risk register                           | PASS   | `plan.md` §Risk register — 6 risks with concrete mitigations (embedded skills over JSR, no CLI↔MCP cycle, Cliffy-internals avoidance, doctor fixture seam, sibling-edit collision, init overwrite safety).                                                                                                                                                                                                                                                                                                                |
| Gate set selected                       | PASS   | `plan.md` §Required gates: scoped check/lint/fmt (cli+mcp), focused CLI agent + all `packages/mcp` tests, `arch:check` + pending-script review (F-CLI/universal F-*), full-export doc lint + publish dry-run both packages (F-5/F-6/F-7), consumer/runtime gate (MCP initialize → tools/list(13) → real `list_commands` → real doctor family). Matches Archetype-6 matrix: static + consumer-import required, runtime optional-but-provided.                                                                              |
| Deferred scope explicit                 | PASS   | `plan.md` §Debt and deferred scope + `worklog.md` §Deferred scope: no new debt; full docs embedding, new MCP tools, skill prose, S9 pages, broader CLI refactor, and full scaffold E2E ("slice does not change scaffold output") all named.                                                                                                                                                                                                                                                                               |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` §JSR surface scan applies the publishability rubric to the PLANNED surface: `@netscript/cli` embedded skill strings under `src/**/*.ts` with no runtime FS read; explicit return types + JSDoc on new exports; `@netscript/mcp` no public-export change; slow-type risk (`isolatedDeclarations: false`) → explicit annotations; permission risk (`agent init` writes, `agent mcp` env/net/read/run). Each named risk maps to a slice (embedded/no-FS → slice 1; explicit types/doc-lint/dry-run → slice 3). |

## Open-decision sweep (evaluator-run)

None force rework if deferred:

- **Deeper Cliffy option-schema extraction** — deferred, but the guaranteed bounded catalog is the
  live registry verbs; deeper extraction is purely additive to descriptors. No rework.
- **Custom allow/deny flags** — deferred; the default allowlist is required and injected, so adding
  flags later extends an existing seam. No rework.
- **Full public-docs corpus embedding (S9)** — deferred; decision 5 explicitly refuses a
  repo-relative published fallback that would fail over JSR and defaults to
  `<project-root>/docs/site` with `--docs-root` override, so S9 adds without reversing S7. No
  rework.
- **Host default when no marker detected** — resolved now (decision 7: `all`), not deferred.

Spot-checks performed against the working tree (load-bearing findings):

- Finding 1 — `packages/mcp/mod.ts` exports `ProjectDoctorPort`, `CommandCatalogPort`,
  `CommandExecutorPort`, `StaticCommandCatalog`, `SpawnCommandExecutor`; `UnwiredProjectDoctor` in
  `src/infrastructure/plugin-doctor-family.ts` and supplied by `mcp/cli.ts`. Confirms CLI must
  compose real impls without reversing the dependency. ✔
- Finding 2 — `createPublicCommandRegistry()` lives in
  `packages/cli/src/public/features/root/public-command-tree.ts` (sole top-level list). ✔
- Finding 4 — `packages/mcp/src/infrastructure/spawn-command-executor.ts`
  `DEFAULT_CLI_COMMAND = ['deno','run','-A','jsr:@netscript/cli']`. ✔
- Findings 5/6 — `.llm/tools/generate-cli-assets-barrel.ts` present; `skills/manifest.json` lists
  the three skill files + itself with no hashes (matches the S7 plan to derive an embedded SHA-256
  bundle hash). ✔
- Doctrine — `06-archetypes.md` §Archetype 6 confirms thin presentation (parse-only, no fs/process),
  application-owned flows, adapter-owned IO — consistent with the plan's vertical-slice composition.

## Verdict

`PASS`

## Notes

- Release-gate class is correctly treated as `n/a`: S7 adds an `agent` command group and does not
  change scaffold output / DB wiring / Aspire helper generation / publish shape, and the plan states
  this explicitly while still running both package publish dry-runs. Deferring full
  `scaffold.runtime` E2E is justified.
- The gate matrix references `archetypes/ARCHETYPE-6-cli-tooling.md`; in this tree the Archetype-6
  doctrine is consolidated in `docs/architecture/doctrine/06-archetypes.md` §"Archetype 6 — CLI /
  Tooling Package". This is a harness-doc path artifact, not a plan defect — the plan cites
  Archetype 6 and its in-scope anti-patterns correctly.
- Implementation may begin. IMPL-EVAL will judge slices and gate evidence; this pass evaluated the
  plan only.
