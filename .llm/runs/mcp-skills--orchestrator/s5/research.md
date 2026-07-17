# Research — `@netscript/mcp` S5 doctor aggregation

Re-baselined 2026-07-12 against supervisor-corrected baseline `dd89ced9`. The worktree is clean and includes the S1/S3 doctor flow, shared endpoint resolver, and telemetry probe port.

## Findings

- The accepted package design is Archetype 6 (CLI/Tooling), horizontal `domain → application → presentation/infrastructure`, under existing debt `MCP-A6-V2-SHAPE`. S5 remains inside that shape.
- `doctor-flow.ts` currently performs one telemetry probe and always warns when unreachable. It uses the shared resolver and reports the selected scheme.
- `doctorPlugin()` is not exported from `packages/cli/mod.ts`. Its implementation imports CLI kernel domain, port, and adapter types plus `@netscript/config`; importing it into MCP would create a heavy reverse dependency and a future cycle because S7 composes CLI with MCP.
- The plugin doctor checks are non-trivial (config loading, registered-plugin metadata, workdirs, permissions, runtime config). Reimplementing them violates wrap-don't-reimplement. MCP therefore owns a narrow `ProjectDoctorPort`; the default S5 adapter reports that CLI injection is pending, and S7 supplies the real adapter from the CLI composition side.
- `deno doc --filter inspectAspire packages/aspire/mod.ts` verifies `inspectAspire(target): InspectionReport`. `@netscript/aspire` is a leaf integration package and a clean workspace dependency. Its current string-target inspection is JSON-stable and semantic but shallow; S5 maps it without inventing generic SDK/environment checks.
- Project wiring checks can remain pure filesystem reads behind an infrastructure family: `deno.json` existence/parse/workspace sanity; plugin configuration implies generated registry presence; docs root is informational.
- Existing MCP output schemas are shallow and can add bounded `families` while preserving `checks`, `counts`, `status`, and `endpoint` compatibility.

## Planned JSR Surface Scan

- No new entrypoint is required. New exported declarations reachable through `mod.ts` need explicit return types and JSDoc; internal family implementations remain unexported unless composition needs them.
- Add only the workspace `@netscript/aspire` import; never add `@netscript/cli`. Preserve the lock and prohibit reload.
- The doctor result remains JSON-stable and bounded. Full-export doc lint and package publish dry-run cover declaration and file-list risks.
- Filesystem reads broaden runtime permissions already documented for tests; README must document project-metadata reads and the S7 plugin injection seam.

## Open Questions

None that force rework. Exact generated registry candidates and plugin-config detection will be locked from current scaffold output before implementation.
