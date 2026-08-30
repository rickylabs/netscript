# Research — fix-agent-init-guidance-and-cross-host-skills--0.0.7

## Re-baseline

- Carried-in source: grouped re-intake brief in `implement.md`, live issues #1672, #1674, #1675,
  and their comments.
- Re-derived against the requested baseline `5bb112dd35f94fc8435672e2cabff1f9a447aa0b` on
  2026-08-30. Local `HEAD`, branch point, and merge base all equal that SHA; the product tree is
  clean and the run directory is the only pre-existing untracked surface.
- What changed versus older issue discussion:
  - #1674 comment `5313223606` proposed deleting `apps/<app>/AGENTS.md` and consolidating to one
    root file. The newer grouped brief explicitly requires preserving and linking the app guide and
    forbids example-route changes. This run treats the re-intake brief as the current authority.
  - #1672 comment `5311467701` proposed expanding the repository's
    `netscript-deno-toolchain` skill. The newer grouped brief explicitly forbids that path and limits
    this leaf to generated consumer guidance. This run links to the generated Deno skill instead.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `packages/cli` is Archetype 6 with a current doctrine verdict of **Keep**; this leaf must preserve the kernel/public surface split. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`; `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` |
| 2 | `initAgent` currently writes the embedded skill bundle only under `.claude/skills/`, and only when the resolved host set includes `claude`. | `packages/cli/src/public/features/agent/init/init-agent.ts:117-142` at baseline |
| 3 | Root `AGENTS.md` is also written only inside the Claude branch, so a VS Code/non-Claude selection gets neither universal guidance nor skills. | `packages/cli/src/public/features/agent/init/init-agent.ts:117-142`; test `VS Code-only agent init never delegates...` |
| 4 | The current marked root section is diagnostic-heavy and inline. It mentions `deno info` but not `deno doc`, `deno eval`, the Deno agent primer, the architecture spine, app guide, UI verbs, or per-skill invocation triggers. | `agentsSection()` in `init-agent.ts`; issue measurements |
| 5 | The scaffold already generates a strong app guide at `apps/<app>/AGENTS.md`, including the MCP service-discovery path, contract/query/page/island architecture, and `ui:add page`, `ui:add island`, and `ui:add data-table`. | `packages/cli/src/kernel/templates/app/agent-conventions.ts:126-170`; `write-app-files.ts:178` |
| 6 | Embedded checked-in templates ship from `packages/cli/src/kernel/assets/*.generated.ts`; `deno task gen:assets-barrel` reads the typed manifest and emits `embedded.generated.ts`. | `.llm/tools/generate-cli-assets-barrel.ts`; root tasks `gen:assets-barrel` and `check:assets-barrel` |
| 7 | The embedded skill bundle is sourced from root `skills/manifest.json` into `skills.generated.ts`. The product change need not edit those skill sources: canonical-versus-mirror installation is installer behavior. | `.llm/tools/generate-cli-assets-barrel.ts:31-40,220-247`; `skills/manifest.json` |
| 8 | `AgentHost` currently models `claude` and `vscode`; `--host all` resolves both. Canonical `.agents/skills/` can be host-neutral without introducing a new host enum. | `init-agent-input.ts`; `resolveHosts()` in `init-agent.ts` |
| 9 | `initAgent` is not re-exported through `packages/cli/src/public/public-api.ts`; the TypeScript/JSR export map remains unchanged. The user-facing contract is generated filesystem output. | `packages/cli/mod.ts`, `packages/cli/deno.json`, and absence of `initAgent` in `public-api.ts` |
| 10 | The live issues contain exactly three behavioural boxes that an implementation leaf cannot evidence: #1674 acceptance 4, #1672 acceptance 4, and #1675 acceptance 5. | Live issue bodies fetched 2026-08-30 |

## Exact product path ceiling

The product change may touch only these paths. Any additional product path is a rescope requiring
supervisor approval; harness artifacts under this run directory are excluded from the product
ceiling.

1. `packages/cli/src/kernel/assets/agent/guidance.md.template` (new pointer-surface template)
2. `packages/cli/src/kernel/assets/manifest.ts` (typed template key)
3. `packages/cli/src/kernel/assets/embedded.generated.ts` (generated shipping barrel)
4. `packages/cli/src/public/features/agent/init/init-agent.ts` (canonical install + host mirrors)
5. `packages/cli/src/public/features/agent/init/init-agent_test.ts` (semantic acceptance tests)

`packages/cli/src/kernel/assets/skills.generated.ts` remains an input to the installer but is not
expected to change because no skill source changes. `check:assets-barrel` still proves all generated
asset barrels are fresh.

## Acceptance inventory (separate by issue)

### #1674 — build guidance

| Acceptance box | Implementation evidence available in this leaf |
| --- | --- |
| Root guidance names the contract → service → SDK → page spine | Template assertion + fresh CLI scaffold output |
| Links `apps/<app>/AGENTS.md` and says what it is for | Template assertion + fresh CLI scaffold output |
| Names the `ui:add` route/island verbs | Template assertion + fresh CLI scaffold output |
| Measured unfamiliar-agent smoke uses `ui:add` or MCP `find_guidance`, or records rejection | **Behavioural; supervisor disposition required** |
| Root stays a pointer surface | Focused prose review; no MCP/offline corpus changes |

### #1672 — Deno toolchain discovery

| Acceptance box | Implementation evidence available in this leaf |
| --- | --- |
| References `deno.com/agents.md` and inspection verbs | Template assertion + fresh CLI scaffold output |
| Names `deno doc` for public API inspection | Template assertion + fresh CLI scaffold output |
| Requires the test task before completion | Template assertion + fresh CLI scaffold output |
| Measured unfamiliar-agent smoke uses `deno doc`, or records rejection | **Behavioural; supervisor disposition required** |
| Does not duplicate the internal toolchain skill | Pointer-only prose review; repository skill untouched |

### #1675 — cross-host skills

| Acceptance box | Implementation evidence available in this leaf |
| --- | --- |
| Fresh scaffold contains canonical `.agents/skills/` | Host-all unit assertion + fresh CLI scaffold output |
| `.claude/skills/` is generated from canonical content | Byte-equality assertion for every installed skill |
| Non-Claude host discovers canonical skills | VS Code-only unit assertion: `.agents` + root `AGENTS.md`, no `.claude` mirror |
| Root says when to use each skill | Per-skill trigger assertions + fresh CLI scaffold output |
| Measured smoke uses a skill, or records rejection | **Behavioural; supervisor disposition required** |

## jsr-audit surface scan

- Surface scanned: `packages/cli/deno.json`, `mod.ts`, `scaffolding.ts`, `testing.ts`, and the planned
  internal installer/template paths.
- Public export change: none. No export-map, package metadata, dependency, or public JSDoc changes.
- Slow-type risk: no new exported API; `agentsSection()` remains internal. The package's existing
  `cli/public-api-doc-completeness` debt is not deepened and remains outside this leaf.
- Publish-shape risk: the new `.template` is intentionally included by the existing
  `src/**/*.template` publish include; regeneration must inline it into `embedded.generated.ts` so
  remote JSR consumers never depend on a package filesystem read.

## Open questions

- Supervisor decision: should each of the three behavioural acceptance boxes be edited to carry a
  `[post-merge]` marker with a follow-up wave measurement, or should the owner post an explicit
  recorded rejection with reasoning? This must be resolved before closing keywords or merge-ready
  status, but it does not change the implementation shape.
