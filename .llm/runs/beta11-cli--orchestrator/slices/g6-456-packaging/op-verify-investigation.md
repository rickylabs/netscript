# Native desktop Ed25519 op investigation

Date: 2026-07-18  
Scope: investigation only; no product source changed.

## Verdict

**UPSTREAM GAP — Deno v2.9.3 removes `op_desktop_verify_ed25519` from the user-visible op table during runtime bootstrap.**

This is neither a NetScript packaging fallback to plain `deno compile` nor an invocation error in
G7. The public NetScript command invoked the configured task, the task invoked `deno desktop`, and
Deno selected the desktop-specific `libdenort-x86_64-unknown-linux-gnu.zip`. That library contains
the verifier implementation, but Deno's main-runtime bootstrap deletes it before the separately
executed desktop auto-update initializer reads it. The upstream correction is to retain
`"op_desktop_verify_ed25519"` in `runtime/js/99_main.js`'s `NOT_IMPORTED_OPS`, next to
`op_desktop_apply_patch` and `op_desktop_confirm_update`, then rebuild and publish matching Deno and
`libdenort` artifacts.

## 1. Does Linux `deno desktop` include the desktop runtime, and when?

Yes, when compilation enters through `deno desktop` (or an equivalent internal caller that passes
`is_desktop = true`). It is not the same base artifact as ordinary `deno compile`.

- [`cli/tools/desktop.rs` at v2.9.3](https://github.com/denoland/deno/blob/v2.9.3/cli/tools/desktop.rs#L513-L522)
  changes the temporary subcommand to compile, sets `flags.internal.is_desktop = true`, and calls
  `compile_binary(..., true, ...)`.
- [`cli/standalone/binary.rs` at v2.9.3](https://github.com/denoland/deno/blob/v2.9.3/cli/standalone/binary.rs#L376-L499)
  branches on `self.is_desktop`. Ordinary compilation resolves `denort-<target>.zip`; desktop
  compilation resolves `libdenort-<target>.zip`, including `libdenort.so` for Linux.
- [`runtime/snapshot.rs` at v2.9.3](https://github.com/denoland/deno/blob/v2.9.3/runtime/snapshot.rs#L50-L103)
  includes `ops::desktop::deno_desktop::lazy_init()` in the runtime snapshot.
- [`runtime/ops/desktop.rs` at v2.9.3](https://github.com/denoland/deno/blob/v2.9.3/runtime/ops/desktop.rs#L1056-L1066)
  defines `op_desktop_verify_ed25519`; the extension registration includes it with the other desktop
  ops later in the same file.

The broken link is bootstrap retention. [`runtime/js/99_main.js` at v2.9.3](https://github.com/denoland/deno/blob/v2.9.3/runtime/js/99_main.js#L637-L730)
deletes every `core.ops` member not present in `NOT_IMPORTED_OPS`. Its desktop list retains
`op_desktop_apply_patch` and `op_desktop_confirm_update` but omits
`op_desktop_verify_ed25519`. Later, [`cli/rt/desktop.rs` at v2.9.3](https://github.com/denoland/deno/blob/v2.9.3/cli/rt/desktop.rs#L943-L1056)
destructures the now-missing verifier and calls it while processing a signed manifest. That ordering
explains the exact `op_desktop_verify_ed25519 is not a function` failure.

Binary inspection agrees with the source. The official cached desktop archive and the packaged
application library both contain the verifier name and implementation strings; absence occurs in
the JavaScript-visible table, not in the ELF payload.

## 2. Which target artifact did the NetScript pipeline select?

The pipeline selected the correct desktop path. It did not fall back to plain compile semantics.

G7's configured task was:

```text
"desktop:package": "deno run --allow-all src/package.ts"
```

Its wrapper formed this command shape, placing NetScript's forwarded flags before the entrypoint:

```text
deno desktop --allow-all --include <renderer.js> \
  --target x86_64-unknown-linux-gnu -o <absolute-output.deb> <main.ts>
```

That is the invocation required by the upstream `is_desktop` branch. The local Deno cache contains:

```text
/home/codex/.cache/deno/dl/release/v2.9.3/libdenort-x86_64-unknown-linux-gnu.zip
```

The observed archive digest is:

```text
e1e46329b344d1e67b87989af34a7de9837f5b7d2cebca33fbf174ce32345d3f
```

`gh release download v2.9.3 --repo denoland/deno --pattern
'libdenort-x86_64-unknown-linux-gnu.zip.sha256sum' --output -` returned the same digest. The release
publishes distinct [`libdenort` and `denort` assets with checksum sidecars](https://github.com/denoland/deno/releases/tag/v2.9.3).
Therefore the bytes used here are the official SHA-256-matching desktop target, not the plain target.

Important ownership detail: NetScript does not download either target archive itself; it invokes
the `PackageTaskName` hook with explicit target/output arguments. `deno desktop` owns target
selection and caching. Deno v2.9.3's `download_base_binary` downloads the selected archive directly;
the checksum comparison above is an investigation proof, not a claim that the NetScript planner
performs an additional archive verification step.

## 3. Minimal public-CLI reproduction

Host:

```text
deno 2.9.3 (stable, release, x86_64-unknown-linux-gnu)
/usr/local/bin/deno sha256:
8570c9cdebe936ba744e12a6d329e0a17ea505b4e5f89b654473a2efc2d2e3ba
```

The disposable fixture used `PackageTaskName: desktop:package`; its task wrapper ran
`deno desktop --allow-all ... main.ts`. The entrypoint printed the types of the three auto-update
ops from `Deno[Deno.internal].core.ops`, then exported a trivial HTTP handler.

Exact package command:

```bash
deno run --allow-all /home/codex/repos/wt-g6-456/packages/cli/bin/netscript.ts \
  deploy desktop package \
  --project-root /home/codex/repos/wt-g6-456/.llm/tmp/op-verify-investigation \
  --app op-verify-probe \
  --target x86_64-unknown-linux-gnu \
  --format deb \
  --compression none
```

Output:

```text
Packaged op-verify-probe@1.0.0: 1 native artifact(s).
```

The `.deb` was extracted without installing it globally:

```bash
mkdir -p .llm/tmp/op-verify-investigation/install-root
dpkg-deb -x \
  .llm/tmp/op-verify-investigation/.deploy/desktop/packages/op-verify-probe-1.0.0-linux-x86_64.deb \
  .llm/tmp/op-verify-investigation/install-root
```

Exact run command (the environment variable points the extracted launcher at its sibling runtime;
a normal system install resolves that path from the installed layout):

```bash
LAUFEY_RUNTIME_PATH=/home/codex/repos/wt-g6-456/.llm/tmp/op-verify-investigation/install-root/usr/lib/op-verify-probe-1.0/op-verify-probe-1.0.so \
  timeout 8s \
  .llm/tmp/op-verify-investigation/install-root/usr/lib/op-verify-probe-1.0/op-verify-probe-1.0
```

Relevant output and expected timeout exit (`124`, because the desktop server remains live):

```text
Runtime loaded successfully from: .../op-verify-probe-1.0.so
Runtime started
[desktop] dylib path: ".../op-verify-probe-1.0.so"
{"autoUpdate":"function","verifyEd25519":"undefined","applyPatch":"function","confirmUpdate":"function"}
deno serve: Listening on http://127.0.0.1:41905/
exit=124
```

This is the minimal viability result: the desktop-specific runtime launches and installs
`Deno.autoUpdate`, while the sole verifier op needed by its signed-manifest path is absent. G7's
signed-manifest fetch drove that undefined value to an actual call, producing the reported error.

## G7 evidence correlation

`/home/codex/repos/wt-g7-457/.llm/tmp/desktop-native-e2e/evidence.json` records successful isolated
`.deb` installation, launcher startup, TLS release-base use, and then:

```text
Deno.autoUpdate: check failed: op_desktop_verify_ed25519 is not a function
```

The G7 drift entry correctly states that staging/apply/rollback were not reached. The minimal probe
reproduces the prerequisite defect without the larger E2E harness and rules out URL layout,
signature-envelope composition, package installation, and launcher selection as its cause.

## Stop-lines

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.
