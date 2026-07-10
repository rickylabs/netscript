# Codex implementation threads — beta6-ship--orchestrator

| Slice | Thread id | Worktree | Branch | Model/effort | Launched |
| --- | --- | --- | --- | --- | --- |
| #409 T8 Flow-B e2e | `019f4e40-a97b-7021-bf0c-ae7e20a9d319` | `/home/codex/repos/ns-wt-409-t8` | `feat/409-telemetry-t8-flowb-e2e` (base `3d1d4960` = main post-T6) | gpt-5.6-sol / medium | 2026-07-11T00:58:08 |
| #561+#564 ui:add e2e | `019f4e40-b1b2-7a31-a048-091559fcca4d` | `/home/codex/repos/ns-wt-561-564` | `test/561-564-cli-e2e-ui-add-ai` (stacked on `feat/258` @ `4b1179ba`) | gpt-5.6-sol / medium | 2026-07-11T00:58:10 |

Steering: `codex exec resume <thread-id> "<message>"` from the matching worktree.
Launch logs: `/home/codex/ns-409-launch.log`, `/home/codex/ns-561-launch.log`.

**Attach caveat (honest status):** launched via direct `codex debug app-server send-message-v2`
child processes (not the Windows-side daemon-managed remote-control path — `wsl.exe` interop is
unavailable from inside WSL, see drift D3/B2). `agentic:codex-status` reports 0 daemon app-server
processes; mobile visibility depends on Codex account thread sync, not verified from here.
