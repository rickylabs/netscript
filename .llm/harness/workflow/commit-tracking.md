# Commit Tracking

Harness runs commit by slice, not by "major section." Each commit corresponds
to one slice from the Design checkpoint in `worklog.md`.

## Slice-Per-Commit Rule

1. The Design checkpoint in `worklog.md` defines ordered commit slices.
2. Each slice names what it introduces and which gate proves it.
3. The generator implements one slice, runs its gate, then commits.
4. Commit messages name what the slice proves, not what it contains.

Good: `Add domain types, ports, and runner engine with passing tests`
Bad: `Add packages/cli/e2e core files`

## After Each Commit

1. Append `commits.md` with the sha and message.
2. Update `context-pack.md` with current state and next slice.
3. If the slice discovered drift, append `drift.md`.

## Commit Log

Path:

```text
.llm/tmp/run/<run-id>/commits.md
```

The log is append-only for the run. Do not rewrite earlier entries unless the
user explicitly asks to rewrite history.

## Dirty Worktree Rule

Before committing, inspect `git status --short`. Do not include unrelated user
changes. If unrelated changes share a file you must edit, read the file and
work with the current content instead of reverting it.

## Commit Messages

Use concise imperative messages. Examples:

- `Add domain vocabulary and runner engine with unit tests`
- `Add scaffold.service suite with end-to-end smoke gate`
- `Add CLI presentation layer and remaining suites`
- `docs: add harness v2 workflow foundation`
