# Research — agent init skill discoverability

## Re-baseline

- Carried-in source: issue #1023 brief and `/home/codex/repos/.briefing/slices/1023/drafts/`.
- Re-derived against current checkout at `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01.
- Drift: the requested repro entry `packages/cli/src/main.ts` does not exist and the live command has no `--project-root` option. Running the actual contributor entrypoint `packages/cli/bin/netscript-dev.ts` from the temporary project directory reproduces the stated result exactly: three skills, 164 total lines, and dangling `aspire` routes.

## Findings

| # | Finding | How to verify |
| - | - | - |
| 1 | The installed Claude bundle contains exactly `netscript`, `netscript-build`, and `netscript-operate` (164 lines). | Run `agent init --host claude` from a temp cwd, then `find` and `wc -l` under `.claude/skills`. |
| 2 | `netscript` and `netscript-operate` route to an uninstalled `aspire` skill; `netscript` routes generic Deno work only to docs. | `rg -n -i 'aspire skill|use.*aspire|Deno docs' skills`. |
| 3 | The cause matches the issue: `initAgent` hash-verifies `EMBEDDED_SKILL_FILES` then writes every non-manifest entry. The manifest and generated barrel are the bundle authority; installer enumeration is not constrained. | `skills/manifest.json`, `skills.generated.ts`, and `init-agent.ts`. |
| 4 | `AGENTS_SECTION` is the stated one-line hardcoded guidance. | `packages/cli/src/public/features/agent/init/init-agent.ts`. |
| 5 | `check:assets-barrel` omits `skills.generated.ts`. | root `deno.json` task definition. |
| 6 | The drafts already symptom-anchor `aspire logs`, `aspire otel`, and `deno info`; `help.md` has no plugin symptom and says NetScript `0.0.2`. | focused reads/grep of the three drafts. |
| 7 | The live top-level CLI has no `netscript doctor`; it exposes `config`, `plugin`, and other groups. This release line is 0.0.3 per the issue target. | `deno run -A packages/cli/bin/netscript-dev.ts --help`. |

## jsr-audit surface scan

- N/A: no export map, package version, public TypeScript API, or JSDoc surface changes. This is embedded content, installer guidance, tests, and docs.

## Open questions

- None that force rework. Skill-reference parsing must be narrow enough to cover the routing forms used by shipped frontmatter/tables without treating arbitrary command literals as skill names.

