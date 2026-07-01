**[PHASE: IMPL] [SLICE: S1]**

S1 pushed: D2 removes the rejected `deno ci --prod` flag from the dependency prod-install wrapper and clears toolbelt docs.

- Commit: `f07613d5` (`chore(release): fix prod install args`)
- Scope: `.llm/tools/deps/prod-install.ts`, `.llm/tools/deps/prod-install_test.ts`, `.llm/tools/README.md`, `.llm/tools/entry.md`
- Gate: `git grep -nF -- '--frozen' .llm/tools/` — PASS, zero matches
- Gate: `deno test --allow-read --allow-run .llm/tools/deps/prod-install_test.ts` — PASS, 2 passed
- Gate: focused `run-deno-check` on S1 files — PASS, 0 occurrences
- Gate note: literal wrapper invocation with `--unstable-kv` is rejected because this wrapper passes it by default; broad `.llm/tools` check still has a pre-existing failure in `.llm/tools/fitness/check-manifest-integrity.ts` importing missing `packages/fresh-ui/registry/manifest.ts`, with no S1 files reported.
