# Research — chore-epic-574-wsl-agentic-runtime-foundation--pr-0a

## Re-baseline

- Carried-in source: issue #575 and the #574 supervisor run.
- Re-derived against integration baseline `b58b4c2a` on 2026-07-10.
- Current WSL baseline:
  - Node `v18.19.1`, npm `9.2.0`.
  - Deno `2.9.0`, Git `2.43.0`, .NET SDK `10.0.109`, Aspire `13.4.6`.
  - Codex CLI/managed binary `0.144.1`; app-server `0.142.5`.
  - Native WSL Claude Code and Gemini CLI are absent.
  - Windows break-glass Claude Code is installed at `2.1.205`.
  - Official current Node stable is `v26.5.0` (2026-07-08); the bootstrap must verify the official
    checksum and install user-locally without disturbing Deno or Codex.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The native ext4 worktree exists on the expected child branch with no upstream. | `git -C /home/codex/repos/netscript-epic-574-pr0a-foundation status --short --branch` and `rev-parse @{u}` |
| 2 | Codex remote control is daemon-managed and listening through the known control socket. | `deno task agentic:codex-status -- --pretty`; anchored process command includes `app-server --remote-control --listen unix://`. |
| 3 | No active Codex implementation app-server worker is attached to this worktree. | `codex-status.ts --worktree ... --pretty` plus active-process inspection. |
| 4 | `launch-codex-slice.ts` enforces the brief contract, no-upstream push safety, native worktree identity, and thread recording. | `.llm/tools/agentic/launch-codex-slice.ts` |
| 5 | The current external `~/launch_slice.sh` does not yet inject a per-launch model/effort override. | `sed -n 1,220p ~/launch_slice.sh` |
| 6 | #576 owns the generic `agentic:runtime` desired-state controller, so #575 must keep its checked-in bootstrap/doctor seam narrow and migration-friendly. | Issue #576 |
| 7 | Gemini authentication must be Google subscription sign-in only; unattended API-key and Vertex paths are forbidden. | Issue #575 and owner directive |

## jsr-audit surface scan

- N/A: PR 0A changes internal `.llm/tools/agentic` tooling and machine-local WSL state, not a
  publishable package/plugin surface.

## Open questions

- None that force rework. Google subscription sign-in and Claude sign-in may require an owner browser
  interaction; the bootstrap must classify that as `AUTH_REQUIRED` and continue every independent
  installation/doctor/rollback check.

## 2026-07-10 Antigravity Reconciliation Research

The owner replaced the future Gemini CLI lane with Google Antigravity CLI (`agy`). Official sources
verify:

- Linux installation is `curl -fsSL https://antigravity.google/cli/install.sh | bash`.
- The installer defaults to `$HOME/.local/bin/agy`, accepts only `--dir`/`-d` and `--help`/`-h`,
  verifies SHA-512, leaves an existing binary untouched, and says regular runs self-update.
- The installer documents no uninstall command; its safe fresh-install instruction is removal of the
  exact installed binary.
- The official README says authentication uses the system keyring, falls back to Google Sign-In,
  opens a browser locally, emits an authorization URL over SSH, and uses `/logout` to clear saved
  credentials.
- The official changelog documents headless `--print`/`-p`; version 1.1.1 makes server failures write
  stderr and return nonzero and fixes subprocess stdin hangs. It also documents
  `--conversation`/`-c`, `--model`, `--agent`, `--sandbox`, `--project`, `--new-project`, and
  `--mode`.
- Antigravity uses both `~/.gemini/config/` and `~/.gemini/antigravity-cli/`; therefore migration
  must preserve `~/.gemini`.

Official sources do not define JSON/JSONL output, a complete exit-code table, a named `agy login`
command, subscription/quota semantics, a stable web-search/citation interface, instruction-file
compatibility, or a Gemini executable/config migration contract. These remain explicit acceptance
canaries.
