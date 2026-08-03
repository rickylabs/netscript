## Breaking Changes

- `@netscript/plugin-streams-core` no longer exposes
  `ServiceStreamProducerOptions.assertResolvable`. Remove the option from producer configuration;
  there is no replacement flag. Stream producers now fail fast at startup when no streams URL can be
  resolved, so the former opt-in assertion behavior is enforced by construction.
