# Architecture

`@netscript/aspire` is an Arch-2 integration package. Domain types and ports stay SDK-neutral;
application code composes ports; adapters and testing support provide concrete implementations
without importing the generated Aspire SDK.

```
domain -> ports -> application -> adapters
                    diagnostics
                    testing
```

The package deliberately avoids generated Aspire SDK imports so it remains publishable on JSR and
usable in Deno type checks.
