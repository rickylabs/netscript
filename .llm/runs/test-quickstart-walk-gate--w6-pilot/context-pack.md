# Context Pack

Issue #1294 requires a published-CLI `quickstart.walk` with seven independent verdicts, post-init service add, bounded Aspire restore/start, docs drift detection, and canary wiring. Plan is locked on baseline `6c3b534f`. The semantic suite, bounded Aspire helper, Quickstart command update, drift test, and focused tests are implemented and green; workflow wiring is present locally but belongs to the next commit slice. Preserve the unrelated modified `deno.lock`.
