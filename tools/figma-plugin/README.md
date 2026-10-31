# Figma token round-trip

This is a tools-side selective fork of [TokensBrücke](https://github.com/tokens-bruecke/figma-plugin)
at `ded44a2e1f825e82d4888dd27fc056062da642f7`. The upstream MIT LICENSE is retained verbatim;
NOTICE records attribution and local changes. The fork uses upstream's RGB normalizer and
replaces the UI/providers with the NetScript variable, preset and registry contracts.

Figma owns values. Code owns collection/variable identities, modes, WEB names and types.
The nine collections and 2,186 variables follow the design handoff. Theme set A selects Theme;
B selects Theme B. Alias targets use the active mode of their own collection.

Build from the repository root:

```sh
deno run -A tools/figma-plugin/build.ts
```

In Figma Desktop, import `.llm/tmp/figma-plugin/manifest.json` as a development plugin, then run
NetScript token round-trip on the library file. Select one of the 24 presets. Download its
portable theme JSON. The DTCG section also downloads `figma.tokens.json`, every mode document
and `tokens.resolver.json`; the snapshot section downloads the original collection JSON files. The date and
file key control the snapshot index; a fixture comparison uses the handoff's exact metadata.
No scripted Figma export or personal Figma access token is needed.

The theme is a published-schema `registry:theme` item. Its `meta.netscript` contains version 1,
a registered preset ID and a `figma` DTCG bundle: ordered identity metadata, one token document
per collection/mode, and the DTCG 2025.10 resolver. Token aliases are stable collection/variable
identities, resolved through modifiers rather than fixed target modes. Single-mode collections
use resolver sets. Colors use standard sRGB values and retain oklch in `$extensions.netscript`.
The oklch extension also keeps the source hex spelling, including an explicit opaque alpha byte.
DTCG has no generic string or boolean type: lossless Figma transport uses fontFamily string
carriers and number 0/1 boolean carriers; metadata retains the original Figma type. The shared
NetScript importer then assigns the actual semantic token types when compiling a theme.

Import a downloaded theme or the complete `figma.tokens.json` bundle using the file control.
Individual mode documents use the resolver for other DTCG consumers; restoring Figma names/scopes
requires the complete bundle metadata. The plugin validates the entire snapshot,
registered names, modes, alias targets and cycles before mutation. It creates all variables before
assigning aliases and retains existing variable IDs. Incompatible existing modes/types are refused.
Host permission, plan limits and actual Figma editor execution cannot be tested in CI; native
host acceptance is **UNPROVEN**. CI type-checks, bundles, and unit-tests against a stateful mock
of the Plugin API, with exact fixture bytes and the official DTCG schemas.

## GitHub PR export

Commit a downloaded theme once into your own theme repository, for example
`themes/studio-utility.json`. Enter `owner/repository`, that path and a token. Future exports
require the exact canonical export formatting and key order, compare the complete item with that baseline, refuse metadata/name/type/mode/alias changes, and
create one tree entry, one commit, one `figma/*` branch and one PR. Only token `$value` leaves
and their oklch value extensions may differ. A missing baseline or unchanged values produces a
clear diagnostic without creating a branch.

Use a fine-grained PAT scoped to that repository with **Contents: Read and write** and
**Pull requests: Read and write**. A classic PAT needs `public_repo` for public repositories or
`repo` for private ones. No workflow or administration permission is needed. The token is used
only in memory for that action, the password field is cleared immediately, and no token goes to
clientStorage, localStorage, repository files or diagnostics. The manifest allows only
`https://api.github.com`; there are no analytics or other external services.

The target is a standalone theme item in your repository, not NetScript's pinned handoff snapshot.
The latter also requires approved provenance and regeneration of its derived artifacts. Export
PRs do not reinterpret or bypass that policy.

## One-command application install

```sh
netscript ui:apply --preset https://raw.githubusercontent.com/owner/themes/main/themes/studio-utility.json
netscript init my-app --preset https://raw.githubusercontent.com/owner/themes/main/themes/studio-utility.json --yes
```

The CLI validates the published registry schema and the strict Figma bundle, checks names using
the same checker as export, then reuses the S2 registry installer and the existing token engine.
It installs editable DTCG sources under `tokens/source`, writes `tokens.config.json` with
`sourceRoot`, and retains hashes/provenance in `fresh-ui.lock.json`. An existing custom source
root is refused; an installed URL theme's managed root can be replaced by another URL theme.
Existing semantic overrides are retained and compiled. A later `netscript tokens build` keeps
the imported values. Invalid URLs, JSON, schemas, names, destinations and compiler inputs fail
before any application writes.

Shared `?preset=ns1_...` links remain local preset decoding. Other HTTP(S) URLs fetch a theme/base
registry item or strict version-1 preset JSON; a preset JSON's `theme` names a built-in preset ID,
not another URL. Credential-bearing URLs are refused; use registry environment-backed headers
for authenticated registry references. Export itself uses download or the explicit GitHub action.

## Contributor path and evidence

Start here, then follow these boundaries:

- `src/snapshot.ts` owns exact snapshot serialization and the narrow Plugin API port.
- Fresh UI's `figma-round-trip.ts` and `domain/figma/figma-token-bundle.ts` own DTCG transport.
- Fresh UI's `figma-token-names.ts` owns the independent name check. Its synchronous generated
  inventory is produced by `packages/fresh-ui/scripts/embed-token-assets.ts` for sandbox support.
- `src/import-snapshot.ts` owns two-pass native import and preflight.
- `src/theme-item.ts` carries existing theme docs; CLI compiles values with `figmaTokenSources`,
  the existing resolver and the existing 24 presets. There is no second token resolver.
- `src/github-export.ts` owns the complete values-only comparison and Git Data API sequence.
- `build.ts` bundles the main IIFE and browser UI separately. It writes development output only
  under `.llm/tmp/figma-plugin`; do not commit that output.

The fixture proof changes Scheme `bevel/edge` in Light and one Theme scalar in Studio, validates
the complete portable item as values-only, then tests a one-file PR through a mocked GitHub API.
Code Connect and library gap components are phase 2.

## Name checks in CI

From NetScript, `deno task figma:ci` runs the explicit structured plugin wrappers,
unit tests, name check and browser build. These wrappers report nonzero processed
file counts; root workspace wrappers exclude tools/. The required CI quality job
runs this task even when its other work is skipped by path policy.

`deno task check:figma-names` checks the pinned nine-collection snapshot and a
portable item built from the committed fixtures. Pass `--theme <item.json>` once
per exported item to check your actual PR files. `--negative-control` deliberately
exits nonzero for `Scheme/accent/border (var(--ns-unknown-export))`.

Copy this into the theme repository so unknown export names fail its PR checks:

```yaml
name: token-names
on: [pull_request]
jobs:
  names:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: denoland/setup-deno@v2
        with:
          deno-version: '2.9.7'
      - uses: actions/checkout@v5
        with:
          repository: rickylabs/netscript
          ref: main
          path: .netscript
      - run: deno task --cwd .netscript check:figma-names --theme ../themes/studio-utility.json
```

Pin the NetScript checkout to your plugin's release commit when retaining an older
code vocabulary. The plugin refuses unknown names before push, this CI command
uses that same checker, and the CLI checks again before installation.

After installing a URL theme, selecting a built-in preset code changes the context within the
app's installed sources. It retains `sourceRoot` and the Figma-owned values; it does not reset
those sources to the bundled catalog. `init --dry-run --preset` previews the scaffold and skips
remote fetch/application. With a real init, preset application follows scaffold creation; if a
URL fails, repair it and use `ui:apply --preset` on the generated app to finish configuration.
