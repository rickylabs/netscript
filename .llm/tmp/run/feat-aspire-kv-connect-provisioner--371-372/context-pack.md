# Context Pack — feat-aspire-kv-connect-provisioner--371-372

## One-paragraph state

Lane supervisor run for #371 (shared Deno KV Connect container) + #372 (Garnet dotnet-tool
executable) = one environment-aware shared-cache/queue provisioner in the Aspire generator.
Grounding COMPLETE (research.md), plan + design LOCKED (plan.md D1-D8, worklog.md ## Design).
Phase: Plan-Gate — draft PR-A open, awaiting PLAN-EVAL (OpenHands minimax M3, separate session).
NO implementation before PLAN-EVAL PASS.

## Key facts for a cold resume

- Worktree: `.claude/worktrees/kv-provisioner`, branch `feat/aspire-kv-connect-provisioner`
  off origin/main@bd03e51d. PR-B `feat/aspire-garnet-executable` stacks on it later.
- Two stacked PRs (D1): PR-A = contract + DenoKv container arm + CacheWiring consumer seam
  (Closes #371); PR-B = Garnet `addDotnetTool` arm + Auto docker-probe selection +
  `ensureSharedCache` default flip to `Mode:'Auto'` (Closes #372). Refs #327 #349 #364 on both.
- Composability requirement from coordinator: deferred Deploy-S4 apphost-compose slice (#343)
  weaves over register-services/apps/background later → all consumer injection goes through ONE
  `withCacheReference` helper in `_aspire-compat`; the three register generators get a one-line
  call-site swap only. Interaction map table lives in worklog.md ## Design.
- Edit targets: `packages/aspire/config.ts` (contract), `packages/cli/src/kernel/templates/
  aspire/helpers/register/generate-register-infrastructure.ts` + template asset, one-line swaps in
  register-{plugins,background,apps}.ts, `_aspire-compat` template,
  `kernel/adapters/plugin/workspace-mutator.ts` (PR-B).
- Env contract (verified): DenoKv → `services__kv__http__0` + `DENO_KV_ACCESS_TOKEN` (token read
  natively by Deno.openKv); Garnet → `GARNET_URI` explicit (name-decoupled; today detection only
  works because the cache resource is literally named `garnet`).
- Historical port source: netscript-start@49065681e Resources.g.cs (saved at
  `C:\Users\chaut\AppData\Local\Temp\claude\ns-start-resources.cs`).
- POC: rickylabs/eis-chat#133 (live-verified Garnet executable on Docker-less Windows).
- Process: coordinator holds merge gate (never self-merge); WSL Codex daemon-attached implements
  slices; OpenHands PLAN-EVAL=minimax M3 / IMPL-EVAL=qwen3.7-max; merge-readiness =
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` per PR.
- Session env quirks: Bash tool broken (empty output) → use PowerShell tool; WSL gh via
  `wsl.exe -u codex -- bash -l /mnt/c/...script.sh` (write script to temp file, never inline).

## Next actions

1. Commit run artifacts (explicit paths), push `HEAD:refs/heads/feat/aspire-kv-connect-provisioner`.
2. Open draft PR-A (labels type:feat, area:aspire, area:cli, status:plan; milestone 0.0.1-stable;
   body `Closes #371` + `Refs #327 #349 #364 #372`).
3. Dispatch PLAN-EVAL (OpenHands minimax M3) via PR comment; watch, act on verdict.
4. On PASS: launch WSL Codex slice S1 (contract) per worklog slice map.
