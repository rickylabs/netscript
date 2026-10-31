# S6a portable native fixture revision proposal

Proposal only. The current Windows qualification is genuine, but delivery is blocked: an
unconditional discovered test must not reject normal Linux CI merely because its fixture embeds
Windows addon paths or requires an explicit DENO_DIR. Keep both tests unconditional. No OS ignore,
skip, discovery exclusion, CI waiver, allow-all child, dependency/lock change or production repair.

Keep the exact two editable owners: `plugins/streams/services/src/tests/test_utils/
service-runtime-fixture.ts` currently260lines/cap300, and `plugins/streams/services/src/
service-runtime_test.ts` currently254lines/cap430. Target revised fixture285-300 and test255-280.
No third resolver/helper owner. If readable implementation exceeds300, return the concrete diff
before expanding scope. All113 protected bindings, S4, production/facade/legacy/README and historical
failure receipts remain frozen. No application of this revision or checkpoint has occurred.

## Audited existing seams

1. Frozen S4/workers already resolve the actual cache with a bounded `Deno.Command(Deno.execPath(),
   {args:['info','--json']})` when DENO_DIR is absent. Deno2.9.7's actual output has `denoDir` and
   `npmCache`. `.github/workflows/ci.yml:233` also uses `deno info --json` to locate its module cache;
   CI runs Ubuntu and performs normal `deno install` before tests. Use this existing protocol,
   not HOME/LOCALAPPDATA/XDG guesses. The generated node-modules verifier was audited; its
   inferCacheRoot fallback guesses paths, so it is not the fixture's resolver.
2. `plugins/streams/package.json` already declares the native server through the root catalog0.3.9.
   Actual `import.meta.resolve('npm:@durable-streams/server@0.3.9')` returned the installed file URL.
   The fixture is inside the owning package, so it can use its existing `@durable-streams/server`
   package dependency rather than adding a dependency or export. `node:module.createRequire`
   `.resolve()` follows that installed package to LMDB3.5.7, msgpackr1.12.1, msgpackr-extract3.0.4
   and node-gyp-build-optional-packages5.2.2 without executing the server or loading an addon.
3. The installed node-gyp-build-optional-packages module exposes `.resolve(directory)`/`.path`.
   Its resolver owns platform, architecture, Deno N-API/ABI and libc selection; its normal callable
   loads the returned addon. Call only `.resolve` for discovery. Do not implement filename/tag
   selection. Current Windows resolution-only evidence succeeded with FFI/net/run/sys denied and
   selected exactly the two already qualified node.napi.node files. No server import/listener ran.
4. Pinned LMDB/msgpackr-extract package manifests declare exact optional packages for win32-x64
   and linux-x64. Linux entries already exist in deno.lock with integrity. Only registry metadata,
   not Linux addon bytes, is present in this Windows cache. No Linux binary or Linux success is
   inferred from Windows evidence and no Linux package was downloaded during this audit.
5. Native Linux selection calls detect-libc2.1.2. It first reads `/proc/self/exe`, then `/usr/bin/ldd`,
   then process report/command fallbacks. Those first two precise read paths are the proposed Linux
   permission addition; use its native detection, not a forced LIBC value or shell invocation.

Actual evidence is under `.llm/tmp/native-host-policy-u1-s6a-portability-proposal-20261028/`:
cache-info JSON, frozen native graph, and `resolve-api.ts`/stdout/stderr. The graph has actual
`npmPackages[*].localPath`, corroborating native resolution; it is not needed in the new fixture.
Audit mistakes are retained: `deno info --cached-only` is unsupported, a PowerShell inline-quote
probe failed parsing, and an ignored-folder module cannot resolve the plugin's package alias.
The final read-only probe used the exact existing npm catalog pin because it lives outside that
package. These are not runtime or Linux qualification results. Installed MCP find_guidance was
called; native source/output supplies the exact API details where broad docs retrieval did not.

## Exact replacement design

**Cache and environment.** Replace explicit-DENO_DIR rejection with one existing bounded info call
using the parent's actual environment before synthetic roots are installed. Validate nonempty
string denoDir and npmCache from parsed unknown JSON; fail on absent fields. Always use those
reported values, including when DENO_DIR was explicitly supplied. Extend the existing runChild
signature to allow no stdin/inherited environment for this one read-only info command, exactly as
the frozen S4 helper already does. No new process runner or shell. Preserve30s/2s/32KiB bounds.

Create scratch and the same cleared child environment. PATH uses the host's standard path delimiter,
the actual Deno executable directory, and Windows system paths only when relevant. No ambient
credential/prebuild/libc overrides pass through. Set the discovered DENO_DIR for runtime children.
Remove the unconditional Windows/architecture guard; native supported-package availability governs
startup. This does not promise support for platforms whose native dependencies have no addon.

**Native discovery, with no FFI.** Reuse the same bounded stdin child before the four factory probes,
with the same synthetic environment and package cwd. It imports only built-in node module/path APIs
and the existing JavaScript binding loader, never the native server/index or native addon. Resolve
the server file URL and follow its dependency graph with createRequire.resolve. Resolve LMDB's
require entry and msgpackr's extract entry; the pinned LMDB `dist/index.cjs` and extract `index.js`
identify their package directories, matching native LMDB's own removal of a final dist directory.
Read/validate each package.json name/version before using those directories. This is a checked
pinned package-layout input to the upstream resolver, not a search through arbitrary filesystem
parents. Packaging drift fails instead of guessing another root.

Call the installed loader's `.resolve` for each directory. Check that the method exists and returns
a path. Resolve the declared platform optional package's package.json through that same owning
require context; validate its name, exact optionalDependency version and os/cpu against native
node process platform/arch. Require the selected addon's real path to stay within that package's
real directory and be a regular file. Reject a local build or executable-adjacent override outside
the pinned optional package. No custom registry-cache layout, guessed Linux filename, recursive
cache search, downloader, build command, package-manager invocation or private field.

Read/hash the selected addon bytes before runtime dispatch and return a small JSON receipt with
package identities/manifests, absolute owner/addon paths, byte counts and SHA256. Exact package
versions/integrity remain owned by the existing frozen lock and normal installer. The new fixture
records the measured per-platform binary hashes; it does not claim a tarball-integrity hash equals
a binary hash. Windows validation must compare both measured hashes against the retained original
c4935003... and6958541c... bytes. Linux supplies its own measured evidence from genuine CI; do not
invent a Linux hash or reuse a Windows hash. This removes the fixture's two hardcoded Windows asset
paths/hash-selection constants while preserving the existing Windows byte evidence as a gate.

**Exact capability changes.** Discovery child has env, existing read roots, sys, deny-net/ffi/run
and no write grant. Runtime child retains env/sys/deny-run, scratch-only writes, exact loopback/
allocator net list and scratch/npmCache/toolchain reads. On Linux alone append read grants for
`/proc/self/exe` and `/usr/bin/ldd` to both discovery and runtime children, matching native detection.
FFI grants are ONLY the two validated, upstream-selected addon file paths. No FFI directory grant,
repository-wide runtime read, broad system read, shell/run grant or LIBC override. If any additional
permission is actually required, retain the failure and return before broadening. Native addons
remain trusted native code; no OS-confinement or minimum-sys claim.

**Runtime test delta.** Preserve every unconditional Deno.test, sanitizer, real auth/status/byte/
isolation/identity/rebind and public-metadata assertion. Expose the validated addon metadata on the
internal sandbox so the FFI-negative assertion matches the exact selected LMDB path on that host,
rather than the Windows basename node.napi.node. The allocator negative remains exact host/port.
No weaker error matching, replacement upstream, conditional pass or altered request expectation.
The discovery receipt and cache-info receipt are separate from factory success/negative receipts;
their success cannot stand in for HTTP qualification. Preserve primary-first failures and actual
status/pipe settlement/removal evidence for discovery and all runtime children.

## Reviewed application and delivery gates

After root accepts this exact revision, implement only these two owners and rerun Windows owning
six tests with ordinary frozen/cached graphs. Require original Windows addon hashes, exact native
permission negatives and both-port rebind evidence; five-file nonempty type/lint/fmt and two-owner
quality; all113 protected hashes; actual source caps; complete child/profile cleanup. The cache
resolver must have no special failure when DENO_DIR is absent. The existing info protocol and Linux
normal-cache execution provide this boundary, without copying caches or changing global config.

After root reads the revised source/Windows results and authorizes its checkpoint, qualify that
exact source SHA on real Linux x64 CI using the existing dependency installation and test wrapper,
with native platform packages supplied by normal CI. Record Deno version, actual cache discovery
and whether DENO_DIR is set; require a genuine unset-DENO_DIR case,6/0/0 unconditional owning tests,
Linux addon manifest/hash receipts, precise native FFI/allocator negatives, listener rebinds and
cleanup. Source hashes must match the reviewed checkpoint. Missing packages or additional native
permissions are a failed qualification, never an ignore or Windows substitute.

CI routing is a real remaining coordination decision: current ci.yml has no workflow_dispatch and
deliberately does not schedule draft-PR jobs. This proposal does not mark PR2421 ready or alter a
workflow. Root must select an authorized genuine Linux CI invocation after checkpoint; until it
actually completes, report Linux qualification PENDING, not portable PASS. No new workflow owner
is silently part of the two-owner fixture revision and no CI waiver is proposed.

Keep previous Windows6/0/0, initial type/report-writer failures and first5/1 metadata-count failure
immutable. `gates-2/arch.report.json` is precisely the SCOPED streams doctrine report0fail/5warn/
1info, not the composite `deno task arch:check` (which includes deps:check/all roots). No full-repo
architecture rerun or broader success claim follows from this revision proposal.
