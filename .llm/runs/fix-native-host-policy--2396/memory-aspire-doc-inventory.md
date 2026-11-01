# Aspire inventory when adding documentation

A new tracked guide that mentions Aspire changes the manifest read set even when no pin or
runtime changes. Four generated-doc freshness gates do not cover that TSV inventory.
Regenerate with:

    deno run --allow-read --allow-run=git --allow-write=.llm/tools/validation/fixtures .llm/tools/validation/aspire-surface-manifest.ts

Then run the allowlisted aspire-version-parity gate. For this host guide the complete change
is one doc:public-page/S11 row. Preserve the shared scan scope and every existing version,
owner/disposition and compatibility fixture. No version bump or checker relaxation is needed.
CI quality contains more than quality:gate: after parity it runs whole-workspace publication,
cold AI peer compatibility and the critical advisory audit. Check those before spending the
last independent reviewer round. A command receipt proves its own command, not gate sufficiency.
