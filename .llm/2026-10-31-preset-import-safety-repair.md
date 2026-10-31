# Preset import safety repair — 2026-10-31

Resume PR #2518 on its existing branch rather than starting over. Code/share decoding is only syntactic validation; init must check the selected built-in theme against the token engine registry before scaffolding. The same check now covers plain, encoded, share-link and JSON forms.

URL transport policy belongs in uiRegistryUrl, which is used for direct registry items and transitive dependencies as well as preset imports. Keeping an inline copy in the preset resolver permits plain-HTTP dependency fetches and ui:add. The shared policy requires HTTPS with exact loopback-host HTTP exceptions.

A later transactional apply guard can hide a missing early guard. The regression must assert zero files after a real public/maintainer init with a schema-valid registry:ui payload. Removing only the early type check fails those assertions even while the command still exits 1.

Public resource evidence keeps verdicts/counts only. Raw leak reporters can rewrite a run-dir Markdown report with foreign-resource identities: sanitize that generated report before staging, as well as keeping the raw command output outside Git.
