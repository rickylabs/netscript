# Drift — docs #1411

No drift from the owner-supplied scope or harness plan. The exact raw whole-tree textual inventory
is 76 prefixes rather than the issue context's earlier 70; semantic classification still confirms
the supplied four defective sites, containing five unpinned install/import specifiers.

Round 2 correction: the first semantic classification was too narrow because it treated the
owner-supplied four-site table as exhaustive. The orchestrator identified four additional
published `deno add` instructions. The authoritative defect definition now covers published
`deno add` / `deno install` / `deno x` commands and import-map values independently of the original
table; final evidence supersedes the first-round defect count.

Round 3 significant scope adjustment (orchestrator-directed): independent verification discovered
a pre-existing `main` defect outside the original #1411 source list. Three published reference pages
omit the Vento+Markdown template engine, and the homepage-only rendered-output gate cannot detect
literal placeholders elsewhere. The orchestrator folded the three front-matter repairs and an
exact full-site rendered-placeholder gate into PR #1412 because they share the docs rendering and
specifier-correctness surface. This is not implementation-caused drift. No package/plugin,
lockfile, corpus regeneration, guard allowance, or root-guard narrowing is authorized.
