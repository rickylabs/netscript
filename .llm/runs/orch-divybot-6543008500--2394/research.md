# Research

Current main is baseline 15cffa2fee5b6d543ecae2981a3563b1b74ca789, including #2421.
Issue comments contain no orchid-triage report; GitHub search finds no existing PR for 2394.
No connected memory or NetScript MCP tool is exposed. Consulted committed environment,
quality-baseline and native-service validation memories. Called the in-repo MCP documentation
flows directly: find_guidance(intent: configure requestLevel/responseLevel for plugin HTTP
services), then search_docs(query: requestLevel responseLevel). Guidance points to telemetry,
services and plugin/service; literal search returned zero matches.

Core seam: PluginServiceConfig.logger -> ServiceBuilder.withLogger -> LoggerMiddlewareOptions.
Native requestLevel/responseLevel each accept 'debug' | 'info'; native errorLevel remains warn.
Five first-party API owners: workers, streams, auth, sagas, triggers. Workers/streams have
existing caller policy options. Workers legacy main delegates to startWorkersService; streams
legacy main starts its factory. Auth/sagas legacy factories currently only accept context.
Triggers create/start already have option arguments and both need forwarding.

F-5 debt is bounded at workers 23 and streams 22 names. No new named type dependencies may
be introduced into these facades. Use documented optional level fields with native literal
unions in existing options; pass them through the native logger config. No aliases or
structural replacement of native auth/listener types. No change to core middleware defaults.
JSR risk: existing full export maps have sanctioned oRPC slow-type debt. New optional literal
fields require no export additions; verify doc-lint and exact facade identity unchanged.
