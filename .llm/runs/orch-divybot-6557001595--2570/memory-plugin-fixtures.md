# Plugin fixture setup for capability pages

Use an Aspire-enabled generated project when exercising plugin installation. A
no-Aspire project can fail at helper generation after plugin files are written.
Use canonical names for local-path official installs: custom names currently hit
an existing configured-module registration mismatch. This run did not change that
installer behavior.

Auth installation adds the app's auth reference. Other installed runtime plugins
need explicit app references. The supported command used for this fixture is:

`netscript config set NetScript.Apps.web.PluginReferences '["auth","workers-api","streams"]'`

Then request-time capability projection moves from installed-unwired to a real
probe; with no running runtime service it returns unavailable, not ready. AI is
in-process and therefore does not require an Aspire PluginReferences entry.
`--no-samples` AI intentionally emits an empty ai/ai.ts and model references.
