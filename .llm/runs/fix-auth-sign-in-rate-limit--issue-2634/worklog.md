# Worklog

## Design

Public surface is an optional data-only rateLimit.customRules config, native window/max vocabulary, positive integer validation and path-pattern keys. Lifecycle unchanged. Registry composition forwards the validated section to the existing provider passthrough only for better-auth. Tests observe real production provider rate behavior through a native import-map wrapper, with no product test seam. Documentation states effective default and provider-owned route scope. PLAN-EVAL N/A for this narrow native data passthrough with locked defaults; independent final evaluation required.

Fresh main confirmed b0eb07957 before branch creation. Existing runtime PR2641 has completed source implementation and is awaiting supported CI; this separate implementation starts serially afterward. No source changes yet.


## Red baseline

On unchanged main production source: schema tests have2pass/8fail (section dropped, invalid values/patterns silently ignored). Real production provider tests have1pass/2fail: absent configuration returns400,400,400,429, but both configured styles return400,400 rather than400,429 and omit forwarded customRules. This is actual better-auth Fetch handling, not a fake limiter. HTTP400 is the provider's disabled email/password endpoint response; counting occurs before that validation and no database/account state is needed. The test observes rate429 and captures the exact provider options on the plugin path.

Initial unscoped import-map override was shadowed by workspace package mappings and failed to observe construction; that fixture failure is excluded. An explicit native scope for the real registry module now wraps its provider import and calls the original factory. No product seam was added.
