# Plan: gate maintainer plugin-source copy behind a flag + lock the prod no-copy guarantee

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `fix-cli-plugin-copy-flag-gate--copy-gate`         |
| Branch         | `fix/cli-plugin-copy-flag-gate`                    |
| Phase          | `plan`                                             |
| Target         | `@netscript/cli` (local/maintainer plugin add + prod guardrail) |
| Archetype      | `4 - Application/CLI tooling package`              |
| Scope overlays | `service` (scaffold)                               |
| Baseline       | `origin/main` @ `98b087ef` (alpha.4)               |

## Archetype

`@netscript/cli` application/tooling package. The change touches the **local (maintainer)** scaffold
feature plus a **regression lock** on the public (prod/JSR) scaffold path. No package public API/type
surface changes; no plugin/package source archetype change.

## Goal

1. The maintainer/local `plugin add` full-source copy into userland `plugins/<name>/` is **optional
   and behind a flag** (user directive). Default = **off** (thin-stub scaffold, matching prod);
   opt-in copy via `--copy-source`.
2. The **prod (JSR) path can never copy plugin source** into userland — make it structurally
   impossible and lock it with a regression test. (Already true today; this slice guarantees it
   cannot regress.)
3. `scaffold.runtime` / `scaffold.plugins` e2e stay green; default scaffold output for the **public**
   path is byte-identical (it never copied).

## Current Doctrine Verdict

Two separate, correctly-separated paths exist (see research). Prod already emits thin JSR stubs and
never calls `copyPlugin()`. The only defect vs the user's intent is that the **local** path's
full-source copy is **unconditional** — there is no flag, and the default surfaces a full plugin
source tree in userland. Fix = introduce a copy-mode flag (default off), thread it through the local
add flow, and add a guard test on the prod path.

## Scope

- **New CLI flag** `--copy-source` (boolean, default `false`) on the **local** `plugin add` command
  (`add-local-plugin-command.ts`, after `--samples`). Optional `--no-copy-source` is the explicit
  off form (default already off). Add a one-line help string.
- **Thread the flag** through the local add input/options/dependencies into `add-local-plugin.ts`;
  gate the `maybeCopyOfficialPlugin` decision (`:189`) and the `copyPlugin(...)` call (`:254`) on it.
  When false, fall through to the existing thin-stub `PluginScaffolder.scaffold()` branch (the same
  branch already used for non-canonical names) but keep `importMode: 'local'` so local imports
  (relative `../../packages/...`) are still produced — contributors still get a runnable local plugin,
  just not a vendored source copy.
- **Prod guardrail.** Assert structurally that the public path cannot copy source: the public render
  path is JSR-only (`render-plugin.ts`), and `copyPlugin`/`copyOfficialPlugin` must not be reachable
  from the public command. Add a focused regression test (public `plugin add` produces NO files under
  `plugins/<name>/` that are verbatim copies of repo plugin source — assert the generated `mod.ts`
  is the JSR-stub shape and that the source-only marker files from the canonical plugin are absent).
- **Update tests.** `add-local-plugin_test.ts:76` currently asserts the vendored-source result;
  split into: (a) default (no flag) → thin-stub local imports, no source copy; (b) `--copy-source`
  → existing vendored-source behavior preserved.

## Non-Scope

- The public/prod path behavior change — it already does the right thing; only add a lock.
- The asset-read import-attribute work (`fix/cli-jsr-asset-embedding`, #124) — independent slice.
- Aspire helper regen — unchanged; runs post-scaffold in both paths.
- Renaming/refactoring `copyOfficialPlugin` or the maintainer sync feature beyond the gate.
- Plugin→package registry promotion (#67).

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| `D1` | Local-mode source copy is **opt-in via `--copy-source`, default off** | User: "optional and behind a flag"; default-off makes both modes non-surfacing by default and matches the prod guarantee |
| `D2` | Default-off local scaffold still uses `importMode:'local'` (relative imports), NOT jsr | Preserves the contributor's local-edit workflow for framework packages; only the *vendored plugin source tree* is removed by default |
| `D3` | Prod (public/JSR) path keeps `importMode:'jsr'` hardcoded; add a regression test it never copies source | Locks the user's primary guarantee against future regression |
| `D4` | Public-path default scaffold output byte-identical | Public never copied; transport unchanged |

## Open Decisions (for user PR self-review)

| Decision | Default chosen | Alternative (one-line flip) |
| -------- | -------------- | --------------------------- |
| Local copy default direction | **off** (`--copy-source` to opt in) | on (`--no-copy-source` to opt out) — preserves today's maintainer DX. Flip = change the flag default + the gate condition sense. |
| Flag name | `--copy-source` | `--vendored` / `--copy-plugin-source` |

Recorded so the user can override at review; both are trivial to change.

## Fitness Gates

| Gate | Required | Evidence |
| ---- | -------- | -------- |
| `run-deno-check.ts --root packages/cli --ext ts,tsx` (`--unstable-kv`) | yes | clean |
| scoped lint + fmt (ts,tsx) | yes | clean |
| `deno task test` for cli plugin-add units (public + local) | yes | new default + `--copy-source` cases pass; prod no-copy guard passes |
| `deno task publish:dry-run` cli | yes | no surface/slow-type change |
| `deno task e2e:cli run scaffold.plugins --cleanup --format pretty` | yes | per-kind plugin add green under new default |
| `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | yes (merge bar) | full runtime green; first-party plugins still wire/run |

## Arch-Debt Implications

| Entry | Action |
| ----- | ------ |
| (new) `PLUGIN-USERLAND-SOURCE-COPY` | close on merge — copy now opt-in; prod locked no-copy |

## Validation Plan

| Order | Gate | Command | Expected |
| ----- | ---- | ------- | -------- |
| 1 | check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | clean |
| 2 | lint/fmt | scoped wrappers (ts,tsx) | clean |
| 3 | unit | `deno task test` (plugin add public+local) | pass incl. new cases |
| 4 | dry-run | `deno task publish:dry-run` cli | clean |
| 5 | e2e plugins | `e2e:cli run scaffold.plugins --cleanup --format pretty` | pass |
| 6 | e2e runtime | `e2e:cli run scaffold.runtime --cleanup --format pretty` | pass (merge bar) |

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Default-off breaks a maintainer flow that assumed vendored source | D2 keeps local imports runnable; `--copy-source` restores old behavior; open-decision flip documented |
| `scaffold.plugins`/`scaffold.runtime` gate assumed copied files | Update gate expectations to the default-off shape; verify first-party plugins still register + run |
| Hidden coupling: some downstream step reads vendored plugin files | Grep the local add flow + e2e for reads under `plugins/<dir>`; if found, either keep copy default-on (flip D1) or fix the reader — record in drift |

## PLAN-EVAL

Consistent with the user's self-review model for this CLI hardening program (PLAN-EVAL explicitly
waived for the sibling asset-embed slice #124, user reviews PRs directly), PLAN-EVAL is **waived**
for this small, surgical, single-package change; the user self-reviews the PR. This is an inferred
extension of the #124 waiver — flagged here so the user can require an OpenHands minimax-M3 PLAN-EVAL
if preferred. IMPL is a daemon-attached WSL Codex slice; merge bar is green `scaffold.runtime` e2e.
