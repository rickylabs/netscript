# worklog.md — chore-release-one-shot--tooling

## Implementation

### S1 — D2 remove rejected `deno ci --prod` flag

- Updated `.llm/tools/deps/prod-install.ts` to run `deno ci --prod` and keep `--skip-types` support.
- Added `.llm/tools/deps/prod-install_test.ts` to assert the resolved args never include the rejected flag.
- Removed remaining toolbelt-doc mentions from `.llm/tools/README.md` and `.llm/tools/entry.md`.

Gate evidence:

| Gate | Result | Evidence |
| --- | --- | --- |
| `git grep -nF -- '--frozen' .llm/tools/` | PASS | Exit 1, zero matches. |
| `deno test --allow-read --allow-run .llm/tools/deps/prod-install_test.ts` | PASS | 2 passed, 0 failed. |
| `deno fmt --check .llm/tools/deps/prod-install.ts .llm/tools/deps/prod-install_test.ts` | PASS | Checked 2 files. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/deps/prod-install.ts --file .llm/tools/deps/prod-install_test.ts --ext ts` | PASS | 2 files selected, 0 occurrences. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts --unstable-kv` | BLOCKED | Wrapper rejects literal `--unstable-kv` as an unknown wrapper argument; wrapper help shows `--unstable-kv` is passed by default and `--no-unstable-kv` disables it. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | BASELINE FAIL | Fails only in pre-existing `.llm/tools/fitness/check-manifest-integrity.ts` because it imports missing `packages/fresh-ui/registry/manifest.ts`; no S1 files reported. |
