# Plan: ship a complete, symptom-discoverable agent skill bundle

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1023-agent-init-skill-surface--skills-discoverability` |
| Branch | `fix/1023-agent-init-skill-surface` |
| Phase | `plan` |
| Target | `packages/cli` agent installer assets and skill/docs content |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Archetype

Archetype 6 is the smallest fit because this changes a user-run CLI installation flow and its generated embedded asset bundle. The docs overlay applies to the shipped Markdown skills, playbook, README, and reference pages.

## Current Doctrine Verdict

The doctrine snapshot labels `@netscript/cli` “Restructure,” while the associated AP-1 entry records the bounded A6 promotion as closed. This slice does not restructure CLI layers; it preserves the existing asset/installer seam.

## Goal

`netscript agent init --host claude` installs five mutually resolvable skills plus `help.md`, exposes symptom-first routes to the high-value diagnostic commands, writes useful idempotent AGENTS guidance, and fails CI if the embedded skill barrel is stale.

## Scope

- Adapt the three supplied drafts into `skills/aspire/SKILL.md`, `skills/deno/SKILL.md`, and `skills/help.md`.
- Remove every routing reference to a skill absent from the five-skill manifest.
- Add symptom-first `netscript plugin doctor` discoverability.
- Update the manifest, installer AGENTS block, installer tests, generated barrel check, and enumerating docs.
- Regenerate and verify `skills.generated.ts`.

## Non-Scope

- Installer control-flow or filesystem architecture changes; research confirms it already writes every manifest-backed embedded file.
- Scaffold/runtime E2E; the user explicitly excludes it and no scaffold output changes.
- Dependency, export-map, publish, or release-cut work.

## Hidden Scope

- The route-integrity test must parse all installed `SKILL.md` files and recognize both prose “use the X skill” and backticked routing-table forms.
- `help.md` is installed at `.claude/skills/help.md`, not inside a named skill directory.
- The generated hash changes when the manifest/content changes.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Preserve `initAgent` bundle iteration and hash verification. | It is already generic and is not the defect. |
| D2 | Install exactly `netscript`, `netscript-operate`, `netscript-build`, `aspire`, and `deno`; install `help.md` as a companion playbook. | Matches acceptance and keeps routing finite. |
| D3 | Rewrite draft references to non-installed specialist skills as direct domain/docs guidance. | No installed route may dangle. |
| D4 | Add a manifest-derived routing-integrity test over installed Markdown. | It proves the behavior and fails on current main. |
| D5 | Use two implementation slices: source/content/tests, then generated artifact + full scoped validation. | Keeps generated evidence traceable to its source while avoiding a false stale-barrel pass. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact regex for skill references | must resolve now | Implement against the actual frontmatter/table forms and assert extracted names resolve to `manifest.skills`. |
| Manifest version increment | must resolve now | Bump minor bundle version from `0.1.0` to `0.2.0` for the expanded shipped surface. |
| Broader skill prose edits | safe to defer | Only dangling routes and symptom discoverability are in scope. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Regex flags command/code literals as skills | Restrict extraction to explicit “use … skill” phrases and routing-table skill cells; cover found references in focused tests. |
| Draft commands drift from installed CLI versions | Preserve supplied Aspire 13.4.6/Deno 2.9.3 drafts, verify named acceptance commands, and correct only known 0.0.3 wording/routes. |
| Generated bundle silently stale | Regenerate, add the generated skill barrel to `check:assets-barrel`, run that task, and inspect the artifact/hash. |
| Idempotency regresses through AGENTS prose | Keep the existing markers/upsert path and existing second-run assertion. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-18 | risk | Use semantic installed-file/routing assertions rather than a giant generated snapshot. |
| AP-21/AP-23 | avoided | No CLI presentation/composition restructuring. |
| AP-25 | avoided | Filesystem side effects remain in the existing adapter/use-case boundary. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-10 | yes, touched surface | scoped check/lint/tests plus manual diff review |
| F-CLI-3/F-CLI-4/F-CLI-19/F-CLI-24 | yes, touched seam | existing asset architecture retained; `arch:check`/quality scan and generated-bundle test evidence |
| Docs overlay | yes | source alignment, local-link/name sweep, and focused grep |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| existing CLI restructure/deferred entries | none | This bounded content/install fix neither creates nor closes them. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Type check | `deno run -A .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | structured PASS |
| 2 | Lint | `deno lint packages/cli` (owner-required exact command) | PASS |
| 3 | Feature tests | `deno test -A packages/cli/src/public/features/agent/init/` | all tests pass |
| 4 | Asset freshness | `deno task check:assets-barrel` | no diff, including `skills.generated.ts` |
| 5 | Harness code-quality | `deno task quality:scan` and `deno task arch:check` | PASS/no new finding |
| 6 | Artifact proof | fresh temp install + file listing/reference sweep | five skills + help; no dangling routes |

## Deferred Scope

- Full scaffold runtime smoke is explicitly N/A because this changes neither scaffold output nor plugin/DB/Aspire helper generation.
- Publishing/release verification remains with the 0.0.3 release run.

