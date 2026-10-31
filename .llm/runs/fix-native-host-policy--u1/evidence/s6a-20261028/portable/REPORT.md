# S6a native fixture portability revision: Windows qualified, Linux pending

Implemented the root-approved two-owner proposal `47fd96ba55e143e0cad31c51f3df74e1e31f219c07340bac15ae713590108605`.
No third helper, production, configuration, lock, debt, legacy or workflow edit. Both runtime tests
remain unconditional with all three sanitizers enabled. No checkpoint, push or portable-PASS claim.

| Owner | Lines / cap | SHA256 |
| --- | --- | --- |
| `plugins/streams/services/src/tests/test_utils/service-runtime-fixture.ts` | 294 / 300 | `227414514886bd42086b3e814bd3e4822cdd7e64125b847e6edf453fac927f9c` |
| `plugins/streams/services/src/service-runtime_test.ts` | 256 / 430 | `c93526fe358ccbd67151f31d60a29eacfeaa8833e01f734c3cc30b292bc42054` |

Full source is byte-copied in `fixture.final.ts` and `runtime.final.ts`; `source.diff` contains both
new owners, and `revision.diff` compares against the previously reviewed Windows implementation.
The runtime test delta only strengthens the FFI refusal to require the selected LMDB file's full
path. All auth/status/byte/identity/public-metadata/isolation/rebind assertions remain intact.

## Implementation and authority

The fixture now reads native `deno info --json` through its existing bounded child runner, validates
actual `denoDir`/`npmCache`, and uses portable PATH separation. It does not require DENO_DIR or a
Windows platform, infer a cache layout, or select an addon filename itself.

A separate checked/frozen/cached stdin child resolves the owning installed dependency graph and
calls the installed `node-gyp-build-optional-packages` resolver. It validates LMDB3.5.7 and
msgpackr-extract3.0.4 manifests, their exact declared platform optional dependency, os/cpu, and real
file containment. Receipts include both manifests, selected real paths, byte lengths and SHA256.
This child has deny-net/ffi/run and no write grant. Runtime FFI is the two selected files only.
Linux adds only the reviewed `/proc/self/exe` and `/usr/bin/ldd` reads; native Linux behavior has
not run here. No extra permission was needed for Windows.

The common runner retains 30s/2s/32KiB limits and awaits status, both pipes and stdin. Optional
stdin/environment accommodates the native info protocol; Web `Blob.stream().pipeTo()` closes and
awaits the supplied stdin in place of the manual writer. Discovery failure now invokes the same
owned scratch cleanup as normal disposal, preserving the primary error first.

Installed NetScript MCP `find_guidance` was used before implementation. Exact native source and
resolution evidence remains in the approved portability-proposal folder.

## Actual gates

All wrapper commands and raw outputs are in `gates/execution.json` and sibling logs/reports.
Deno2.9.7, unchanged frozen/cached graph, synthetic profiles, public warm cache; no download/reload.

- Owning suite: **6 passed / 0 failed / 0 ignored**, 10,617ms; original four S4 tests plus two S6a.
- Types: five selected files, one batch, zero failed batches or diagnostic occurrences.
- Lint/fmt: five selected files each, zero failed batches/findings.
- Quality: exact two owners, zero findings, zero allowances.
- **113/113 protected hashes match**; tracked diff empty (the two pending owners are untracked).
- Native selected bytes match prior Windows evidence in all eight addon comparisons:
  LMDB912896 bytes, SHA `c4935003ae448fd7580d9b6dd0410ea8eb29172c65ef8adbebe18ced8275df4e`;
  msgpackr-extract112640 bytes, SHA `6958541c624784dfcebfc4f3c360c57f71cfeedd0530c2393845061729081a08`.
- Fresh allocator refusal: code1, exact `NotCapable` for `0.0.0.0:50179`; no final marker.
- Fresh FFI refusal: code1, exact `NotCapable` for the selected LMDB addon; no final marker.
- Approved and HTTP children: code0, exactly one final marker after cleanup. Actual rebinds:
  approved51853/62390; HTTP50250/61812 and50253/61813. No fixed-port assumption.
- Four cache-info, four discovery and four factory children settled status/pipes/stdin; the absent
  cache control adds two more settled children. All14 captured child results are within32KiB per
  pipe. Seven owned scratch/profile paths were removed and independently verified absent.

## DENO_DIR-absent boundary and retained diagnostic failure

`absent-cache.ts` calls the **actual revised fixture** after removing DENO_DIR, using an empty owned
synthetic default profile. `absent-cache/absent-cache/cache-info.json` proves native info code0,
explicitDenoDir=false, and nonempty native denoDir/npmCache. Discovery then returns code1 with
`Cannot find module 'lmdb'`, as this deliberately empty cache contains no native dependency tree.
No runtime factory or listener starts in this control, and both scratch and profile are removed.

The diagnostic's final error-wording regex expected a literal cache-miss message and therefore
exited1. Its original source, stdout/stderr and boundary receipt are retained without rerunning or
rewriting that failure. This is successful absent-DENO_DIR **cache-info** evidence, not an implicit
warm-cache HTTP success or Linux qualification. The six owning tests above passed independently.

## Preserved scope and handoff

Historical S6a type/report-writer and first5/1 metadata-count failures remain in the old evidence
folder. The existing architecture artifact is precisely the **scoped streams report0fail/5warn/
1info**, not composite `deno task arch:check`; no architecture rerun was made.

Linux qualification remains **PENDING genuine CI** on the root-reviewed checkpoint, including the
normal unset-DENO_DIR case and actual Linux native bytes/negative controls/HTTP/rebind/cleanup.
Root source review precedes any checkpoint or CI delivery action.

`source-proof.json` SHA256: `a7c64c64c87b0d3d019dca7cd4d879c508755b71fc14e2cc1d0ac0391473a826`.
`source.diff` SHA256: `0a34f3b1e195cebc13db691a7d233c45e4caba0c27bbd6374b7caec9b0096120`.
`revision.diff` SHA256: `7d8a32da4b747efcd5b9052e1d362d6ccc75087766ed6070b57247f6d28eb501`.
