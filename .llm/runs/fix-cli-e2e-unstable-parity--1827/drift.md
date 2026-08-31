# Drift — #1827 CLI/E2E compiler-lib parity

## 2026-08-31 — tooling fallback (minor)

- Expected: read-heavy git/GitHub commands use RTK per repository guidance.
- Actual: `rtk` is not installed or not on `PATH` on host `ai-agents` (`command not found`, exit 127).
- Response: used the `netscript-tools` raw `Deno.Command("git", ...)` ground-truth path and direct
  non-interactive `gh`; no product scope or gate semantics changed.

## 2026-08-31 — production-oracle correction (significant)

- Invalid assumption: `../../../../deno.json` from `packages/cli/e2e/tests/` was treated as the
  production compiler-lib oracle, yielding repository-root order `["dom", "deno.ns", "deno.unstable"]`.
- Supervisor-verified reality: `../../deno.json` resolves to `packages/cli/deno.json`, the correct
  production CLI oracle, ordered `["deno.ns", "deno.unstable", "dom"]`; `../deno.json` is the E2E
  member under repair.
- Impact: RED commit `86443f47a`, GREEN commit `bbed08071`, their gate receipts, and their PR comments
  are invalid. Both commits had already been pushed before the supervisor stop arrived.
- Correction: rewind local history, restore pre-fix E2E `["deno.ns", "dom"]`, amend RED in place
  with the CLI oracle, then produce corrected GREEN `["deno.ns", "deno.unstable", "dom"]`.

## 2026-08-31 — RED working-tree isolation correction (significant)

- Supervisor finding: a focused test run while the working tree already contained the GREEN config
  passed even though the RED commit itself retained the gap; that run cannot prove RED.
- Corrected sequence: rewind to the RED commit, restore only `packages/cli/e2e/deno.json` from
  `HEAD`, verify the config has no worktree diff, then run the exact `--allow-all` focused command.
- Corrected receipt: exit 1, 0 passed / 1 failed; the diff adds only `deno.unstable` between
  `deno.ns` and `dom`.
- Final remote repair is now owner-authorized via `git push --force-with-lease`; plain `--force` is
  forbidden. PR comments must be edited in place after final-freeze evidence exists.

## 2026-08-31 — #1762 proof moved to the originating feature graph

- Initial probes at this leaf's old RED base (`4c0db7fea`) passed both the direct plugin-service
  root and a cold full check. Those are honest negative controls, but they do not contain #1762's
  current feature graph and therefore cannot prove that lane's originating failure.
- The proof was rerun in a disposable detached worktree at #1762 head `686eedb62`. With the
  checked-in pre-fix E2E config, the real initiating root
  `packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts` failed through CLI plugin registry ->
  `packages/plugin/mod.ts` -> `packages/service/mod.ts` -> `health.ts` / `Deno.openKv`.
- The same root and the full 2,974-file check both passed after only the E2E config insertion in the
  disposable copy. No #1762-owned file was edited in either real lane.

## 2026-08-31 — nested desktop fixture lint boundary

- A broad CLI/E2E lint probe selected 185 files but exited 2 with zero lint findings because the
  seven-file `fixtures/desktop-native` standalone config is not a root-workspace member and cannot
  resolve its local `zod` catalog in this invocation shape.
- The Tier-A scoped lint was recut with exactly that nested workspace excluded: 178/178 files
  processed, zero dropped/refused files, zero findings, exit 0. Check and format still covered all
  185 files successfully.
