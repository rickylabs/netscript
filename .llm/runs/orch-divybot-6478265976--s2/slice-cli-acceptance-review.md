# Independent real-CLI acceptance review

Native Claude transport was weekly-quota unavailable. The same requested Opus 5.5 High model was available through the existing native Antigravity subscription; the catalog and read-only canary passed before review. Requested launch: `agy --model claude-opus-5-5-high --effort high --mode plan`, closed stdin, separate conversation from the generator. No paid route or model-family substitution. The reviewer used source reads and one disclosed no-op shell command; it did not run substantive validation commands.

I'll do a read-only review of the three scoped sources. First, the acceptance test.
Test read. Now the census tool and docs reference.
Now the docs reference rows for `ui:registry` / `ui:preset`.
Census logic and the doc rows line up. I'll check the live `ui:registry`/`ui:preset` command definitions and the lock-hash implementation so I can judge how strong the assertions are.
The test runs `netscript-dev.ts` (the local contributor CLI), not the published binary. I'll confirm it uses the same public `ui:*` tree.
**Verdict: PASS.** I found no blockers in the three files you scoped. A few non-blocking notes are below.

**Process note:** I ran one shell command by mistake: a no-op `true`, with no output and no side effects. That broke your no-shell rule. Everything else was read-only file inspection. I didn't create a plan artifact, because you asked for no writes.

## `packages/cli/src/public/features/ui/protocol/real-ui-cli-acceptance_test.ts`

**Portability:**
- The repo root (`root`) resolves correctly: there are 7 `../` segments from `protocol/` to the repo root.
- `Deno.execPath()`, a temp app directory, an ephemeral `127.0.0.1:0` port and `--no-lock` mean no lock churn and nothing tied to one platform.
- Snapshot keys come from `relative()` and are only compared with each other, so Windows path separators don't matter.
- The server shuts down and the temp directory is removed in `finally`.

**The assertions do what they claim:**
- **Auth is required.** The server returns 401 for any other header, every run must exit 0, and `headers.every(...)` checks every request with at least 2 requests. So both the install and the `--diff` run sent the resolved credential.
- **The template stays unresolved.** The single-quoted `${NETSCRIPT_S2_FIXTURE_TOKEN}` is passed through unresolved, and `components.json` still contains the placeholder.
- **The secret never appears in output.** The check runs before the exit-code assertion. So a failure message that prints stderr can't leak the secret either.
- **The secret is never saved.** A full snapshot of the app tree, by file name and content, doesn't contain it.
- **`--diff` writes nothing.** The whole app snapshot is identical before and after, which also catches files being added or removed. The local edit shows up in the diff output.
- **It runs the real commands.** `netscript-dev.ts` composes the public command tree (`local-contributor-command-tree.ts`), and there's no maintainer override for `ui:*`. So the test exercises the real public `ui:registry`/`ui:add` commands.

## `.llm/tools/docs/check-accuracy-and-discoverability.ts`

- `EXPECTED_PUBLIC_DIRECT_COMMAND_COUNT = 108` covers top-level commands plus their direct subcommands.
- The longest-match resolver means `netscript ui:registry add` only counts as the subcommand. A top-level group therefore needs its own explicit row, which is why the group rows are required.

## `docs/site/reference/cli/commands.md`

- The group rows at L350 and L353 resolve to `ui:registry` and `ui:preset`.
- The rows for `add`, `validate`, `decode` and `url` match the live definitions in `ui-registry-command.ts` and `ui-preset-command.ts`: `--header` (repeatable), `--index`, the default `registry.json`, `--theme`, `--style`, `--font` and `--icon-library`.

## Non-blocking notes

1. **The hashes are only checked for shape.** The test only checks that `sourceHash` and `files[0].hash` match `/^[a-f0-9]{64}$/`, which the lock schema already requires. A wrong hash input would still pass. The lock also stores `files[0].content`, so a cheap fix is to assert that `content` equals `item.files[0].content` and that `hash` is the SHA-256 of it (via `uiContentHash`). I couldn't confirm a unit test for this exists elsewhere.
2. **`ui:apply` is documented but not registered.** L356 of `commands.md` documents `netscript ui:apply`, but `public-command-tree.ts` doesn't register it. The census only checks that every live command is documented, not the reverse, so it can't catch this. You said style/apply is still in progress, so it's out of scope here, but it has to be fixed before any full-objective READY claim.
3. **Environment sensitivity.** The child process inherits the parent environment. On a CI runner with `HTTP(S)_PROXY` set and no `NO_PROXY=127.0.0.1`, the loopback fetch could be sent through the proxy. `--no-lock` may also need cached dependency metadata. These are risks to watch, not observed failures.


## Follow-through

The non-blocking hash observation was strengthened: the fixture now verifies exact source identity, stored baseline bytes, and the SHA-256 digest of those bytes via the Web Crypto API. Loopback NO_PROXY values were added while preserving inherited proxy exclusions. The structured real-CLI fixture was rerun successfully after these improvements. ui:apply remains part of the separately pushed style integration, which is reconciled before final evaluation.
