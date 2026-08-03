# SLICES 2 + 3 REVIEW — one required addition, then you are done.

I reviewed and re-ran the gates myself. Slice 2 is accepted as-is. Slice 3 has one gap.

## Verified myself

- `deno task e2e:cli run scaffold.plugins --cleanup --format pretty` → **`Summary: passed=16 failed=0`**,
  read from the artifact, not the exit code. This is the gate my brief named; it is green.
- Doctor + inspector tests → 12 passed.
- `quality:scan` → `ok=True findings=0`; `arch:check` → no `FAIL` in any package; no new casts or
  lint ignores in either commit.
- `plugin doctor exits non-zero when generated registries are absent` genuinely exercises the
  **plugin-contributed** seam — it loads the real workers adapter and asserts on
  `generated job registry exists` with `exitCode 1`. That was my open caveat; it is closed.
- The inspector matching the AppHost by resolved path and parsing `aspire ps` status rather than
  trusting an exit code is the right call, and it is what makes this safe on a shared machine.

I also independently confirmed your `file:` doctor-entrypoint finding is **pre-existing on `main`**
(`install-plugin.ts:250` is unchanged by this branch), and that making `persistPluginMetadata` always
write the manifest adds no new `file:` URLs, because `doctorEntrypoint` is omitted entirely when
absent. Your 0.0.5 classification is correct and I will carry it as such. Do not spend time on it.

## Required — #1017 needs a threading test that can actually fail

The assertion you added to `suite-registry_test.ts` checks that the **E2E suite definition**
constructs commands containing `--no-samples`. That tests our test harness. **If `--no-samples`
stopped being threaded into the scaffolders tomorrow, that assertion would still pass.**

#1017's exact wording is *"The parsed negative flag is threaded into **every** official plugin
scaffolder"*, and it reproduced **8/8**. The strongest evidence you have for the product behaviour is
the `forbiddenPaths` block in the true-userland suite — which is genuinely good, but that suite is
currently red for the unrelated pre-existing reason above, so it is not green evidence today.

Add a direct, deterministic test asserting that installing `worker`, `saga`, `trigger` and `stream`
with `includeSamples: false` each reaches its scaffolder dispatch with samples disabled — **four
named cases**. It must fail if the threading is broken for any one of them. `dispatch-plugin-verb_test.ts`
already proves the generic payload carries the flag; what is missing is per-kind coverage, which is
exactly what the 8/8 reproduction was about.

Do **not** fix the true-userland suite's source-leak assertion. That is 0.0.5, as you recorded.

## Commit hygiene — note it, do not redo it

`ba0bc937b` is labelled `test(plugins): prove residual consumer acceptance`, but it also changed
product behaviour: AppHost-not-running went from `error` to `warning` in `doctor-plugin-use-case.ts`.
The change itself is **correct** — doctor must stay usable before the AppHost is started, and
missing-registry remains an `error` with exit 1, so #1022's first box still holds. But a behaviour
change inside a `test(…)` commit is invisible to a reviewer reading the log.

Do not rewrite history. Add a worklog line making the change and its rationale explicit so it is
discoverable, and I will call it out in the PR.

## Then stop

Commit, push, report the hash. Do not re-run `quality:scan`, `arch:check`, or the `scaffold.plugins`
E2E — I hold current green results for all three. After this the slice is complete and I take the PR
to ready-for-review.
