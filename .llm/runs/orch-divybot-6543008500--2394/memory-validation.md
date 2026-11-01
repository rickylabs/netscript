# Scoped wrapper details

run-deno-check.ts enables unstable KV by default; it rejects a bare --unstable-kv argument.
Use --root plugins --ext ts --include '<owned-path-regex>' --output <local-report>.
run-deno-test.ts accepts -- --allow-all --unstable-kv <test paths>.
A same-directory relative import needs './'; os.path.relpath omits it.
Keep raw reports outside Git because their cwd/error locations contain private operator paths.
