# Draft comment for #411

S8 (#1720) provides a concrete TypeScript-SDK vocabulary feed for DDX-1 without changing the
`@netscript/aspire` contribution seam owned by this issue:

- a generated resource owns typed actions through
  `withCommand(name, displayName, callback, { commandOptions: { arguments } })`;
- callbacks read typed values from `await context.arguments()` and return
  `{ success, message }`;
- CLI invocation is `aspire resource <resource> <command> --<argument>`;
- `excludeFromMcp()` controls MCP exposure only and is independent of dashboard/API visibility;
- destructive commands validate an explicit typed confirmation before their emitted runtime edge
  performs connection or process IO.

The S8 implementation applies that vocabulary only to generated `<db>-cli` resources and does not
add `command`/`app` resource kinds or plugin contribution changes. When DDX-1 widens the public
contribution seam, it can reuse these upstream member names and argument/result semantics rather
than introducing a second command model. Aspire 13.5.3's restored TypeScript projection currently
types `ResourceCommandVisibility` as a string enum, so the UI+API default is safer than a bitwise
combination unless the upstream projection changes.
