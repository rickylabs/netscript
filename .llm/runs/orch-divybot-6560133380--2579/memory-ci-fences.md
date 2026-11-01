# CI compile fixture lessons

The docs service fixture explicitly lists generated service modules in .llm/tools/docs/service-scaffold-support.ts. Adding an imported service template also requires adding it there; docs:snippets compiles 36 fences and catches missing support modules. Keep fixture dependencies canonical instead of adding exemptions.

A runtime template test executed by data-URL import does not type-check emitted test source. Compile the real generated workspace after adding a generated test. The sort query's id-only/computed-key union needs an in guard before accessing amount. Local scaffold.service proves all eight generated service gates without Docker; the owner still requires full scaffold.runtime in CI.
