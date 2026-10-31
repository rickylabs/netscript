# Service adoption validation

At merge head 24c73ee2, the complete structured test run over packages/service,
packages/plugin, and all three changed documentation-tool test owners passed 824/0/0.
The service scoped lint and format wrappers each covered 126 files with no dropped files.
Full service doc lint covered eight entrypoints with zero findings. Native publication
`deno task publish:dry-run --member packages/service` passed; this wrapper copies the
workspace to temporary scratch and does not use a Git worktree in dry-run mode.
`quality:gate` passed both quality:scan and arch:check with pre-existing warnings retained.
All four generated-documentation freshness gates passed without regeneration.
The service's JSR audit has only its existing sanctioned oRPC slow-types informational note.

The upstream shared memory warning about source generation applies when freshness fails;
a clean automatic merge may already preserve both source rows correctly. Check first.
