# Workers logging memory

Actual per-job logs live in plugins/workers/worker (not src/runtime).
Canonical logging is @netscript/logger createWorkerLogger(component), category netscript.workers.component.
WorkerOptions currently has no logger injection; do not add a console adapter or reset app sinks.
The default logger level is debug in development, info in production (unless NETSCRIPT_LOG_LEVEL/NETSCRIPT_DEBUG override).
Use existing dispatcher test fixtures for real runner dispatch without external services.
