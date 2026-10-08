# Documentation baseline comparison

Untouched post-main-merge baseline 17dbd8ba and working tree both return exit 1 for full Fresh doc:lint. Both have exactly 43 errors: 26 private-type-ref and 17 missing JSDoc, with identical per-entrypoint breakdowns. Streams has 10 in both. No new documentation diagnostic introduced. The scoped JSR audit and Fresh publish dry-run return exit 0. Existing route-contract debt and upstream public type references are unchanged; unrelated repairs deferred.
