# Emitted app check — 2026-11-01

Invoke the absolute repo `run-deno-check.ts` wrapper with the generated app as cwd and `--root . --ext ts,tsx --deno-arg --unstable-kv`. Running from the repo root inherits its `.llm/tmp` exclusion and yields no matching files. The wrapper takes two separate tokens for --deno-arg. Initial generated application check passes 117 files. Run that before AppHost startup to materialize the generated workspace dependencies: first db-init failed missing zod, then succeeded after the emitted app check installed dependencies.
