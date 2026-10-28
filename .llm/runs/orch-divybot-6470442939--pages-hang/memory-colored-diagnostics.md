# Colored compiler diagnostics and source mapping

Deno in CI inserts ANSI SGR between generated path, line and column tokens. Strip SGR before
matching locations; removing colors after replacing generated paths cannot recover line offsets.
The later-fence compiler regression forces FORCE_COLOR=1, temporarily removes NO_COLOR, then
restores both variables in finally. This reproduces the CI mapping failure locally without
weakening its `page.md:6:` assertion. Use the structured test wrapper with --allow-env or --allow-all.
