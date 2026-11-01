# Original strict failure — 2026-11-01

Head: `1e4e58fcc0d3e9bd8ca32862adcde42e70a49b99`; native Deno 2.9.7; Pagefind 1.3.0.
Command: `deno run --allow-read --allow-run --allow-env tools/docs-site/check-reproducible.ts`
Raw exit: **1**. Full raw build log retained in local project run evidence, SHA-256 `a810b55c81f7fd959d8dd4ee00c31bf44ff9e366d1bca3a3a43dfb17fb1a5ef9`.

Original differing paths, exactly as reported:

```text
Non-reproducible site: pagefind/filter/en_a165e82.pf_filter, pagefind/filter/en_d75596b.pf_filter, pagefind/pagefind-entry.json, pagefind/pagefind.en_804c5b34ad.pf_meta, pagefind/pagefind.en_b070b4bdc2.pf_meta
```

Both native builds completed; final fresh-ui output checks passed (52 components, 24 presets). No permissive mode was used and this failed evidence must remain after correction.
