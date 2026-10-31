# CLI validation scope

Root lint/fmt configuration excludes packages/cli. Prior CLI runs confirm member config inherits that exclusion too. For focused structured wrappers, copy only root fmt/lint settings into a private project-run JSON config without include/exclude, pass --config explicitly, and verify filesSelected == filesProcessed. Check wrapper supports explicit --file and includes --unstable-kv.

Use --no-lock or --frozen for API inspection. Bare deno doc jsr:@std/async/retry adds an unrequested wildcard specifier to deno.lock; revert only that owned specifier addition, preserving every other byte. No dependency version change is needed for retry, which already exists in @std/async 1.5.1.
