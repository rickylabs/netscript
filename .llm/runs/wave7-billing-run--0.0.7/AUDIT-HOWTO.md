# How to query the NetScript MCP from an audit agent

Workspace: `/home/agent/projects/netscript/wave7-billing`
Put the workspace CLI on PATH first:

```bash
export PATH="/home/agent/projects/netscript/wave7-billing/.deno-install/bin:$PATH"
T=/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/wave7-billing-run--0.0.7/mcp-ask.ts
W=/home/agent/projects/netscript/wave7-billing
deno run -A $T $W list                     # 22 tools
deno run -A $T $W call <tool> '<json>'     # call one
```

Highest-value tools for an idiom audit:

| Tool | Argument | Use |
| --- | --- | --- |
| `find_guidance` | `{"intent":"<task in plain words>"}` | **Start here.** Ordered section-level guidance + cited code for how NetScript wants a task done |
| `search_docs` | `{"query":"..."}` | public docs search |
| `get_doc` | `{"slug":"pages/..."}` | full section |
| `find_export` | `{"symbol":"..."}` | which package/subpath exports a symbol |
| `list_package_exports` | `{"package":"@netscript/fresh-ui"}` | the real surface of a package |
| `get_export` | `{"symbol":"..."}` | exact signature + JSDoc |
| `search_exports` | `{"query":"..."}` | find related helpers you did not know existed |

Note the argument key is `intent`, not `task` — a wrong key returns
`$.intent is required`.

**Worked example.** `find_guidance {"intent":"derive contract Zod schemas from generated Prisma
database schemas"}` returns, with high confidence, that `netscript db generate` writes a CRUD barrel
imported as `@database/zod` exposing `<Model>Schema` / `<Model>CreateInput` / `<Model>UpdateInput`,
and that a contract module must *derive* rather than copy:

```ts
import { UserSchema as DatabaseUserSchema } from '@database/zod';
export const UsersListItemSchemaV1 = DatabaseUserSchema
  .pick({ id: true, name: true })
  .extend({ status: z.enum(['active', 'invited']) });
```

That is the citation form every finding must carry: **the idiomatic path from the MCP, the actual
code in the tree, and the gap between them.**
