# Plan: agent-init guidance and cross-host skills

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agent-init-guidance-and-cross-host-skills--0.0.7` |
| Branch | `fix/agent-init-guidance-and-cross-host-skills` |
| Phase | `plan` |
| Target | `packages/cli` — `netscript agent init` generated output |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none (generated Markdown is product output, not a doctrine/docs-corpus change) |

## Archetype

Archetype 6 applies because the changed product is a user-run CLI flow that installs generated
workspace files. The existing vertical feature remains under
`src/public/features/agent/init/`; host/file effects stay behind `AgentInitFileSystem`, and checked-in
template content stays under the kernel asset registry.

## Current Doctrine Verdict

`packages/cli` is **Keep**: preserve the Archetype-6 kernel/surface split. No new command, port,
registry axis, abstract, public export, or side-effect edge is introduced.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The generated filesystem contract and three issue-specific acceptance sets are defined before implementation. |
| A2 | Root guidance is a compact pointer surface rather than a copied tutorial. |
| A7 | Guidance directs agents to native Deno inspection/dependency verbs before source scraping or helper invention. |
| A8 | Markdown template lives in the asset role; installer orchestration stays in the existing feature file. |
| A10 | The existing injected filesystem and Aspire initializer seams remain unchanged. |
| A14 | Semantic tests, generated-barrel freshness, doctrine gates, and a real generated-workspace proof protect the contract. |

## Goal

Make every `netscript agent init` host receive canonical `.agents/skills/` and a concise root
`AGENTS.md`; emit `.claude/skills/` only as a byte-identical host mirror; and teach the NetScript
build spine, skill invocation triggers, MCP/CLI discovery, and Deno inspection workflow without
changing docs, examples, exports, or the internal toolchain skill.

## Product Scope Ceiling

Only the following product paths are authorized:

- `packages/cli/src/kernel/assets/agent/guidance.md.template`
- `packages/cli/src/kernel/assets/manifest.ts`
- `packages/cli/src/kernel/assets/embedded.generated.ts`
- `packages/cli/src/public/features/agent/init/init-agent.ts`
- `packages/cli/src/public/features/agent/init/init-agent_test.ts`

Any path beyond this ceiling requires supervisor rescope approval. Run artifacts under
`.llm/runs/fix-agent-init-guidance-and-cross-host-skills--0.0.7/` remain required harness evidence,
not product scope.

## Non-Scope

- Repository root `AGENTS.md`, `.agents/skills/netscript-deno-toolchain`, root `skills/*`, MCP
  export/prose corpus (#1201), and scaffold example routes (#1333).
- Deleting or rewriting `apps/<app>/AGENTS.md`; the current re-intake contract requires linking it.
- New host enum values, editor integration, CLI command names/options, public exports, dependencies,
  or `deno.lock`.
- Behavioural unfamiliar-agent measurement, issue-body edits, closing keywords, readiness, merge,
  labels, milestones, and issue closure.
- `e2e:cli`, Aspire runtime, and Docker gates. They remain unauthorized for this leaf.

## Hidden Scope

- Add the guidance template to the typed asset manifest and regenerate
  `embedded.generated.ts`; the template alone is not the shipped artifact.
- Write canonical skills for every resolved host before host-specific configuration. For Claude,
  read the freshly written canonical files and use those bytes to create `.claude/skills/` mirrors.
- Move root `AGENTS.md` upsert outside the Claude-only branch so non-Claude hosts see the universal
  pointer surface.
- Preserve idempotency, existing user content outside the marked section, docs-mode variation, and
  the Claude-only Aspire/Playwright delegation guard.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `.agents/skills/` is always written from the verified embedded bundle. | Canonical files are host-neutral and discoverable by non-Claude agents. |
| D2 | `.claude/skills/` is emitted only when `claude` is selected and is copied from canonical file bytes. | Makes derivation observable and testable rather than two independent writes. |
| D3 | Root `AGENTS.md` is upserted for every host; existing content outside markers is preserved. | `AGENTS.md` is cross-host and the current command promises idempotent, non-destructive installation. |
| D4 | Guidance content is one checked-in kernel asset template with one offline-docs placeholder. | Avoids a growing inline Markdown literal and forces the shipping barrel cascade. |
| D5 | The root pointer names the exact spine and links `apps/<app>/AGENTS.md`; detailed patterns remain there. | Satisfies #1674 without duplicating or changing canonical app examples. |
| D6 | The Deno section includes the canonical setup prompt, inspection verbs before implementation, quality/test rule, and dependency verbs, then points to `.agents/skills/deno/SKILL.md`. | Satisfies #1672 while leaving the internal toolchain skill untouched. |
| D7 | Skill triggers name when to use `netscript`, `netscript-build`, `netscript-operate`, `aspire`, `deno`, and `help.md`. | Makes #1675 acceptance semantically testable. |
| D8 | PLAN-EVAL is N/A. | The current brief fully fixes contract, ceiling, acceptance, and gates; the only open item is a post-implementation close-gate disposition that cannot force product rework. IMPL-EVAL remains mandatory and separate. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Behavioural boxes: `[post-merge]` measurement or explicit rejection | safe to defer to Tier-A supervisor | Recommendation: mark all three `[post-merge]` and schedule one unfamiliar-agent wave against the merged artifact. If the owner rejects that cost, record a reasoned rejection on each issue. No closing keywords until decided. |

No open decision would force implementation rework if deferred.

## Behavioural Close-Gate Decision Surface

The implementation author will leave all three unresolved and will not fabricate evidence:

1. #1674 acceptance 4 — non-zero `ui:add` or MCP `find_guidance`, or recorded rejection.
2. #1672 acceptance 4 — non-zero `deno doc`, or recorded rejection.
3. #1675 acceptance 5 — non-zero skill use, or recorded rejection.

Proposed disposition: add `[post-merge]` to these three issue boxes and run one versioned unfamiliar-
agent wave that measures all three signals together. Alternative: explicit recorded rejection per
issue with reasoning. This is a supervisor/owner decision, not a leaf-author decision. The draft PR
therefore references `#1672`, `#1674`, and `#1675` without closing keywords.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Host-neutral canonical files accidentally remain inside the Claude branch | VS Code-only test asserts `.agents` + root guidance exist while `.claude` does not. |
| Claude mirror diverges from canonical content | Read canonical files back through the filesystem port and assert byte equality for every manifest path. |
| Guidance becomes a tutorial or drops working diagnostics | Keep compact headings; assert required cues; retain MCP/doctor/telemetry/drift pointers; manual pointer-surface review. |
| A template-only edit ships stale output | Regenerate and run `check:assets-barrel`; inspect generated diff. |
| Generated workspace proof silently exercises source rather than shipped barrel | Run the real local CLI against a fresh scaffold after regeneration and inspect emitted files. |
| Existing user `AGENTS.md` content is overwritten | Preserve `upsertMarkedSection`; add a surrounding-content assertion. |
| Asset key widens a public export or docs corpus | No export-map change; `check:mcp-export-corpus`, `check:agent-docs-prose`, and `check:publish-assets` are N/A unless the ceiling changes. |
| Pre-existing CLI JSR doc debt is misreported as introduced | Record known `cli/public-api-doc-completeness` debt; confirm no export/JSDoc change; compare doc-lint result to baseline if run. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 / AP-23 | risk | Keep orchestration in existing use case and prose in one asset; do not add command/composition logic. |
| AP-18 | risk | Assert semantic cues, paths, and byte equality rather than one giant full-string snapshot. |
| AP-21 / AP-22 | avoid | Use the existing feature folder and typed asset manifest; no new barrel. |
| AP-25 | avoid | Continue using `AgentInitFileSystem`; no direct effects outside adapter/bin edges. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1 / F-10 | yes | Doctrine gate + focused test remains below size cap or records no new violation. |
| F-3 / F-11 / F-12 / F-16 / F-18 | yes | `deno task arch:check` via `quality:gate`; no new layering, folder, naming, cardinality, or barrel findings. |
| F-5 / F-7 | no surface delta | `deno doc`/export inspection shows no public change; existing doc debt unchanged. |
| F-6 | yes | CLI package publish dry-run passes; new template is included and generated barrel is import-safe. |
| F-19 | yes | Check/test/lint/fmt evidence comes from scoped structured wrappers. |
| F-CLI-3 / 4 / 11 | yes | No public/maintainer/kernel boundary regression in `arch:check`. |
| F-CLI-22 / 23 / 24 | yes | Template is under kernel assets, generated/inlined, and manifest ↔ generated registry stays fresh. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/cli — public-api doc completeness` | none | Pre-existing and not deepened; no public export/JSDoc change. |
| New debt | none expected | Any new/deepened doctrine violation is a stop/rescope, not accepted silently. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused test | `run-deno-test.ts -- --allow-all packages/cli/src/public/features/agent/init/init-agent_test.ts` | All installer semantics pass. |
| 2 | scoped check | `run-deno-check.ts` with explicit changed `.ts` files, `--unstable-kv` default | PASS, non-empty selection. |
| 3 | scoped lint | `run-deno-lint.ts` with explicit authored `.ts` files | PASS, non-empty selection. |
| 4 | scoped format | `run-deno-fmt.ts` with explicit authored and generated `.ts` files | PASS. |
| 5 | asset freshness | `deno task check:assets-barrel` through durable gate runner | PASS; no generated residue. |
| 6 | consumer scaffold proof | Fresh `netscript-dev init --no-aspire`, then real `netscript-dev agent init --host all --with-docs`; inspect root guide, canonical skills, byte-identical Claude mirrors, configs, and docs | PASS without invoking `e2e:cli`. |
| 7 | code quality + doctrine | `deno task quality:gate` through durable gate runner | PASS or only explicitly pre-existing debt; no new allowance/cast/host-name coupling. |
| 8 | JSR publishability | `deno task --cwd packages/cli publish:dry-run` | PASS; intended template and generated TypeScript are publishable. |
| 9 | docs/MCP/public cascade | Confirm no docs corpus or public export changed | `check:agent-docs-prose`, `check:mcp-export-corpus`, and `check:publish-assets` remain N/A. |
| 10 | prohibited expensive gates | Do not run `e2e:cli`, Aspire runtime, or Docker | N/A by explicit leaf boundary. |

## Dependencies

- No dependency or version changes. `deps:*` mutation/inspection gates are N/A.
- The embedded skill bundle and app-level guide are existing inputs; neither source is modified.

## Drift Watch

- Any need to edit root `skills/*`, the internal Deno skill, app convention generator, docs/MCP
  corpus, public exports, command options, or files outside the product ceiling.
- Any generated-barrel residue beyond `packages/cli/src/kernel/assets/embedded.generated.ts`.
- Any behavioural acceptance claim presented without a measured unfamiliar-agent record or explicit
  owner rejection.
