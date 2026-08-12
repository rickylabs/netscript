use harness

# Slice W2-F — exact canary plugin install (#1456)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w2-1456` |
| Branch | `fix/1456-plugin-install-exact-jsr-version` |
| Base | `origin/main@3c9dc1f39` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **medium** (`normal_implementation`) |
| Slice dir | `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/w2-f-1456/` |
| PLAN-EVAL | **N/A — deterministic.** #1456 states expected behaviour exactly; there is no design freedom to evaluate. |
| IMPL-EVAL | **Normal automatic**, triggered by draft → ready. Do not request a waiver. |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first.**

## SKILL

- `netscript-harness` · `netscript-cli` (canonical on `plugin install`, scaffold dispatch, the
  plugin surface) · `netscript-deno-toolchain` (**canonical on JSR specifier semantics and the
  `deno outdated --latest` trap** — read it before touching version resolution) ·
  `netscript-tools` · `netscript-pr` · `rtk`

## The defect

`plugin install` cannot install an exact plugin canary. `--jsr-url` rejects **both** normal exact
JSR spellings, and the accepted unversioned form silently resolves the registry's stable `latest`.

Reproduced on Deno 2.9.5 with `@netscript/cli@0.0.6-canary.1`:

```
--jsr-url jsr:@netscript/plugin-ai@0.0.6-canary.1
  → Error: Invalid JSR plugin package spec "jsr:@netscript/plugin-ai@0.0.6-canary.1". Expected @scope/package.

--jsr-url @netscript/plugin-ai@0.0.6-canary.1
  → Error: Invalid JSR plugin package spec "@netscript/plugin-ai@0.0.6-canary.1". Expected @scope/package.
```

At reproduction time `https://jsr.io/@netscript/plugin-ai/meta.json` reported `latest: 0.0.5` while
`0.0.6-canary.1` existed. So the only accepted form installs `0.0.5` when `0.0.6-canary.1` was asked
for — **silently**.

## Why this is a release-verification blocker, not a CLI nicety

It prevents a consumer from validating a coordinated canary without silently mixing plugin
generations. That is precisely what the canary channel exists to prove. This lane has just published
`v0.0.6-canary.2` across 35 members; without this fix a consumer cannot install that exact set.

Note the failure shape: it does not error, it **substitutes**. A consumer who asked for a canary and
got stable `latest` has a working install and a wrong answer — the same class as every other issue
in this lane.

## Expected behaviour (from the issue)

- `--jsr-url jsr:@scope/package@version` **and** the prefixless `@scope/package@version` preserve the
  requested exact version through validation **and scaffold dispatch**.
- The installer never replaces an explicit version with the registry's `latest`.
- The installed dependency, manifest validation, and any generated registry entry all carry the
  requested exact version.

"Through scaffold dispatch" is load-bearing: validation accepting the version is not enough if the
version is dropped downstream. Trace the value end-to-end and prove it arrives.

## Acceptance

#1456 carries **no checkboxes**, so state acceptance explicitly in the PR body — for a box-less
issue, `close-gate` reduces to the PR-body checklist with no issue-side cross-check, so pre-merge
checks 5 and 7 carry the weight. At minimum:

- [ ] `--jsr-url jsr:@scope/pkg@version` is accepted and installs exactly that version
- [ ] `--jsr-url @scope/pkg@version` (prefixless) is accepted and installs exactly that version
- [ ] The unversioned form still resolves as before (no regression)
- [ ] An explicit version is **never** replaced by registry `latest` — proven against a package
      whose `latest` differs from the requested version, which is the only case that can detect it
- [ ] The exact version survives into the installed dependency and generated manifest/registry entry
- [ ] A regression test covers the exact-version path and fails if the version is dropped

**The negative control is the deliverable.** A test that installs an exact version equal to `latest`
proves nothing. Use a requested version that differs from `latest` — `0.0.6-canary.2` against a
package whose `latest` is `0.0.5` is the live case, and this lane just published that canary across
all 35 members.

## Gates

```
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task quality:gate
```

`quality:gate` is **required** (`packages/**`), and is necessary but not sufficient — see #1564/#1403
for its PR-gate blind spot. Run your own diff scan for `deno-lint-ignore` / `as unknown as` /
`@ts-ignore`; the orchestrator will too, and on #1539 that scan was the **only** thing in the entire
pipeline that caught one.

**Do not start `scaffold.runtime`** — it is serialised and contended by five lanes. Ask first if you
believe you need it.

## Hazards

- **Do not decide "latest" from `deno outdated --latest`** — it ignores semver and surfaces
  pre-release tags as latest. `deno task deps:latest` reads the registry stable channel and is the
  authority. Given this issue is *about* latest-vs-exact resolution, getting this backwards would be
  ironic and wrong.
- **`deno fmt` rewraps and can silently undo a scripted edit.** Verify after formatting.
- **Do not commit `deno.lock`**; never `deno cache --reload`.
- Push via explicit refspec. Do not re-draft the PR after marking it ready.
- **Re-sync against `main` immediately before draft → ready.**

## Deliverables

1. The fix on `fix/1456-plugin-install-exact-jsr-version`.
2. `slices/w2-f-1456/evidence.md` — gate commands with **real, untruncated** output; the
   exact-version install proven against a package whose `latest` differs; the regression test shown
   **red** before green.
3. A **draft PR against `main`**: `Closes #1456` in the **body**; labels `type:fix`, `area:cli`,
   `priority:p1`, exactly one `status:`; milestone `0.0.6`; explicit acceptance checklist; structured
   `acceptance-evidence` with **`box-index:`** keys.
4. Report the PR number. **Do not merge.**

If a gate goes red and you cannot turn it green, write the blocker into `evidence.md` and say so.
