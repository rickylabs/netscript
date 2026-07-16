# Research — fix-781a-aspire-generator-emission--codex

## Re-baseline

- Fetched GitHub issues #791 and #781 in full through the REST API using `resolveGithubToken()`
  from `.llm/tools/agentic/lib/agentic-lib.ts`; #781 includes four comments and #791 has none.
- Read the prior re-baseline from
  `fix/781-beta10-stabilization:.llm/runs/fix-781-beta10-stabilization--codex/research.md` at local
  ref `4e9113e`. The named branch is no longer a remote head, so the preserved local ref is the
  available authoritative copy.
- Fetched and merged the latest `origin/feat/beta10-integration`. The slice baseline is
  `7d353be24ccdf0de656f1e70ae73167102da8528`, newer than the prior `0daa575b` re-baseline.
- Re-ran the focused current test set: 17 suites / 128 steps passed. Several steps are false-green
  because they deliberately assert the invalid output described by #791.
- Reproduced `deno task --minimum-dependency-age=0 check`: exit 1 with `unexpected argument`.

## Finding status on the current base

| # | Finding | Current-base evidence | Owning correction |
| --- | --- | --- | --- |
| 1 | Browser logs on generic executables | `generate-register-apps.ts` emits `withBrowserLogs()` after `addExecutable()`; the app test expects it. | Omit the unsupported capability and reverse the existing expectation. |
| 2 | Dependency-age flag in `deno task` argv | App, Tauri, task, and tool generators emit `['task', '--minimum-dependency-age=0', ...]`. The DB CLI-mode template is already clean on `7d353be`. | Remove the flag only from task-backed argv; preserve valid `deno run` uses. |
| 3 | Invalid Vite full keys for hyphenated names | `@netscript/aspire` and the generated compatibility template preserve hyphens in `VITE_services__*`; the package test expects the invalid key. | Normalize non-identifier resource/endpoint characters to underscores in both owners. |
| 4 | Primary DB provider aliases absent | Service, plugin, and background DB wiring sets URL/URI variables but neither provider alias. | Project `config.PrimaryDatabase` to `DB_PROVIDER` and `DATABASE_PROVIDER` for DB consumers. |
| 5 | Garnet restore can block AppHost startup | `_aspire-compat.ts.template` calls synchronous `dotnet tool restore` without a timeout. | Bound the best-effort restore to 10 seconds and regression-lock the timeout. |
| 6 | SQLite URLs depend on resource workdir | Service, plugin, and background generators emit `file:./database/...` while their executable workdirs may be nested. | Build a file URL from the absolute workspace root (`appHostDir`) and database path. |
| 7 | Workers health-check prerelease resolution | Already fixed before this slice and explicitly excluded by #791. | None. |
| 8 | Plugin HTTP resources use legacy request-signal behavior | `generate-register-plugins.ts` invokes `deno run` without `--unstable-no-legacy-abort`; generated ordinary service tasks already carry the flag. | Add the flag to plugin executable argv at the generator owner. |
| 9 | Sample queue trigger is unconditional | Explicit sibling scope #792. | None in this branch. |

## Root-cause clusters

1. Executable capability/argv emission: findings 1, 2, and 8.
2. Consumer environment projection: findings 3, 4, and 6.
3. AppHost startup provisioning bound: finding 5.

## Public-surface / JSR scan

- `@netscript/cli`: generator behavior changes are internal to the scaffold implementation; no new
  export or command vocabulary is planned.
- `@netscript/aspire`: the existing exported `buildViteEnvVarName()` contract changes its `full`
  value for resource/endpoint names containing identifier-invalid characters. No symbol or export
  is added. The behavioral compatibility change is intentional because the old value breaks Vite.
- Planned publish risks: no new slow types, imports, permissions, or files. Run full-export doc lint
  and package dry-runs for both touched packages.

## Relevant doctrine / debt

- Primary archetype: 6 (CLI/Tooling); secondary owner: `@netscript/aspire`, Archetype 2
  (Integration). Service scope overlay applies because generated resource startup, DB wiring, and
  Aspire runtime health change.
- Current doctrine verdict records `@netscript/cli` as historically requiring restructuring; this
  slice must not deepen generator monoliths or introduce a new abstraction axis.
- AP-18 is directly in scope: existing tests assert invalid generated strings and must be changed
  deliberately to semantic presence/absence assertions.
- Existing relevant debt includes the Docker-less Garnet compatibility path and generated Aspire
  npm island. This slice bounds restore startup but does not claim to close the npm-island debt.

## Open questions resolved by #791 scope

- Vite policy: normalize the full key rather than omit it, preserving both documented aliases.
- Garnet lifecycle: keep best-effort restore at the existing runtime edge but add a strict timeout;
  moving provisioning outside AppHost construction is a larger redesign not required by #791.
- SQLite policy: use a normalized absolute file URL from the workspace root for service/plugin/
  background consumers; keep DB-task/tool workdir-relative URLs where their workdir is the database
  directory and the current path is already correct.

