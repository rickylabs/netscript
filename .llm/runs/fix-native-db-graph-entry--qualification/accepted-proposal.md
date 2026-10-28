# Windows cold DB graph qualification — two-owner proposal only

The cold guard invokes `deno info` with a native `C:\...\consumer.ts` argument. Deno 2.9.7 treats
that as external scheme `c:`: exit 0, one `kind: external` module, no npm packages. This is a path
qualification defect, not evidence of a dependency-version split. Root's otherwise identical
file URL probe uses the same four declared imports and a new cache: exit 0, five modules, no
errors, one `@tanstack/db@0.13.0_typescript@7.0.2` identity. No source/dependency/config changed.

Primary retained controls, all in the service worktree's ignored root-db-cold-20261028 directory:

- graph.json: actual native-drive-path external-only result.
- probe.ts and file-url-graph.json: actual file URL/native cold invocation and complete graph.
- file-url-receipt.json and file-url-stderr.log: exit/modules/errors/identity and downloads.

This proposal has no implementation authority yet. PR 2422 product bytes stay frozen. PR 2424's
five-owner Windows qualification slice stays frozen and is not silently expanded. Prefer a new
branch/PR from the same current main base 1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d in an exact
isolated worktree, for example netscript-native-db-qualification-008, fix/native-db-graph-entry.
Root must initialize that exact worktree with `netscript agent init --with-docs` before dispatch.
The already-initialized Windows tree is inspect-only for this proposal; no branch change was made.

## Exact existing owners and caps

| Owner | Baseline physical lines | Proposed cap | Baseline SHA256 |
| --- | ---: | ---: | --- |
| .llm/tools/deps/check-db-alignment.ts |89|120|1f5bfa4d7c087ac0d2a8505e450dcb4e6cdf6dc798dd711db4e335df02696005|
| .llm/tools/deps/check-db-alignment_test.ts |21|140|70981806aa81a9e701e65f6396170f2aec4e8e30453ac6144d6579b76325dc65|

These exact bytes were read in Windows qualification HEAD 0d5b982b0a3050b94172770a435581c931c93b22,
clean tracked tree. No third source owner, new exported test seam or product API is needed.

## Minimal remedy

1. Add native `toFileUrl` to the existing `@std/path` import and supply `toFileUrl(entry).href`
   as the info entry. Keep native absolute paths for filesystem writes/cache/removal. Preserve
   the four existing declared npm inputs, mixed/fresh-only checks, new per-check cache, existing
   info flags, exit/log behavior and `finally` cleanup.
2. Extend only the existing narrow module projection with optional `kind`. `analyzeDbGraph`
   must reject absent/empty modules and graphs with no actual resolved module (external-only
   or kind-less), even if success-shaped metadata claims exactly one identity. Keep exact-one
   peer-qualified DB identity and unresolved-module checks. Add one specific finding; do not
   add a broad graph-schema validator or reinterpret dependency versions.
3. Keep the original owning test and its assertions. Supply realistic resolved-module metadata
   to its valid/identity fixtures and `kind: esm` to its existing unresolved-module fixture, so
   each original assertion still isolates its intended fault. Add focused explicit-sanitizer
   controls for missing modules, empty modules, external-only modules and a valid resolved graph
   with exactly one identity. No skip, OS ignore, fake npm install, lock rewrite or suppressed error.
4. Add one actual native `deno info` control with a temporary local entry whose path contains
   spaces and `#`, converted with native `toFileUrl`. Use no-config/no-lock/node-modules-dir=none,
   an owned fresh cache and bounded `Deno.Command.signal`; clear its deadline and await output
   before finally removing only its owned temp directory. Assert exact file-URL root, resolved
   esm module and zero module errors. This is native path evidence, not an npm identity proof.
   The actual unmodified/fixed guard executions below are the production argument regression,
   with the real declared npm graph; no exported helper or static source-text assertion is used.

## Meaningful RED, actual GREEN and bounded gates

Before production edits, add the new owning controls and run the selected owning test through
run-deno-test.ts with cached-only/frozen/check, all permissions, ops/resources sanitizers and
trace-leaks. The external-only/empty success-shaped graph controls must fail on the unchanged
analyzer; existing assertions and native normalized-path positive control remain live. Retain
actual counts/errors rather than prespecifying a passing test total.

Also run the exact unchanged cold guard once on native Windows, preserving both mixed/fresh-only
failures and raw graph-category evidence. Root's existing external-only/file-URL traces remain
the cause evidence; do not run more diagnostic variants. After the two-owner change, repeat the
same owning suite and actual cold guard: require nonempty real resolution, exactly one complete
identity in each declared consumer graph, no module errors, exit 0 and normal finally cleanup.
The guard is intentionally a cold network-resolution gate; its inner command does not claim
cached-only/frozen behavior. Keep the outer source/test/tooling config and locks unchanged.

Run selected two-file check/lint/fmt wrappers, require real nonempty counts, and the existing
dependency-tool test directory if it remains bounded/nonmutating. Run composite arch:check once
after the real cold guard passes; preserve every result, including any independent downstream
failure. Do not rerun service/publication/app/CEF/installer gates or expand the dependency scope.
Audit all two-owner bytes/caps plus protected locks/config/declarations and both frozen PR source
sets before root source acceptance. No commit/push until that source review.

This is native Sol straightforward implementation; PLAN-EVAL N/A is justified by fixed graph/path
qualification behavior. Independent IMPL remains a separate session/vendor, straightforward
GLM 5.3 Flash/provider default through the pinned matrix after root packet/expense review. No
inference, workaround, dependency change or waiver is authorized by the proposal. Windows/Linux
and cold-gate claims are limited to the actual accepted native results.
