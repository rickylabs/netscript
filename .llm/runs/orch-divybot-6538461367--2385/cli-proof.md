# Public main CLI proof

Baseline main: `2f426b970d7a00bdbeb09c59b72b49478b839a5a`. CLI/package/plugin source is unchanged from that commit, verified with `git diff <baseline> -- packages plugins` (empty).

The ordinary public Deno entrypoint builds/transpiles the local main source graph on execution. Its live help exits **0**:

```text
Usage: netscript plugin update <name>
Description: Re-pin and regenerate an installed plugin
Options: --project-root <path>; --help
```

Setup in a fresh temporary directory, without starting services:

```sh
deno run -A --no-lock packages/cli/bin/netscript.ts init docs-update-proof --path <temporary-parent> --db none --no-agent --editor none --yes --ci --no-git
deno run -A --no-lock packages/cli/bin/netscript.ts plugin install worker --name workers --no-db --no-samples --ci --skip-confirmation --project-root <temporary-project>
deno run -A --no-lock packages/cli/bin/netscript.ts plugin update workers --project-root <temporary-project>
```

All three commands exit **0**. The installed name is `workers`; update output:

```text
Updated workers to 0.0.8; generated 0 registries.
```

Zero registries is expected for this sample-free project with no authored contributions. This runs the real install/update, configuration loading, staged commit and registry discovery paths. No injected validator or stubbed command implementation is used. No database, container, AppHost or background service was started, and no local scaffold.runtime suite was run.

Separate optional standalone compilation succeeded, but that experimental binary cannot start its config-loader child from its virtual embedded path. It is **not** claimed green. Normal installed NetScript is a Deno script; the successful public-source execution above is the evidence for this docs correction. Binary packaging changes are outside the lane.
