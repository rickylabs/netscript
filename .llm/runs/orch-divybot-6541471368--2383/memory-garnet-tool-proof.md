# Real local-tool resolver proof

Preparing the pinned garnet-server in one root manifest populates .NET's user-level tool resolver cache for another identical manifest. With fresh command-scoped DOTNET_CLI_HOME and NUGET_PACKAGES, consumer B initially exits 1 with the missing-restore message; restoreRuntimeGarnet in A succeeds; B then executes --help with exit 0 without restoring B. Keep these caches isolated and never delete existing user caches. Pass the repo deno.json explicitly when a Deno proof entrypoint lives outside the workspace, or bare imports such as @std/path do not resolve.

Root lint excludes .llm entirely. Preserve root lint.rules in a temporary external config without excludes, and run the structured lint wrapper with explicit --file selections; require two selected == two processed. Do not report its initial all-excluded refusal as a green gate.
