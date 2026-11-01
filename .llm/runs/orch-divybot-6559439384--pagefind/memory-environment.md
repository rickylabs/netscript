# Reuse these recipes

Deno 2.9.7 is installed; RTK is absent in this worker. Existing #2451 and S7 memory notes gave the native docs build and full browser matrix. Run `deno task --cwd docs/site build`; the strict checker runs it twice. The docs site is a separate Deno workspace; `deps:latest` is a root task whose discovery excludes docs/site. For a transitive Lume pin, invoke the existing latest.ts wrapper against a tiny external probe deno.json containing that exact transitive specifier. Keep its manifest/output outside Git.

Use `deno info --no-lock` for remote module inspection from the root: without it, inspecting Lume's graph adds unrelated root-lock entries. Inspected and restored that command's own additive root-lock delta before any commit. Do not delete locks/caches.

Full scaffold.runtime attempt fails at Aspire doctor and cleanup because Docker daemon is inaccessible. Read-only leak-check reports 24 unproven preexisting resources; do not mutate them. This is an unproven CLI runtime, not a passing/skipped test. Docs path classifier may legitimately skip hosted scaffold jobs, which is separate from that failed local attempt.

Browser binaries are cached but native shared libs are missing. `playwright install-deps --dry-run` confirms missing dependencies, no sudo is available. Prior S8 memory has the same recipe: use apt-get download + dpkg-deb extraction into local project evidence, add transitive drm/wayland-server/Xi dependencies, and apply that library directory only to browser runtime commands. No system/cache mutation or test allowances required. Preserve failed launch report separately, then rerun the entire Utility suite.

Optional deps:audit at high exits1 with existing markdown-it/linkify/sharp advisories. Baseline copied manifest/lock produces exactly the same advisory IDs/count (6 high,10 total). Other package nodes and integrity hashes unchanged. This Pagefind upgrade introduces none; unrelated Lume dependency remediation remains outside scope.
