# Plan

## Profile and verdict

- Archetype 5 — Plugin Package.
- This is a release-gate and scaffold-surface repair; silent public-surface reduction is prohibited.

## Locked decisions

1. Restore the full six-route `createAiRouter` sample and its capability descriptor.
2. Normalize readonly runtime outputs to the mutable v1 wire schema at the sample boundary; do not widen the published contract.
3. Restore both `createAiRouter` assertions and retain the newer chat-response assertions.
4. Add the emitted-sample command explicitly to the enumerated CI workflow.
5. Render both install starter artifacts and every resource with a `defaultInput`.
6. Count all 39 logical emissions while writing identical same-plugin path/text pairs once.
7. Preserve cross-plugin collision failures and reject same-plugin path conflicts when text differs.
8. Run the full scaffold runtime because this slice changes generated application output.

## Gates

- `deno task check:emitted-samples` reports 39 samples with the router present.
- Tests for `plugins/ai`, `plugins/streams`, and `plugins/triggers` execute the restored assertions.
- Scoped check, lint, and format wrappers cover touched roots; no manual `--unstable-kv` argument.
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` proves `behavior.ai-chat-route`.
- Review committed artifacts with `git show`, then push with the explicit refspec and compare local/remote SHAs.

## Risks

- A shallow copy must be sufficient for each readonly outer array returned by the runtime.
- Generic resource rendering must not hide missing default inputs or weaken path collision detection.
- The scaffold runtime is expensive and runs once after focused gates are green.

## Debt and deferred scope

- No new doctrine debt expected.
- No AI contract redesign or package export changes are in scope.

