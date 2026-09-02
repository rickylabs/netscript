# Drift Log: CLI auth-session typed credential transport

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-09-02 — RTK unavailable on run host

- **What:** The repository-preferred `rtk` output proxy is not installed in this shell.
- **Source:** `rtk git status` returned `command not found` during baseline inspection.
- **Expected:** Read-heavy git/grep commands use `rtk`.
- **Actual:** Focused raw `git`, `rg`, and Deno commands are required.
- **Severity:** minor
- **Action:** accept
- **Evidence:** host `ai-agents`; no product behavior or verdict semantics are affected.

## 2026-09-02 — Mandated CLI lint/fmt wrappers cannot own the requested root

- **What:** The exact requested structured lint and format wrappers exit 2 before producing any
  source finding.
- **Source:** Root `deno.json` explicitly excludes `packages/cli/` from both `lint` and `fmt`. The
  wrappers skip those batches, then treat `packages/cli/e2e/fixtures/desktop-native` as an isolated
  config whose `catalog:` dependency cannot resolve outside the workspace.
- **Expected:** The wrappers select and check `packages/cli` with exit 0.
- **Actual:** Lint: exit 2, 916 selected, 0 diagnostics. Format: exit 2, 916 selected, 0 findings.
  `deno.json`, `packages/cli/e2e/deno.json`, and the fixture config are unchanged from `origin/main`.
  Direct repo-style lint and format checks over all five changed TypeScript files exit 0.
- **Severity:** baseline gate defect
- **Action:** accept for independent evaluator judgment; do not broaden this slice into root tooling
  or E2E fixture ownership.
- **Evidence:** `worklog.md` static gates.

## 2026-09-02 — Workspace import-map experiment reverted

- **What:** An initial explicit CLI import-map entry for `@netscript/plugin-auth-core` caused a
  frozen-lock mismatch and one transient lock entry.
- **Source:** Deno already resolves named workspace members without a package-local mapping, as the
  existing CLI `@netscript/kv` imports demonstrate.
- **Expected:** No `deno.lock` movement.
- **Actual:** The redundant mapping and exact transient lock entry were reverted before the product
  slice was committed. Frozen check/tests and publish dry-run pass with workspace resolution.
- **Severity:** minor, resolved
- **Action:** accept
- **Evidence:** final lock SHA-256
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`; baseline diff empty.
