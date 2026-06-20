# Commits: sagas-durable-store

Append every commit created during the run immediately after creating it.

Format:

```md
- <commit-sha>: <commit message>
```

## Log

- 60ffb74: feat(sagas): add durable kv saga store
- 39e9bb2: feat(sagas): create durable saga runtime
- 1edfea8: feat(sagas-core): warn on storeless native runtime
- 2095f41: feat(sagas): wire durable runtime into service
- b6e9c9b: feat(sagas): make standalone runner durable by default
- 3f20f70: test(sagas): cover durable runtime restart
