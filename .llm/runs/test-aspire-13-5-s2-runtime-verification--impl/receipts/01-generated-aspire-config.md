# Generated Aspire train override

Disposable project: `.llm/tmp/aspire-13-5-s2/aspire-13-5-postgres`

This edit applies S1 PR #1727's train to generated output only. It is not a generator change owned
by S2.

## Generated values from `origin/main`

```json
{
  "sdk": { "version": "13.4.6" },
  "packages": {
    "Aspire.Hosting.PostgreSQL": "13.4.6",
    "Aspire.Hosting.Redis": "13.4.6",
    "Aspire.Hosting.Browsers": "13.4.6-preview.1.26319.6"
  }
}
```

## Applied S1 values

```json
{
  "sdk": { "version": "13.5.3" },
  "packages": {
    "Aspire.Hosting.PostgreSQL": "13.5.3",
    "Aspire.Hosting.Redis": "13.5.3",
    "Aspire.Hosting.Browsers": "13.5.3-preview.1.26425.3"
  }
}
```

The PostgreSQL scaffold does not emit the optional CommunityToolkit Deno or SQLite package entries.
Their exact S1 value, `13.5.0`, is exercised independently by V9's scratch restore so the main graph
stays representative of the selected PostgreSQL scaffold.
