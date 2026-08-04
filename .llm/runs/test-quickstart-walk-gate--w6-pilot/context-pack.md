# Context Pack

Issue #1294 requires a published-CLI `quickstart.walk` with seven independent verdicts, post-init service add, bounded Aspire restore/start, docs drift detection, and canary wiring. Plan is locked on baseline `6c3b534f`. The suite/docs slice is committed as `8620b3f2d`; exact-version canary wiring and dual report handling are implemented and YAML-valid. Preserve the unrelated modified `deno.lock`. Next: final gates, independent IMPL-EVAL, acceptance evidence, ready transition.
