# Plugin update negative controls

Named fixture command:

```sh
deno task docs:snippets:negative plugin-update-package-specifier
```

Raw exit: **1**. Diagnostic:

```text
docs snippets: FAIL page.md:4: plugin update requires an installed plugin name, not a package specifier; use netscript plugin update workers (see netscript plugin update --help)
```

Real-page control: temporarily replace `netscript plugin update workers` in the lifecycle table with the rejected scoped package operand. Run `deno task docs:snippets --extract-only` against the entire real site. Raw exit: **1**. Diagnostic:

```text
docs snippets: FAIL orchestration-runtime/how-to/add-a-plugin.md:208: plugin update requires an installed plugin name, not a package specifier; use netscript plugin update workers (see netscript plugin update --help)
```

Restore the file's exact original corrected bytes in `finally`, then run the same corpus command: raw exit **0**, census scanned=667, tier1=39, checked=26, exempt=13, malformed=0. Full docs:snippets compilation also passed. The fixture failure happens before compilation; it cannot be explained by an unrelated TypeScript error.
