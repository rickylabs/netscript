# S13 Tier-A slice review — #1724 / PR #1779 (stacked on S10′ `a46ea16d` → S8′ → S6′ → S5′ → main `3e5cbabf`)

## Cycle 1 at `ba989e9a` (8 commits, 68 files, +3235/−145) — 2026-08-30

- Reviewer: Fable 5 medium supervisor (session `session_01Jusn3woxeK5xhCdj6ccooR`); generator: Codex
  · GPT-5.6 Sol · medium thread `01a05348-6d4d-7413-a7d4-da98df0c720e`. The generator's
  self-arranged "IMPL-EVAL" sessions and `evaluate*.md` are informational only (D-65).
- **Substantive:** D-17 resolver exactly as ratified — `explicit` → `netscript_env` → `aspire_port`
  → `aspire_ps` → `default` (`telemetry-endpoint.ts:43-56`), `source` preserved, `aspire ps` read
  behind the injectable `AspirePsDashboardPort` (implementation in
  `infrastructure/aspire-ps-dashboard-reader.ts`), **no `Deno.*` IO in `packages/mcp/src/domain`**
  (A7/A11); no bare `18888` emitted (only two negative test assertions); consumer CI template,
  Windows env adapters, telemetry route template updated; stale-surface rows cleaned; parity
  `--phase 2` implemented with **phase 1 still the default**, `ci.yml` untouched, phase-2 sweep in
  report mode = 24 fails all owned by S1/S3/S9/S11/S4 (as expected before those land), manifest
  regen no diff; generated-consumer import mapping fixed (`fc0a0c8c`, workspace `deno.json` template
  maps the shared reader consumed by `.netscript/aspire-cli.ts`) — in scope.
- **Gates (fork, read-only):** scoped `deno check` 0 diagnostics; raw lint/fmt on 34 changed TS
  files clean; `quality:scan` `[]`; `arch:check` exit 0; `check:assets-barrel`,
  `check:publish-assets`, `agentic:sync-claude:check`, `agentic:check-claude`,
  `check:emitted-samples` exit 0; tests **698/0** across mcp / templates / adapters / constants /
  tools-validation; lint escapes 0/0/0.
- **T-1 (blocking):** `deno task check:mcp-export-corpus` **exit 1** — "MCP export-surface corpus is
  stale": the D-17 exports changed the `@netscript/mcp` public surface and
  `export-surface-corpus.generated.ts` was not regenerated (regen touches only the gz payload +
  sha/size lines). Routed to the same thread as one narrow regeneration commit; sign-off follows at
  the fixed head. Convergence note: this is the same shared carrier S9 regenerated — the sibling
  conflict is resolved by regeneration at the next stack hop (D-54 rule).
- **Not signed off yet** (T-1 open).
