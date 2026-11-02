# Scratch tests and runtime proof

Deno's repository test configuration excludes `.llm/tmp`, even when a test path is explicit.
A copied config in that scratch directory cannot list the real workspace members: Deno requires
members to be nested beneath the config's workspace root. Those failed launches prove nothing.
Prefer the ordinary source regression modules and the registered runtime gate's deliberate controls.
The full Docker-backed path is required in CI; do not infer it from local wrapper success.
