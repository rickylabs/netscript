# First-party plugin resource identities

Installed backgrounds workers/sagas/triggers have HTTP resources workers-api,
sagas-api and triggers-api; streams is both the canonical plugin and API key.
Persisted manifests expose linking.resourceConfigKey. PluginReferences must name
HTTP resources, not the background processes: an erroneous workers reference
makes even DB-mode AppHost startup fail during helper registration.

The maintainer plugin install command does not accept public --ci or
--skip-confirmation flags. Official plugins need neither; use the common grammar.
The worker listExecutions response deliberately omits correlation and payload;
batchQueryExecutions includes payload for order-specific history projection.

The default cache is Redis. The showcase defaults cache off so SQLite plus local
KV/streams can run without containers; explicit cache/PostgreSQL choices retain
their ordinary infrastructure requirements. Default init keeps its cache default.
