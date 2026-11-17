# Resume PR #2611 / assignment #832 — R2 review

Current review entry is **plan-R2.md**, bound by immutable-manifest-R2.json.
Verify both hashes and read dispositions-R2.md and mutation-protocol-R2.md.
R1 stays immutable and **FAIL**; plan-R1-verdict.md is the exact received verdict,
SHA-256 731003f7a6101fa00b594d6578f6232533ac68b2b775427e977bc7a4521d3cb1.
R2 is the next round, not a fresh evaluator lane or a reset. Parent owns review.

Only planning/evidence correction is authorized. Product source/old tests,
dependencies, application runtime, consumers, merge and publication remain fenced.
No evaluator/design agent was launched; no builder self-PASS is asserted.
Independent exact-R2 PASS **and explicit parent product continuation** are still
mandatory before implementing S1. Eric retains every canary/stable package cut.

B1 correction makes the tradeoff explicit: queryUtils always receives TanStack's
signal, so separate query keys/QueryClients require two independent native GET
fetches under the proposed policy. Same-key/same-client TanStack execution sharing
remains. Unsignalled queries factory calls still transport-coalesce; their existing
missing cancellation bridge is deferred. New real public API controls are 2 RED
and 2 GREEN on unchanged source, separate from sealed R1's 5 RED / 5 GREEN.

B2 requires LEAK-S1/S2/S3 content scans and ops/resource sanitizers ON; resource
ownership check maint:leak-check is explicitly not a content scanner. B3 fixes
compiler-0/assertion-RED/exact committed-H restore/restored-GREEN receipt protocol,
actual-method/native POST fallback and catch-all mutations, and innocuous GREEN.
Advisories A1–A5 have explicit dispositions and test/doc obligations.

The next action is the coordinator's independent exact-R2 review, then a separate
explicit product continuation if approved. Do not widen into Garage or consumer
cohort changes. The one R2 public checkpoint goes on existing PR #2611; no second
source #2610 checkpoint, new inbox, branch or PR is needed.
