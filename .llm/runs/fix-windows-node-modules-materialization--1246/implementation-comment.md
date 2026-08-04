**[PHASE: IMPLEMENTATION] [STATUS: COMPLETE]**

Commit `671f0ad41` implements the 0.0.5 mitigation:

- generated fail-closed cache-vs-project npm materialization verifier for Aspire and no-Aspire
  scaffolds;
- root `deps:verify` plus root/Fresh dev preflight integration;
- exact generated `engines.deno: 2.9.0` pin;
- generated README recovery commands and upstream link;
- strict executable incomplete/complete fixtures that enforce the no-op law.

Evidence: focused tests `33 passed (19 steps), 0 failed`; scoped check/lint/fmt zero findings; CLI
package suite `595 passed (484 steps), 0 failed`.

The first real consumer smoke found a legitimate false positive: Deno stores `.scripts-warned-*`
bookkeeping in cache package roots without materializing it. The detector now excludes only that
marker prefix; the fixture includes it while still failing on a missing real Babel file.
