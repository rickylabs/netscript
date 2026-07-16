# Drift Log — S4 trace intelligence

Append-only.

## 2026-07-12 — corrected baseline

- **Expected by brief:** `30fd0288`.
- **Actual and supervisor-authorized:** `dd89ced9`, which contains the former plus S4/S5 briefs.
- **Severity:** minor.
- **Action:** Treat `dd89ced9` plus existing telemetry aggregation as the passing preflight.

## 2026-07-12 — Deno doc workspace alias invocation

- **Expected:** `deno doc @netscript/telemetry/attributes` resolves the workspace alias from the root.
- **Actual:** Root invocation treated the alias as a filesystem path; the exported constants were verified through the package source/export surface and the scoped type-check.
- **Severity:** minor; tooling-only.
- **Action:** Used canonical exported `NetScriptJobAttributes` and `KVAttributes`; no string duplication for NetScript value attributes.
