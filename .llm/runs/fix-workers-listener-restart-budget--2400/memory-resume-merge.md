# Resume and merge recipes

A dispatched shallow checkout may fetch only FETCH_HEAD when given branch names.
Fetch explicit remote refspecs, then deepen both main and the PR ref until their
actual merge base is available. Do not use --allow-unrelated-histories.
Merge current main into fix/workers-listener-restart-budget, retaining both
WorkerOptions.retryClock and listenerHealthyResetMs. The only textual conflict
is the adjacent retry-clock/listener-budget comments. Verify job-dispatcher.ts
and job-execution.ts match origin/main exactly.

RTK is unavailable on the resumed host. Use focused unfiltered commands and the
structured Deno wrappers. A read-only leak check found unrelated Aspire resources;
they remain untouched. Docker is unavailable; use an isolated Redis process for
ACL refusal tests, with an ephemeral address kept outside public evidence.
