# deno#35546 — "deno publish rejects text imports, --dry-run accepts them": root-cause analysis & fix proposal

**Date:** 2026-07-17
**Sources examined (shallow clones at HEAD):**
- `denoland/deno` @ HEAD (deno_graph dep pinned `=0.110.1`, `Cargo.toml:98`)
- `denoland/deno_graph` @ HEAD (crate version 0.110.2)
- `jsr-io/jsr` @ `8f94a38` (2026-07-10; deno_graph dep pinned `=0.109.0`, `api/Cargo.toml:98`)

## TL;DR

The error is **not raised by the Deno CLI at all**. It is raised **server-side by the JSR registry backend** (`jsr-io/jsr`), whose publishing-task analyzer builds its own `deno_graph` module graph with `unstable_text_imports: false`. The CLI's `--dry-run` is green because dry-run stops immediately before the upload — the entire client-side pipeline (graph build, publish diagnostics, tarball) is **identical** for dry-run and real publish, and the client-side graph has text imports enabled. The minimal fix is a **2-line change in `jsr-io/jsr` `api/src/analysis.rs`** (`unstable_text_imports: false → true` at both build sites), plus a publish integration test. Deno CLI needs no code change; issue #35546 is filed against the wrong repo and effectively belongs in `jsr-io/jsr`.

---

## 1. Root-cause chain (with citations)

### 1.1 The client side is NOT where the graph fails

- `deno publish` and `deno publish --dry-run` share **all** preparation. In `cli/tools/publish/mod.rs` (`publish()`):
  - Both paths run `publish_preparer.prepare_packages_for_publishing(...)` (graph build + type check + diagnostics + tarball) — `cli/tools/publish/mod.rs:174-181`.
  - Both run `diagnostics_collector.print_and_error()` — `mod.rs:183`.
  - **Dry-run returns right after listing the tarball files** — `mod.rs:202-215` (`if publish_flags.dry_run { ...; return Ok(()); }`).
  - Real publish continues into `perform_publish(...)` — `mod.rs:217-224`. **This is the sole divergence point**, and everything past it is network I/O against the registry.
- The client-side graph is built through the main CLI graph builder, which **enables text imports unconditionally** (stabilized by denoland/deno#34238, Deno 2.8):
  - `cli/graph_util.rs:929-930`:
    ```rust
    unstable_bytes_imports: self.cli_options.unstable_raw_imports(),
    unstable_text_imports: true,
    ```
- The publish *diagnostic* layer (post denoland/deno#34692) also only flags `type: "bytes"`, never `text`:
  - `cli/tools/publish/graph.rs:169-179` — comment "text imports are stable, but bytes imports are not yet"; the `UnstableRawImport` diagnostic is pushed only for `attributes.get("type") == Some("bytes")` (it is `DiagnosticLevel::Error`, `cli/tools/publish/diagnostics.rs:195`).
- **The failing error string does not exist in the Deno CLI.** `grep -rn "failed to build module graph" cli/` returns nothing in `denoland/deno`. The CLI merely relays it:
  - `publish_package()` uploads the tarball, then polls `publish_status/<task-id>` until the task reaches `success`/`failure` — `cli/tools/publish/mod.rs:1102-1122`.
  - When the task carries an error, the CLI prints the **registry's message verbatim**: `mod.rs:1124-1127`:
    ```rust
    if let Some(error) = task.error {
      bail!("{}", error.message);
    }
    ```
  - So `Failed to publish @netscript/...: failed to build module graph: The import attribute type of "text" is unsupported. Specifier: file:///...` is `"Failed to publish ..."` (CLI context) + `task.error.message` (registry).

### 1.2 The server side (jsr-io/jsr) is where the graph fails

- Error type and prefix: `jsr/api/src/tarball.rs:643`:
  ```rust
  #[error("failed to build module graph: {}", .0.to_string_with_range())]
  ```
  (`PublishError::GraphError`, error code `"graphError"` at `tarball.rs:742`.) This is the **only** place in either codebase that produces the `failed to build module graph:` prefix.
- The publishing task pipeline: `POST /scopes/.../versions/...` → `process_publishing_task` (`api/src/publish.rs:188`) → `process_tarball` (`api/src/tarball.rs:102`) → `analyze_package` (`api/src/tarball.rs:340` → `api/src/analysis.rs:79`).
- `analyze_package_inner` builds a fresh `deno_graph::ModuleGraph` over the uploaded tarball files and **explicitly disables raw imports** — `api/src/analysis.rs:143-175`:
  ```rust
  let mut graph = ModuleGraph::new(GraphKind::All);
  graph.build(roots, vec![], &SyncLoader { files: &files },
    BuildOptions {
      ...
      unstable_bytes_imports: false,   // analysis.rs:166
      unstable_text_imports: false,    // analysis.rs:167  ← THE BUG
      unstable_css_imports: false,     // analysis.rs:169
      ...
    }).await;
  graph.valid().map_err(|e| PublishError::GraphError(Box::new(e)))?;  // analysis.rs:173-175
  ```
- A second, identical omission exists in `rebuild_npm_tarball_inner` (admin/maintenance path that re-analyzes published versions) — `api/src/analysis.rs:566-609`, flags at `analysis.rs:602-605`.

### 1.3 Where deno_graph raises the error

In `deno_graph` (`src/graph.rs`, semantics identical in 0.109/0.110):

- An import whose every occurrence carries an asset attribute (`type: "text"`/`"bytes"`) is classified as an **asset load**: `is_asset = dep.imports.iter().all(|i| i.attributes.has_asset())` — `src/graph.rs:3040` (also 2706, 3087).
- On load, asset imports hit the gate in `load()`/`load_with_redirect_count`:
  - `src/graph.rs:5542-5563`:
    ```rust
    if let Some(attribute) = &options.maybe_attribute_type {
      let is_allowed = match attribute.kind.as_str() {
        "bytes" => self.unstable_bytes_imports,
        "text"  => self.unstable_text_imports,   // graph.rs:5545
        "css"   => self.unstable_css_imports,
        _ => false,
      };
      if !is_allowed {
        // inserts ModuleErrorKind::UnsupportedImportAttributeType into the graph
      }
    }
    ```
  - The builder's flags come straight from `BuildOptions` (`src/graph.rs:1697` field, threaded at 4638/4675).
- The message format matches the reported failure exactly — `src/graph.rs:625-629`:
  ```
  The import attribute type of "{kind}" is unsupported.\n  Specifier: {specifier}
  ```
  `graph.valid()` surfaces it; JSR's `to_string_with_range()` appends the `at file:///...:line:col` referrer.
- (For completeness: there is a second, parse-time gate at `src/graph.rs:3259-3275` which always allows `"json" | "text" | "bytes"` — that one is *not* the failing check; the asset-load gate above is.)
- When allowed, the asset becomes `Module::External { was_asset_load: true }` (`src/graph.rs:1361-1368`, slot creation at 1586) — no content is parsed; the loader is only used to confirm existence.

### 1.4 Why --dry-run "lies"

`--dry-run` cannot observe the failure because the failing computation **runs on JSR's servers, after upload, after auth**. The divergence is architectural, not a missing flag on a second client-side graph: there is no second client-side graph (the tarball in `cli/tools/publish/tar.rs` is built from the file list, not from a re-parse). Also note the reporter's own follow-up comment on #35546 guesses the gap is in "the publish tarball graph builder" in the Deno CLI — the evidence above shows that's incorrect; the gap is JSR's backend analyzer. Relatedly, Deno's spec test `tests/specs/publish/raw_imports/` (from #34692) runs against Deno's **mock** test registry, which never executes JSR's analyzer — so no deno-repo test can catch this class of divergence.

### 1.5 Version note

JSR pins `deno_graph = "=0.109.0"` (`api/Cargo.toml:98`). The `unstable_text_imports` field exists there (JSR's `BuildOptions` literal compiles with it), so **no dependency bump is required** — only the flag value. Deno CLI is on 0.110.1. The field name is still `unstable_*` in deno_graph even though the CLI stabilized text imports; the CLI simply passes `true` unconditionally (`cli/graph_util.rs:930`).

---

## 2. Minimal fix proposal (concrete)

**Repository: `jsr-io/jsr`. File: `api/src/analysis.rs`. Diff: 2 lines.**

```diff
@@ analyze_package_inner (line ~167)
-        unstable_text_imports: false,
+        // text imports are runtime-stable since Deno 2.8 (denoland/deno#34238)
+        unstable_text_imports: true,
@@ rebuild_npm_tarball_inner (line ~603)
-        unstable_text_imports: false,
+        unstable_text_imports: true,
```

Why this is sufficient and safe downstream (verified in the JSR codebase):

- **Loader:** `SyncLoader` (`api/src/analysis.rs:461-493`) serves any `file:` path from the uploaded tarball's file map, so the asset (e.g. `README.md`, `toast.ts` imported as text) is found; a text-imported file *excluded* from the publish set still correctly fails as "Module not found".
- **Module representation:** allowed text imports become `Module::External { was_asset_load: true }`. JSR already has exhaustive-match arms for `Module::External` everywhere it walks the graph (e.g. `api/src/api/package.rs:2527-2530, 2547-2550`, returning `None` for size/media-type — correct for assets).
- **Dependency collection:** `collect_dependencies` (`api/src/analysis.rs`) allows the `file` scheme explicitly, so asset modules pass.
- **npm tarball:** `create_npm_tarball` skips non-JS modules (`let Some(js) = module.js() else { continue }`, `api/src/npm/tarball.rs:126`), so External assets can't break it; the asset file itself still ships because `NpmTarballFiles::WithBytes(&files)` includes all package files.
- **Docs / fast-check:** doc generation and fast-check operate on JS root modules; assets are leaves and unparsed.

### Test strategy

- **jsr repo (primary):** `api/src/publish.rs` already contains publishing-task integration tests asserting `"failed to build module graph: ..."` messages (e.g. `publish.rs:1111, 1371-1421`) — use those as the template, inverted: publish a package whose `mod.ts` does `import a from "./a.txt" with { type: "text" };` and assert the task reaches `success`; assert the asset appears in the version's file listing. Add a negative twin for `type: "bytes"` (should still fail while bytes remain unstable) and one for a text import pointing at a non-included file (expect "Module not found", not "unsupported").
- **deno repo (optional, cross-repo guard):** `tests/specs/publish/raw_imports/` (from #34692) can't exercise JSR's analyzer (mock registry). If Denoland wants an end-to-end guard, it belongs in jsr's CI (which can spin the real API) — worth stating in the PR description so the #34692-style "dry-run-only test" gap isn't reintroduced.

### What to do about #35546 itself

The deno-repo issue should be transferred to (or mirrored in) `jsr-io/jsr` — no deno CLI change fixes it. Related JSR issues that this unblocks/touches: jsr-io/jsr#987 ("Ability to export assets") and jsr-io/jsr#293 / #1245 (CSS/static assets).

---

## 3. Alternatives considered

1. **Fix in Deno CLI** — not possible; the CLI already enables text imports everywhere client-side and only echoes the server's task error (`cli/tools/publish/mod.rs:1124-1127`). Re-adding a client-side error diagnostic for text imports would "make dry-run honest" by breaking a stable feature for everyone — rejected.
2. **Fix in deno_graph** — one could rename/stabilize the flag (`unstable_text_imports` → default true), which would flip JSR's behavior on its next dep bump. Larger blast radius (LSP and `deno doc` currently pass `false` deliberately in some paths: `cli/lsp/diagnostics.rs:632-633`), and it silently changes semantics for all embedders — not the minimal fix, though a reasonable follow-up once text is considered permanently stable.
3. **Also enable `unstable_bytes_imports`/`unstable_css_imports` server-side** — policy decision for the JSR team. Bytes is still CLI-gated (`--unstable-raw-imports`, and `deno publish` errors on it via `UnstableRawImport`), so enabling it server-side would let non-CLI clients publish packages the CLI itself rejects. Recommend text-only now, matching the stabilization boundary.

## 4. Risks & caveats

- **npm compatibility mirror:** JSR transpiles JS/TS for its npm tarball but does not rewrite import statements' attributes; a published package using `with { type: "text" }` will not run under Node from the npm mirror (Node supports only `type: "json"`). This does **not** block publishing, but such packages' npm-compat story degrades. It may be why the flags were left `false`; the PR should surface this explicitly (options: accept degraded npm compat + score it, or later add a transpile step that inlines text assets for the npm tarball).
- **Registry rollout lag:** even after the jsr fix merges, jsr.io must deploy it; self-hosted JSR instances stay broken until they update.
- **`rebuild_npm_tarball_inner` must be patched too** (analysis.rs:603), or admin re-analysis of a text-import package would fail after the primary path starts accepting them.

## 5. Ratings

- **Fix location:** `jsr-io/jsr` → `api/src/analysis.rs:167` and `api/src/analysis.rs:603`.
- **Diff size:** 2 lines of production code; ~100-200 lines of tests.
- **Complexity:** trivial. **Risk:** low for publish correctness; moderate policy question on npm-compat expectations (documented above).
- **User workaround until deployed:** none server-side; client-side, inline the asset into a generated `.ts` string constant (as noted in the issue) or keep text-import-using modules out of published exports' graphs.
