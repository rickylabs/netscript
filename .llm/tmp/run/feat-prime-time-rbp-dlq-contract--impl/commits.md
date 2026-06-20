# Commits: <target>

Append every commit created during the run immediately after creating it.

Format:

```md
- <commit-sha>: <commit message>
```

## Log

- `<sha>: <message>`
- ba772b2: feat(queue): add dead letter store contract
- f39dab7: feat(queue): add kv dead letter store
- afc9b3f: feat(queue): add provider dead letter stores
- 5ed7f06: feat(queue): route kv polling dlq through store port
- 592754b: feat(queue): dead letter postgres and redis nacks
- 52e6b1b: feat(queue): dead letter fedify adapter nacks
- 5fcb4c7: feat(queue): thread dead letter store through factory
