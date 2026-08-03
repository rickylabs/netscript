# NetScript consumer agent tools

`netscript agent init` installs the eight entrypoints below. Everything else in the framework
repository's `.llm/tools/` tree is maintainer-internal unless it appears in `consumer-tools.json`.
Run commands from the initialized project root; each tool resolves generated output against that
root, not the caller's previous working directory.

| Symptom                                          | Tool                                    | Run                                                                                                                           |
| ------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Type errors, or a suspiciously green check       | `run-deno-check.ts`                     | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --pretty`                                     |
| Broad lint output hides findings                 | `run-deno-lint.ts`                      | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --pretty`                                      |
| Published APIs may lack docs or use slow types   | `run-deno-doc-lint.ts`                  | `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages --pretty`                                  |
| Generated Aspire apps collide on host ports      | `validation/check-aspire-host-ports.ts` | `deno run --allow-read .llm/tools/validation/check-aspire-host-ports.ts packages --pretty`                                    |
| A focused architecture-quality scan is needed    | `quality/scan-code-quality.ts`          | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages --pretty`                                      |
| Stable dependency versions may be stale          | `deps/outdated.ts`                      | `deno run --allow-read --allow-env --allow-net .llm/tools/deps/outdated.ts --pretty`                                          |
| An unexpected dependency needs its import chain  | `deps/why.ts`                           | `deno run --allow-read --allow-run .llm/tools/deps/why.ts <package>`                                                          |
| A generated project needs the full runtime smoke | `e2e/scaffold-e2e-test.ts`              | `deno run --allow-read --allow-write --allow-run --allow-net --allow-env .llm/tools/e2e/scaffold-e2e-test.ts --format pretty` |

## The excluded-file exit-0 trap

Use `run-deno-check.ts` for scoped type-checking. A bare `deno check` can exit 0 after a project
configuration excludes the file you intended to check. The runner enumerates explicit files and
reports `selection.filesSelected` and exits 2 when it selects zero files, so missing evidence cannot
masquerade as success.

The full E2E additionally requires Deno, Aspire, a container runtime, and registry/network access.
Its default uses the exact released NetScript CLI when no framework checkout is present.
