use harness

# Codex Implementation Brief — gate maintainer plugin-source copy behind a flag + lock prod no-copy

You are the daemon-attached WSL Codex implementation agent for run
`fix-cli-plugin-copy-flag-gate--copy-gate`, branch `fix/cli-plugin-copy-flag-gate`
(off `origin/main` @ alpha.4). The supervisor (Claude) authored `research.md` and `plan.md` in
`.llm/tmp/run/fix-cli-plugin-copy-flag-gate--copy-gate/`. PLAN-EVAL is waived (user self-reviews the
PR). Read `research.md` and `plan.md` first — they are the contract and carry the exact file:line
anchors. Do not restate; implement.

## SKILL

Read and apply, in order, before any code:
- `.agents/skills/netscript-harness/SKILL.md` — run loop, commit-per-slice, artifacts.
- `.agents/skills/netscript-cli/SKILL.md` — CLI command/option plumbing, scaffold internals, local vs
  public feature split, plugin add flow.
- `.agents/skills/netscript-doctrine/SKILL.md` — public-surface gates; this is a behavior/flag change,
  not a surface change — keep it that way.
- `.agents/skills/netscript-tools/SKILL.md` — scoped check/lint/fmt wrappers, raw git verification.
- `.agents/skills/netscript-deno-toolchain/SKILL.md` — `deno doc`, `publish:dry-run`, lock hygiene.
- `.agents/skills/netscript-pr/SKILL.md` — branch/PR/comment conventions.
- `.agents/skills/codex-wsl-remote/SKILL.md` — native worktree rule; run full e2e from this WSL ext4
  worktree, never `/mnt/c`.

## The shape (grounded in research.md)

- PUBLIC `netscript plugin add` = prod/JSR: hardcoded `importMode:'jsr'` (`render-plugin.ts:41,61,89`)
  → `PluginScaffolder.scaffold()` thin stubs only, never `copyPlugin()`. **Already correct — only add
  a regression lock.**
- LOCAL `netscript-dev plugin add` = maintainer: `add-local-plugin.ts:189` decides, `:254` calls
  `copyPlugin(...)` → `copy-official-plugin.ts:94` → `plugin-file-collector.ts:50` full-source tree
  copy into userland `plugins/<dir>/`. **Unconditional today — gate it behind a flag.**

## Non-negotiables

1. **Flag-gate the local copy.** Add `--copy-source` (boolean, default `false`) + explicit
   `--no-copy-source` to the **local** add command (`add-local-plugin-command.ts`, after `--samples`).
   Thread it through the input/options/dependencies into `add-local-plugin.ts`. Gate the copy decision
   (`:189`) and the `copyPlugin(...)` call (`:254`) on it.
2. **Default off = thin-stub local scaffold.** When the flag is false, fall through to the existing
   `PluginScaffolder.scaffold()` branch (the same one already used for non-canonical plugin names) but
   keep `importMode:'local'` so relative local imports are still produced. Contributors get a runnable
   local plugin without a vendored source tree. `--copy-source` restores today's vendored behavior
   byte-for-byte.
3. **Prod can never copy.** Do NOT change the public path's `importMode:'jsr'`. Add a regression test
   asserting the public `plugin add` produces only the JSR-stub shape and copies NO plugin source
   (no verbatim source-only files from the canonical plugin under the scaffolded `plugins/<name>/`).
   If feasible, also make `copyPlugin`/`copyOfficialPlugin` structurally unreachable from the public
   feature (it already is — assert via a test/import-boundary, do not add a runtime branch).
4. **Public default output byte-identical.** Public path never copied; do not perturb its output.
5. **No public surface/type change.** This is internal flag plumbing; `publish:dry-run` must show no
   surface change for `@netscript/cli`.

## Commit slices (commit + push + PR comment + append commits.md after EACH)

- **S1 — flag plumbing + gate.** Add the `--copy-source`/`--no-copy-source` option; thread through
  local add input/options/deps; gate `:189`/`:254`; default-off path uses thin-stub local scaffold.
  Update `add-local-plugin_test.ts` into two cases (default no-copy local-imports; `--copy-source`
  preserves vendored copy). Scoped check/lint/fmt + unit.
- **S2 — prod no-copy regression lock.** Add the public-path test that asserts JSR-stub shape and no
  source copy; assert the copy helpers are not reachable from the public command. `publish:dry-run`.
- **S3 — e2e + debt close.** Update `scaffold.plugins`/`scaffold.runtime` gate expectations to the
  default-off shape; run both suites; record evidence. Close the `PLUGIN-USERLAND-SOURCE-COPY` debt
  entry in `arch-debt.md` (add it then mark resolved in the PR).

## Validation (record evidence in worklog.md per slice; full list in plan.md)

- `run-deno-check.ts --root packages/cli --ext ts,tsx` (`--unstable-kv`)
- scoped lint + fmt (ts,tsx only)
- `deno task test` for the plugin-add units (public + local, both flag states)
- `deno task publish:dry-run` cli (no surface change)
- `deno task e2e:cli run scaffold.plugins --cleanup --format pretty`
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` (MERGE BAR — run from this WSL
  ext4 worktree, not `/mnt/c`)

## Boundaries

- Do NOT couple in the asset-read import-attribute slice (`fix/cli-jsr-asset-embedding`, #124).
- Do NOT change the public/JSR path's behavior — only add the lock.
- If you find a downstream step that READS the vendored `plugins/<dir>/` files (so default-off breaks
  it), STOP, log to `drift.md`, and either keep copy default-on (flip the documented open decision in
  plan.md D1) or fix the reader — surface it for the user, do not silently pick.
- Lock hygiene: do not churn root `deno.lock` without need; no `deno cache --reload`.
- Push slice branch via explicit refspec
  `git push origin HEAD:refs/heads/fix/cli-plugin-copy-flag-gate`.
- Stage only relevant files by explicit path; never `git add -A`.
