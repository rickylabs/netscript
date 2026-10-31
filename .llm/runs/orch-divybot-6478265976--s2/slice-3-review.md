# Slice 3 review

**PASS**

I found no blocking issues in slice 3. What I checked:

- **Config** (`packages/cli/src/kernel/domain/ui/ui-config.ts`):
  - The schema rejects unknown fields at the top level, in `aliases` and in object-form registry sources.
  - Aliases must be relative paths with no `..`, empty segments, `.git`, backslash, colon or control characters.
  - Namespace keys must look like `@name`.
  - Registry URLs must be HTTP or HTTPS. Usernames, passwords, query strings and fragments are rejected. `github:` references and `github.com` tree/blob URLs are rewritten to raw content URLs.
  - Header templates are stored unresolved. The round-trip test confirms `${ACME_TOKEN}` is what gets written.
- **Lock** (`packages/cli/src/kernel/domain/ui/ui-lock.ts`, `packages/cli/src/kernel/application/ui/v2/config-lock.ts`):
  - The lock format is checked strictly, and every stored baseline's SHA-256 is recomputed and compared on read.
  - A missing lock and an empty lock are treated as different states.
  - A corrupted baseline and a wrong version are both rejected.
- **Credentials only in the adapter** (`packages/cli/src/kernel/adapters/ui/fetch-ui-registry.ts`):
  - `${VAR}` placeholders are filled from the environment only when the request is built. Error messages carry the variable name or the HTTP status, never a value.
  - Redirects are refused, so credentials can't be forwarded to another host. Invalid header values produce a generic error.
  - The real HTTP test confirms the header reaches the server, and that neither a 403 body echoing the credential nor a redirect leaks it into the error. The caller's template object is left unchanged.
- **Client** (`packages/cli/src/kernel/application/ui/v2/registry-client.ts`):
  - Namespace credentials only go to that namespace's own origin. Item file paths and catalog includes must be relative, and they are resolved against the namespace URL.
  - Absolute-URL dependencies are fetched with no headers.
  - Bare dependency names stay inside the namespace that requested them. Cycles and graphs over 256 items are rejected.
  - A returned item whose name doesn't match the request is rejected, and responses are cached per request.
  - Malformed JSON gives a generic error, so a server echoing the credential back doesn't leak it.
  - Remote modules are never imported.
- **Write plan** (`packages/cli/src/kernel/application/ui/v2/ui-write-plan.ts`): writes are held in memory and read back from there. Every destination is checked against the app root, plus the optional symlink check, before the first real write. Removing the app root itself is refused.
- **Tests:** there are six (1 transport, 2 client, 3 metadata), consistent with the stated count.

Two things for slice 4 and the final IMPL-EVAL, neither blocking now:
- **Symlink check is opt-in:** installer callers must pass `DenoUiRegistryPaths` to `commit()`, because the symlink check only runs when a path checker is supplied.
- **Diff misreports one newline case:** `uiFileDiff` in `packages/cli/src/kernel/domain/ui/ui-lock.ts` gets the trailing newline wrong when the installed copy lacks one and the local copy appends lines after it. For example, `"a\nb"` becoming `"a\nb\nc\n"` renders ` b` as unchanged context instead of showing the newline change. The fix is to step `prefix` back by one when the newline changed and `prefix === a.length`, whether or not it also equals `b.length`.
