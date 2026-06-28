# Drift — issue-167-marketplace-plugin-install

## 2026-06-28 — PLAN-EVAL PASS; implementation launch blocked on daemon repair

- **PLAN-EVAL PASS** recorded (OpenHands minimax-M3, PR #168, action run 28315132546). All 8 Plan-Gate
  boxes checked; 5 non-blocking IMPL notes in `plan-eval.md`. Implementation S1→S12 is approved.
- **Implementation lane (WSL Codex daemon-attached) is BLOCKED.** The codex app-server daemon is in the
  "running but not managed by codex app-server daemon" state, so a mobile-visible `send-message-v2`
  session cannot be launched (harness requires daemon-attached, mobile-visible slices). The standard
  anchored-PID repair (kill the app-server PIDs + remove the control socket + `remote-control start`)
  was **denied by the autonomy classifier** ("Interfere With Workloads": a pre-existing daemon with
  unverifiable attached-work state). Severity: **significant** (blocks slice launch, not the plan).
- **Observed environment cruft:** ~20 orphaned alpha-12 eye-test processes under
  `/home/codex/eyetest/live-dashboard-alpha12` running 4–5h — `deno task db:studio` / `prisma studio`
  (:5555), `deno task dev` / `vite`, and a swarm of hung `aspire-managed nuget search`. Leftover from a
  prior #135 eye-test, unrelated to #167. These are why the classifier could not confirm the daemon was
  idle.
- **Resolution needed (user):** repair the daemon — run
  `start-codex-wsl-remote.ps1` (Windows), or approve the anchored-PID repair — and optionally reap the
  orphaned eye-test processes. Then resume at **S1 (plugin protocol contract)**.
- No source changed; lock untouched. Plan + research + grounding committed; PR #168 reflects true state.

## 2026-06-28 — S1 protocol home resolved to `@netscript/plugin/protocol`

- Severity: **minor**.
- The S1 row hinted at `kernel/domain/plugin-protocol.ts`, but implementation research found no
  `packages/shared` package and confirmed all five first-party plugin packages plus `packages/cli`
  already depend on the existing neutral `@netscript/plugin` authoring package.
- Resolution: publish the protocol as `@netscript/plugin/protocol` and re-export from
  `@netscript/plugin`. This preserves the locked D3 decision to defer a standalone
  `@netscript/plugin-protocol` package and avoids any plugin dependency on `@netscript/cli`.

## 2026-06-28 — S4 local-path uses `deno run`, not `deno x`

- Severity: **minor**.
- The S4 brief said the runner builds `deno x <S3-confined-flags> <target>/scaffold <args>` for both
  JSR and local-path sources. A direct Deno 2.9 check showed local files are rejected by `deno x` with
  `Use 'deno run' to run a local file directly, 'deno x' is intended for running commands from packages.`
- Resolution: keep the production JSR shape as
  `deno x <flags> jsr:@scope/pkg/scaffold --context-json <json>`, and use the executable local-path
  maintainer shape `deno run <flags> <local-path>/scaffold.ts --context-json <json>`. This preserves
  D4 plugin-owned scaffolding while making S11's local fixture/userland validation runnable on Deno 2.9.
