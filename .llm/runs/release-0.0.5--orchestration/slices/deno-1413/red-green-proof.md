# Exact Deno 2.9.3 RED → 2.9.5 GREEN proof

Scratch root: `/tmp/netscript-deno-1413-proof.0m0OLw` (outside the repository).

## RED — Deno 2.9.3

Command:

```bash
cd /tmp/netscript-deno-1413-proof.0m0OLw/red
../deno-2.9.3 --version
../deno-2.9.3 add --minimum-dependency-age=0 jsr:@netscript/service@0.0.5-canary.17
```

Raw output and exit code:

```text
deno 2.9.3 (stable, release, x86_64-unknown-linux-gnu)
v8 14.9.207.2-rusty
typescript 6.0.3
error: unexpected argument '--minimum-dependency-age' found

  tip: to pass '--minimum-dependency-age' as a value, use '-- --minimum-dependency-age'

Usage: deno add [OPTIONS] [packages]...

RAW_EXIT_CODE=1
```

## GREEN — Deno 2.9.5

Command:

```bash
cd /tmp/netscript-deno-1413-proof.0m0OLw/green
/home/codex/.deno/bin/deno --version
/home/codex/.deno/bin/deno add --minimum-dependency-age=0 jsr:@netscript/service@0.0.5-canary.17
```

Raw output, exit code, and resulting `deno.json`:

```text
deno 2.9.5 (stable, release, x86_64-unknown-linux-gnu)
v8 15.0.245.2-rusty
typescript 6.0.3
Created deno.json configuration file.
Add jsr:@netscript/service@0.0.5-canary.17
RAW_EXIT_CODE=0
{
  "imports": {
    "@netscript/service": "jsr:@netscript/service@0.0.5-canary.17"
  }
}
```

The bypass is deliberately scoped to the scratch release-verification command. No repository
command or default gained `--minimum-dependency-age=0`, and no command uses `@canary`.
