# 2026-10-31 — KV-only composition includes streams

Workers and sagas declare @netscript/plugin-streams as a composition dependency. A consumer installing only workers/sagas/triggers/auth fails generate plugins with Invalid plugin composition. Install streams with --no-db --no-samples as well; assert its readiness alongside the requested plugins. This is a KV dependency, not SQL.
