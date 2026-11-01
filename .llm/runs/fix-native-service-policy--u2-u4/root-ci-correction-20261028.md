# Root correction of actual Linux CI prerequisites

Actual CI40620981822 reached the complete merge candidate. Test shards3/5/6 failed before any
test results because four historical qualification diagnostics under this run matched Deno test
discovery. Their captured absolute Windows imports cannot resolve on Linux. These are archived
diagnostic variants, not shipping conformance suites. Retain their exact bytes as `.ts.txt`, with
original path/blob/SHA256 and successor path in historical-diagnostic-archive-map.json. The
original manifest remains historical and unchanged; resolve those four entries through the map.
No live test, assertion or CI discovery rule is removed, skipped, weakened or OS-ignored.

Independent native discovery now finds1266 tests, no historical diagnostics from this run and
all nine changed shipping test owners. All nineteen accepted product/documentation owner hashes
remain exact. Four archive hashes match both original manifest and previous HEAD blobs.

Quality separately failed MCP export-corpus freshness. Root ran the canonical generation task
from a clean package/plugin read set. The generated delta changes exactly two existing rows:
service root and auth expose the already accepted AnonymousRequestMatch/AnonymousRule. All299
surfaces remain; decoded delta has four added declarations and no changed/removed old declaration.
The one generated MCP owner is explicit additional footprint, not a hand-edited API or dependency.
Corpus check passes:35 packages/299 subpaths/8902 symbols, hash
0b5bfcba686348fe5b32ad684156b4335c4dcd4c2fba51f60f1ffaa206f25981.
Seven existing embedded-integrity/export-flow tests pass with ops/resources sanitizers, no ignores.

Source review and raw receipts: ci-correction-evidence-20261028/. No all-CI PASS claim: required
close-gate correctly remains red for incomplete independent IMPL and remaining acceptance boxes.
Root initiates real CI/review before merge acceptance; status:ready-merge remains absent.
The immutable earlier IMPL preparation targets db8b84b5e. A successor must bind this new HEAD,
archive mapping and generated owner before actual independent evaluation. Product behavior and
all nineteen accepted owners remain frozen. Windows mapped-IPv4/cold-gate and final review remain
unwaived pending their actual results. No app, release, dependency/lock or installer action occurred.
