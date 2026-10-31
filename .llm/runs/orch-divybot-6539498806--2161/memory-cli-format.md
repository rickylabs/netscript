# CLI wrapper scope

Root formatter config excludes packages/cli. The structured formatter fails closed on dropped selections; CLI member config still inherits the exclusion. Copy only root fmt/lint rules into a project-run style config without include/exclude keys, then pass --config <that-file> to the structured wrappers. Require filesSelected == filesProcessed. The check wrapper includes --unstable-kv by default and rejects it as a wrapper option. Never report the root partial selection as PASS.
