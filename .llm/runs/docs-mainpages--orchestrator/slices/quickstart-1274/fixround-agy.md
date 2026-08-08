# Documentation Fix Round Report — NetScript Quickstart (#1274)

- **Agent:** Antigravity (AGY)
- **Worktree:** `/home/codex/repos/ns-quickstart` (`docs/quickstart-1274-work`)
- **Target Files:**
  - `docs/site/quickstart.vto`
  - `docs/site/tutorials/storefront/01-scaffold.md`
- **Verification Gates:**
  - `cd docs/site && deno task build` — PASS (617 files generated)
  - `cd docs/site && deno task check:links` — PASS (32,776 internal links across 220 pages — all resolve)
  - `git checkout HEAD -- deno.lock` — Restored cleanly

---

## Executive Summary

This fix round updates the Quickstart (`docs/site/quickstart.vto`) and synchronizes the Storefront tutorial (`docs/site/tutorials/storefront/01-scaffold.md`) to serve as the definitive entry point for wave-6 demo agents and human developers alike. Every command, flag, path, and schema claim was verified against `packages/cli` source and live `--help` output on Deno 2.x.

---

## Detailed Findings & Changes Made

### 1. Verification Gate Alignment (Audit Blocking-1 / Major-6 / Major-7 / Prompt Correction 1)
- **Context & Fix:** With PRs #1287 (catalog showcase) and #1290 (scaffold `deno task check`) merged on `main`, the verify gate checklist is six-of-seven green on clean scaffolds.
- **Changes in `quickstart.vto` and `01-scaffold.md`:**
  - Updated the 7-item checklist to accurately reflect current green status on fresh scaffolds.
  - Kept the hard rule: *"Do not begin customising until every box is ticked. An unverified base makes every later failure look like your code."*
  - Noted that `/design` returns an HTTP 302 redirect to `/design/composition`, requiring `curl -L` for scripted/headless checks.
  - Added an explicit note in the triage callout for the intermittent `aspire restore`/`start` timeout (#1227 open P0: `Failed to prepare: A task was canceled`), advising readers to re-run the start command if encountered.

### 2. Contract Derivation & `@database/zod` Truth (Audit Blocking-2 / Prompt Correction 3)
- **Context & Fix:** PR #1299 restored `@database/zod` in `deno.json` to `./database/<engine>/schema/.generated/zod/crud.ts`, which exports multi-model schemas (`<Model>Schema`, `<Model>CreateInput`, `<Model>UpdateInput`) for all schema models.
- **Changes in `quickstart.vto`:**
  - Rewrote the database contract derivation section to describe `crud.ts` as the NetScript-owned aggregate barrel exported via `@database/zod`.
  - Showed contract derivation by picking and extending fields from `DatabaseUserSchema` from `@database/zod`.
  - Dropped all legacy single-model and `#1254 no longer applies` phrasing.

### 3. Non-TTY `aspire start` & Headless Inspection (Audit Major-1 / Major-9 / Prompt Correction 4)
- **Context & Fix:** In non-TTY environments (such as CI jobs or AI agent tool calls), `aspire start` detaches in the background without holding a foreground terminal or printing a one-time login token (tracked in #1306).
- **Changes in `quickstart.vto` and `01-scaffold.md`:**
  - Added explicit instructions explaining non-TTY behavior for `aspire start`.
  - Guided headless/agent readers to use MCP tools (`get_app_status`, `doctor`, `list_api_services`) to inspect running resource graph status and discover dynamic ports/urls without requiring a browser or terminal login token.

### 4. Cold-Start Timeout Budget Alignment (Audit Major-2)
- **Context & Fix:** `aspire start` from `aspire/` omitted `ASPIRE_CLI_START_TIMEOUT=300`.
- **Changes in `quickstart.vto`:**
  - Replaced raw `aspire start` in section 3 with:
    ```sh
    cd aspire
    aspire restore   # once per machine
    cd ..
    deno task aspire:start
    ```
  - Documented that `deno task aspire:start` is what the CLI's printed next steps recommends, setting `ASPIRE_CLI_START_TIMEOUT=300` for initial container pulls.

### 5. Aspire Restart on `service add` (Audit Major-3)
- **Context & Fix:** Adding a service regenerates Aspire helper files under `aspire/.helpers/`, but a running AppHost does not pick up new services automatically.
- **Changes in `quickstart.vto`:**
  - Added an explicit note following `service add` explaining that the running AppHost must be restarted (`aspire stop --apphost ./aspire/apphost.mts` and `deno task aspire:start`) to pick up newly added services.

### 6. Teardown Hygiene (Audit Major-4)
- **Context & Fix:** PR #1301 retired ephemeral database AppHosts, so one-shot DB commands clean up their own AppHost files.
- **Changes in `quickstart.vto`:**
  - Simplified teardown instructions to stop the primary AppHost via `aspire stop --apphost ./aspire/apphost.mts`.
  - Noted that the Postgres container is declared `Persistent` in `appsettings.json`, surviving AppHost shutdown, and can be stopped with Docker (`docker stop`/`docker rm`) when needed.

### 7. UI Generator & Component Registry Leverage (Audit Major-8 / Major-5)
- **Context & Fix:** The Quickstart previously omitted the `ui:*` command family and failed to highlight that `apps/dashboard/components/ui/` comes pre-populated with ~60 component templates.
- **Changes in `quickstart.vto`:**
  - Added a dedicated subsection: *UI component library and generator leverage*.
  - Introduced `netscript ui:list` to inspect pre-populated registry components (`data-table`, `stats-grid`, `empty-state`, etc.) before hand-writing UI code.
  - Documented `ui:add <item>`, `ui:update`, and `ui:remove`.
  - Added type-checking guidance for generated `.tsx` files: `deno check --unstable-kv "apps/dashboard/routes/orders/index.tsx" "apps/dashboard/routes/orders/(_islands)/OrdersIsland.tsx"` (since `deno task check` targets `.ts` files).

### 8. First-Hour CLI Command Reference (Audit Major-13)
- **Context & Fix:** CLI commands were scattered across sections without a centralized reference table or link to `/cli-reference/`.
- **Changes in `quickstart.vto`:**
  - Added a *First-hour CLI command reference* table collecting all essential CLI commands.
  - Linked directly to the full [CLI reference](/cli-reference/).

### 9. Project Tree Accuracy (Audit Minor-15 / Gate 4 drift-1)
- **Context & Fix:** Tree views omitted key root files and app files (`client.ts`, `utils.ts`, `tests/`, `appsettings.json`, `AGENTS.md`, `.mcp.json`, `package.json`, `node_modules/`).
- **Changes in `quickstart.vto` and `01-scaffold.md`:**
  - Updated the annotated project trees to include all key files with explicit file role markings (`[owned]`, `[generated]`, `[guidance]`, `[owned config]`, `[CLI-managed]`).

### 10. Statement of Verification (Audit Minor-17)
- **Context & Fix:** Added explicit verification text at the bottom of `quickstart.vto`:
  > *Note: All commands, flags, and paths on this page have been verified against NetScript CLI source and live `--help` output on Deno 2.x (Linux and Windows).*

---

## Verification & Site Gates

1. Built site: `cd docs/site && deno task build` → PASS (617 files generated in 8.59 seconds).
2. Checked internal links: `cd docs/site && deno task check:links` → PASS (32,776 internal links across 220 pages — all resolve).
3. Restored `deno.lock`: `git checkout HEAD -- deno.lock` → Restored cleanly.
