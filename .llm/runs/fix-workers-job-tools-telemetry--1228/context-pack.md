# Context Pack — workers scaffold job tools telemetry (#1228)

| Field | Value |
| --- | --- |
| Branch | `fix/workers-job-tools-telemetry` |
| Baseline | `c384013662169046106ee9dd193ab8972beab3b4` |
| Phase | implementation and caveat closure green; merge-readiness gates pending |
| Profile | Archetype 5 + docs overlay |

The live issue body contains only `(see above)`; the owner's dispatch supplies the operative two
deliverables. Research found duplicated no-op helpers in workers and triggers scaffold assets, real
telemetry primitives ready for composition, five structured caveat markers plus additional unmarked
false claims, and one matching debt row. The locked plan moves the convention to workers core,
keeps scaffold-local imports via thin re-exports, and uses a real OTel provider/exporter regression
test that cannot pass if production defaults are silently inert.

Slice 1 captured the intended RED (no child span exported), then moved the helper contract and
implementation into workers core. The default helper now emits exact active-span events, real
progress events, and real child spans while preserving the runtime progress callback. Both official
plugin scaffold files are thin core re-exports. The focused test is GREEN 1/1 and focused check
passes.

Slice 2 judged the documentation claims individually: all five structured no-op caveats, the
satisfied debt entry, and additional unstructured no-op claims were removed or rewritten. The
console-backed logging limitation and unrelated deployment/stream caveats remain. Caveat-reference,
docs-accuracy, and internal-link gates pass.

Next: commit/push caveat closure, then run merge-readiness gates and composed evaluation.

Foreign state: pre-existing `deno.lock` modification; never stage it.
