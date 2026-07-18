use harness

## SKILL
- netscript-harness; netscript-cli; netscript-tools; netscript-deno-toolchain; netscript-pr; rtk

## Slice: p0 — prod E2E fails for 24h after every release: `deno x jsr:@netscript/plugin-ai@<fresh>` blocked by Deno's default minimum-dependency-age

Worktree `/home/codex/repos/b10-minage`, branch `fix/e2e-prod-min-dep-age`, base = current main. PR base: main.

Evidence (e2e-cli-prod run 29562650571, gate `scaffold.plugin.ai.lifecycle`): `deno x -A jsr:@netscript/plugin-ai@0.0.1-beta.10/cli add tool …` → exit 1: "Could not find version … A newer matching version was found, but it was not used because it was newer than the specified minimum dependency date of 2026-07-16 07:21…". The version EXISTS on JSR; Deno 2.9's supply-chain min-dependency-age (default ≈24h) rejects same-day publishes. Other suite invocations already pass `--minimum-dependency-age=0` (see prepare-flow-b-fixture.ts runDeno calls); this gate's command builder does not.

Fix:
1. Sweep the ENTIRE e2e suite (packages/cli/e2e/**) for `deno x`/`deno run`/`deno add`/`deno install` invocations of `jsr:@netscript/*` targets and ensure each carries `--minimum-dependency-age=0` (correct for the harness: it deliberately tests the release published seconds ago — lockstep siblings are by definition the same age as the artifact under test). Start at the `scaffold.plugin.ai.lifecycle` gate's command builder (plugin-install-gates.ts `publishedPluginCliSpecifier` call site).
2. Add/extend a unit test asserting the built command arrays include the flag (the existing scaffold-gates_test.ts published-lifecycle test is the anchor).
3. ALSO check + fix `deno doc`-level docs if the suite README/harness docs describe these invocations.
4. Assess but DO NOT fix here: the shipped CLI's own `deno x` shell-outs (`dispatchPluginVerb`, ai-plugin-command, agent-init-written configs) hit the same 24h wall for REAL USERS in the fresh-release window — capture your findings precisely in the PR body under "Follow-up: user-facing window" so the supervisor can file the CLI-side issue with exact call sites.

Gates: focused e2e builder tests; `deno task check` scoped; changed-file quality:scan. Push explicit refspec `git push origin HEAD:refs/heads/fix/e2e-prod-min-dep-age`; DRAFT PR to main titled `fix(e2e): pin --minimum-dependency-age=0 on published-JSR invocations — prod suite must not fail for 24h after each release`, labels `type:fix, area:cli, gate:ci, priority:p0, status:impl-eval`, milestone 12. No self-evals; do not merge.
