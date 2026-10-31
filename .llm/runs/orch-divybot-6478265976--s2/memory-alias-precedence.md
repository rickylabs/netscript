# Longest literal UI alias prefix

Config schema order is not alias precedence: components is listed before ui, but @/components/ui/ must win over @/components/. Flatten literal prefixes once per copy plan, sort descending length and preserve slash boundaries. Test a separately configured ui directory and resolve imports to actual copied targets; default aliases alone mask this bug because both schema-order and longest-prefix interpretations resolve to the same directory. Add similarly named uikit control to guard boundaries.

Named updates must validate the entire selection against the lock before resolving registries or planning writes; an update must not install missing names. Unnamed legacy discovery is separate. Missing locked removal throws its specific diagnostic; a genuine zero-copy legacy/metadata-only command result prints Nothing to remove. Existing local/edit/dependency/page lifecycle checks remain necessary.

After the owner opts into e2e-cli-gate, final proof needs .github/workflows/e2e-cli.yml at the same head as ci.yml. Require scaffold-static plus scaffold-runtime (aspire + docker + postgres) and scaffold-runtime-sqlite (aspire + sqlite + garnet), and their literal canonical full-suite steps SUCCESS; reject policy-short-circuit success. The label is owner-controlled: do not add or remove it.
