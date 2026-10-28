# Pages snippet review repairs — 2026-10-28

Continue #2454 in PR #2458 on its original branch, after merging current main normally.
The original timeout repair started a compiler per fence, multiplying graph construction and
changing error accounting. A corpus-level deadline does not require per-entrypoint compilation:
keep one bounded Deno check and use per-fence probes only when diagnosing a timed-out corpus.
Cancellation must stop work rather than start new compiler processes.

Combined compilation restores unread module-graph failure semantics. The README checker also
stops treating an earlier syntax exclusion as justification for a later unexplained failure.
An unknown JSR export after a tolerated type error is now a real regression fixture.

Deadline tests require an independent guard with cleanup, not only an elapsed-time assertion
after an awaited operation. The new five-second fixture watchdog reaps positively owned test
groups. Disabling the production timer fails at that guard; disabling group SIGKILL fails the
surviving-descendant assertion. Normal compiler/process/README/workflow tests remain green.

Record paired timings on the same corpus and host. The repaired compiler is within 3% of main's
warm median here, while the per-fence baseline takes about nine to twelve times as long.
A finite deploy timeout also bounds queue occupancy after build success; successful deploys
took 9–10 seconds, so two minutes provides generous margin.

Keep raw process receipts outside Git. Public evidence contains aggregate results and
repository-relative source references. No new architectural debt is accepted. Full runtime
proof remains an environment limitation when Aspire doctor and Docker are unavailable; report
that limitation explicitly and stop at review readiness without merging or weakening CI.
