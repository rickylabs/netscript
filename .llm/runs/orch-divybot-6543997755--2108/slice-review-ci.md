**Checkpoint 1: S3 repairs approved.** I reviewed the full pending diff against the pushed head (`6a62a6f`) and the gate evidence. The changes are:

- **Inventory and docs provenance:** the six manifest rows and the two-value publish-assets provenance refresh. Both are unchanged from what I passed in rounds 3 and 4, where I recomputed the provenance independently from the docs bundle at each commit.
- **Root cookie alias:** S1 moved the generated sign-in (BFF) module's cookie import from an inline `jsr:` specifier to the bare `@std/http/cookie` alias. The S1 consumer map already declares that alias. But in CI, tests that dynamically import the generated module, and fixture subprocesses that copy the root imports, resolve against the repo's root map. Root `deno.json` now declares the same `jsr:@std/http@^1/cookie` alias. No generated output or runtime behaviour changes.
- **Lock files:** `deno.lock` and `packages/fresh-ui/deno.lock` each gain exactly one `workspace.dependencies` line, `jsr:@std/http@1`. Both locks already resolved `jsr:@std/http@1` before this change (to 1.1.4 and 1.1.2), so no package, version or integrity entry changes. The private-lock and dependency checks in `quality:gate` pass. This is a narrow lock change the fix requires; the PR body must explain it.
- **Pipeline test:** the outdated assertion now checks the current empty-tools template, meaning its comment plus the `Promise.resolve()` no-op.
- **CI attribution:** `ci-failure-analysis.json` traces every red shard to one of three causes, all introduced by this PR: the stale provenance, the cookie resolution, and that one assertion. No auth, CORS or negative control was weakened.

**Carry into checkpoint 2 (not a sign-off blocker)**
- The browser-conformance file is not proven locally. Its final rerun failed all 3 tests, because the browser launcher couldn't be started on this host (a permission error), not on a product assertion. That file holds the real-browser positive test and the controls for a stripped `Secure` cookie and missing bearer forwarding.
- That file failed in CI shard test-3 at `6a62a6f`. So the final verdict needs that shard green at the new head, and nothing may record the file as a local pass.
- Wording to fix in the run record (not a blocker): `drift.md` and `supervisor.md` still have one earlier sentence each saying "no lock change". The paragraphs that follow supersede them.

S3 SIGNOFF: PASS

Subsequent same-source host-only browser rerun: structured wrapper exit0, 3PASS, no failures; retained private log kv2108-ci-browser-verified.log. The permission failure above is historical, and CI test-3 still must pass at the pushed head.
