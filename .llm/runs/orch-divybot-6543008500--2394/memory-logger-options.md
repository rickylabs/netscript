# Native request logging seam

PluginServiceConfig.logger feeds ServiceBuilder.withLogger. Request and response levels each
accept debug|info, while errorLevel uses warn|error. LogTape records normalize warn to warning.
Health paths are skipped by default; use service-info '/' for successful request assertions.
serve() calls ensureLogging: a custom configure() memory sink must call markConfigured() first
or listener startup replaces its configuration. Test request and response overrides separately.
Keep factory fields as literal unions to avoid workers/streams F-5 named-type closure growth;
independent PLAN-EVAL approved that choice. Native facade doc-lint is0 on current baseline,
while full plugin export maps already contain findings; measure both separately.
