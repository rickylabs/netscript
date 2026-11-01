# Resource ownership report

Read-only leak-check completed. Docker is unavailable through the configured socket.
The reporter found 26 process/AppHost entries outside this run's ownership.
They were left untouched. Raw host-specific diagnostic output is retained privately
in this project's run evidence; it is not published into the repo.

Owned generated Vite processes are identified by exact generated-app cwd and the
executable basename. Only these processes were stopped before regeneration.
