**[PHASE: IMPL] [SLICE: S2]**

The obsolete “No single app-wide shutdown orchestrator yet” call-out, marker, and matching debt row
are removed. The guide now uses `createRuntimeHost()` as the combined-app path. Still-valid signal,
Windows, failure-reporting, kill-grace, and storage-order warnings remain and are clarified rather
than erased.

Evidence: service suite 90/0; focused host tests 3/0; scoped wrappers clean; JSR audit PASS; publish
dry-run success; doc lint clean across all three entrypoints; quality gate exit 0; docs links and
accuracy pass; retired marker/title/debt id search has zero matches.
