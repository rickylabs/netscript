# Slice 3.1 — Canvas render hotfix: `_ds_bundle.js` is a platform-reserved path

**Commit:** (see this push)

**Symptom (owner-reported):** every seeded card failed with `⚠ no PascalCase exports in _preview/<X>.js` or `⚠ ReactDOM is not defined`.

**Root cause:** claude.ai/design reserves the `_ds_bundle.js` path — it compiles the uploaded `.tsx` sources into its own format-4 namespace bundle there (sets only `window.NetScriptNSOne_ec262e`; expects `React` as a host global; contains **no ReactDOM** and assigns **no `window.React`/`ReactDOM`/`NSOne`**). Our 1.1MB self-contained runtime at that exact path was silently clobbered, so preview IIFEs threw and card mounts failed. All other uploads (`.html` cards, `_preview/*.js`, `.md`, `.tsx`) are preserved byte-for-byte — verified via `get_file`.

**Fix:**

- Runtime renamed **`_ns_runtime.js`**, CSS closure renamed **`_ns_styles.css`** — non-reserved names, same content and contract (`window.React` / `window.ReactDOM` / `window.NSOne`).
- Touched: `tools/design-sync/mod.ts` (emit + rationale comment), `src/bundle.ts`, `src/traps.ts` (raw-hex source-attribution), `templates/card.html` (both loads), `templates/conventions.md` (runtime contract + explicit "do NOT load `_ds_bundle.js`" warning for canvas agents).
- Rebuild: `deno task design:sync check` **PASS** — parity 44/44, idempotence `9998ab57ac70`, traps unchanged (4×PASS, weak-dts WARN by verdict, render-blank PASS).
- Re-upload: 47 files (`_ns_runtime.js`, `_ns_styles.css`, `README.md`, 44 card `.html`) via `finalize_plan` `plan_ec262e10d4ad451f_4091c6c11b1a` + `write_files` (all `localPath`); stale remote `_ds_bundle.css` deleted; remote `list_files` verified (`_ns_*` present; platform-owned `_ds_bundle.js` / `_ds_manifest.json` left untouched).
- The in-flight pass-1 design agent was re-briefed mid-flight: screens load `../_ns_runtime.js` + `../_ns_styles.css`.

**Drift:** recorded as **D4** (significant, fixed same-day) — the reusable design-sync tool must never emit assets under `_ds_*` names; that prefix belongs to the platform.

Owner: please refresh the Design System pane — cards should now render.
