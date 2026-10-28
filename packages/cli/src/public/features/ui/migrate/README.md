# Utility variant migration

`netscript ui:migrate variants --project-root <workspace> [--app <name>] [--dry-run]`
converts app-owned 0.0.8 Fresh UI copies. Commit local work first, preview the list with
`--dry-run`, apply it, then run the app's `deno task check`. Running it again makes no changes.
Use the CLI and Fresh UI package from the release containing the data-attribute contract together.

The command resolves the Fresh app through the existing UI resolver. It visits app TSX/CSS,
keeps base/element/custom classes, and skips dependency copies, generated output and symlinks.
It leaves registry manifests and ownership hashes alone; customized copy-source updates remain
manual merges through the existing registry lifecycle.

Shipped components use reviewed, context-checked source edits, including their dynamic class
maps, part markers and SidebarToggle's state mutations. The data records the exact 0.0.8 source
commit. Structural edits preserve code outside their matched spans, including rewritten import aliases.
Changed files are then formatted with the existing canonical Deno formatter before any app writes.
Ambiguous or customized spans produce a diagnostic instead of guessing. Arbitrary dynamic class
expressions require a manual merge. Literal native markup, supported headless trigger/close props and CSS selectors use a bounded tokenizer;
strings, comments and declarations are preserved. CSS uses `:where` to retain specificity.

Every file is analyzed before any file is written. A diagnostic aborts the entire batch. The
write phase checks that originals have not changed; an IO failure attempts to restore every
written original and names any file it could not restore. This is not a filesystem transaction:
run against a quiet working tree. `--dry-run` performs the same analysis without writing.

To refresh the reviewed source edits after an intentional component change:

```sh
deno run -A --frozen .llm/tools/generate-ui-variant-migration.ts 9a31e879c32a8066c50946a57976f3da34ba43a6
```

Review generated hunks as source, run the migration tests and replay the complete 0.0.8 consumer
conversion before committing. The generator and migration never modify a repository lockfile.

Layout utility classes (`ns-stack`, `ns-cluster`, `ns-shell`, `ns-section`, `ns-scroll-region`,
`ns-grid`) keep their legacy aliases. The migrated CSS accepts both their old classes and new
internal attributes with equal specificity. Modifiers on controlled component invocations such as
`<Button class="ns-btn--destructive">` require a manual conversion to public props (`variant`,
`size`, etc.); passing attributes that the component would overwrite is refused. Headless
trigger/close components may forward variant/size/icon attributes; their owned state remains under
the headless controller. Unsupported cases stop the whole batch before writes.
