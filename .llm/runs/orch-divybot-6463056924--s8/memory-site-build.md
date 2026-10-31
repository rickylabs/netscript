# Docs tasks and baseline

Run docs tasks with `--cwd docs/site` or from that directory. `build` already invokes source-format and rendered-output checks. `verify` also runs links and caveats. Pages CI additionally checks docs exports drift and snippets. Do not replace those gates. Source Markdown/Vento preserve prose formatting and must not be mass-formatted.
