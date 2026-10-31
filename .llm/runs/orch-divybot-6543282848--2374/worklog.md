# Worklog

## Owner override

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”

## Intake

- Full assignment read; live issue and comments inspected. No orchid-triage comment and no covering PR found.
- Current checkout and fetched main both `14816a409e31505bc528714332b0bf4670be2fcb`.
- Consulted prior run environment and launcher memory. RTK unavailable; plain focused reads and repository structured wrappers used. No connected memory tool exposed; use focused run memory notes.
- NetScript MCP find_guidance followed by search_docs consulted before source design. Generated static registries are the existing declaration-to-runtime seam; application modules must never execute during discovery.

## Design

1. **Public surface:** declared factory saga modules appear in generated runtime maps and root doctor source comparison. Inspector gains explicit declaration metadata; existing options remain compatible.
2. **Domain vocabulary:** saga declaration = config id + project-relative entrypoint; legacy candidate = native-builder module; active declaration excludes opted-out config files.
3. **Ports:** existing ProjectFiles, protocol-2 renderer, host FileSystemPort/ProcessPort and root doctor drift check. No application imports during discovery.
4. **Constants:** existing SAGAS_REGISTRY_PATH and REGISTRY_IGNORE_DIRECTIVE; use named constants for config suffix and declaration callee; @std/path for path policy.
5. **Commit slices:** S0 plan/bootstrap; S1 inspector/generator/docs and proving tests; S2 evidence/handoff. See plan.md for files and gates.
6. **Deferred scope:** evaluating configs/factories and changing host/runtime architecture; declared exports have runtime shape validation at registry load.
7. **Contributor path:** plugins/sagas/src/cli/saga-inspector.ts explains static declaration contract; README documents author usage.

## Reconciliation

Initial fetched main equals checkout; #2509/#2162 empty output and #2161 shared first-line ignore behavior present. No source changes yet.
