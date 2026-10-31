# Environment

RTK is absent. Docker daemon is unavailable. Reuse the existing extracted native Redis distribution under the project's artifacts directory, its packaged library directory, and an isolated run-owned configuration with persistence disabled. Keep process attached to an exec session; shut down only the run-owned instance. Raw endpoint, process and evaluator session details stay in private project runs, outside Git.

Git commit identity is unset in fresh worktrees. The authenticated GitHub login and baseline commit both identify rickylabs with its GitHub noreply email; use command-scoped git identity flags rather than changing global configuration.
