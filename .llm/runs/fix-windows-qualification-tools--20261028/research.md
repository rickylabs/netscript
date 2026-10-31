# Findings

- `discoverReferencePagePaths` uses native `join` for returned repository-relative identifiers, while classification mappings use slash-separated identifiers. Windows consequently reports classified pages as uncovered.
- `compileJsdocExamples` materializes isolated modules, then appends every absolute pathname to one `Deno.Command` argv. The Windows command-line length limit prevents checking the full corpus.
- The existing classifier maps diagnostics using original module paths and header offsets. A generated entry module can import every materialized module without changing these mappings or scopes; `deno check` does not execute imports.
- Strict selection refuses zero candidates/checked/materialized modules; root lock is copied into the private temporary root, compared after compilation, and the temporary root is removed in `finally`.
- Installed MCP `find_guidance` and `search_docs` used; guidance confirms agent-tooling corpus ownership but adds no API contract to these repository-local tools. Local owning source is authoritative.
- RTK is absent from this native PATH. Direct git reads and structured Deno wrappers will supply evidence. Initial failed skill-path/read/glob attempts changed no files.

Open decisions: none within the mechanical repair. Downstream corpus diagnostics and missing installed Aspire links/DB identity are diagnostic-only and remain outside the authorized source owners.
