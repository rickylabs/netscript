use harness

# Slice: plugin install and service wiring (#1067, #1014, #1015, #1017, #1022)

Worktree: `/home/codex/repos/ns004-plugins` · branch `fix/1067-plugin-wiring` · base `origin/main`
@ `f663fe0e4`.

## SKILL

Load, in order:

- `.agents/skills/netscript-harness` — run loop, slice contract, commit trail.
- `.agents/skills/netscript-cli` — plugin install/sync/doctor, service generate, scaffold output.
- `.agents/skills/netscript-doctrine` — `plugins/` archetype, public surface, fitness gates.
- `.agents/skills/netscript-pr` — branch/PR/label/milestone rules. `Closes #N` goes in the PR
  **body**; every `gh` call passes `--repo rickylabs/netscript`.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers, `quality:scan`, `arch:check`.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Scope

One theme: **plugin install writes incomplete wiring, and nothing downstream notices.** Read the
full issue bodies — they carry exact reproductions and acceptance criteria written so a happy-path
test cannot close them.

- **#1067 (p1)** installing the streams plugin does not wire its env into dependent services.
  `PluginReferences` is not retro-wired onto already-installed `sagas-api` / `workers-api` entries,
  so install order silently changes behaviour: a producer with no reachable streams URL **blocks**
  instead of failing, and warns only in a different process's startup log. Two independent wave-four
  agents hit this from opposite directions; one silently downgraded a headline capability because of
  it.
- **#1014 (p2)** dependency-mode installs silently omit plugin Prisma schema fragments.
- **#1015 (p2)** dependency-mode saga registry path resolves into `jsr.io` instead of the project.
- **#1017 (p2)** `plugin install` ignores `--no-samples`.
- **#1022 (p1)** `plugin doctor` reports healthy on a project that cannot run — no plugin
  contributes checks, so no check can fail. This is the diagnostic that was empty when #1064 and
  #1067 were being hunted; a doctor that cannot fail is worse than no doctor.

Note the issue labels lie: #1017 carries `status:impl-eval` and there is **no open PR**. Verify
current behaviour on `main` before assuming anything is done. Fix the labels as you go.

## Rules

- Contract first: define what correct wiring is, then make install/generate produce it, then tests.
- #1067's acceptance requires install-order **permutations** to produce identical
  `appsettings.json`, and a producer with no reachable streams URL to fail fast rather than block.
  Order-independence is the fix; a retro-wire patch that still depends on order does not close it.
- #1022 requires at least one plugin to contribute a check that **can actually fail**, proven by a
  test that makes it fail.
- Do not absorb #1064/#1065/#1066 — a separate slice owns the saga engine on
  `/home/codex/repos/ns004-sagas`. If you touch a shared file, say so in the PR rather than
  resolving it silently.

## Gates

`deno task check` · `deno task test` for touched packages/plugins · scoped lint/fmt wrappers ·
`deno task quality:scan` · `deno task arch:check`. `deno task e2e:cli run scaffold.plugins
--cleanup` for the install-order evidence. Verify the artefact, never the exit code — a piped
command reports the last stage's status.

## Deliverable

One draft PR closing #1067, #1014, #1015, #1017, #1022, driven to ready-for-merge. Commit per
slice; push and comment the commit hash + gate evidence on the draft PR before the next slice.
