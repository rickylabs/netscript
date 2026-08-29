# aspire mcp command

## Name

`aspire mcp` - Interact with
<abbr title="Model Context Protocol" data-tooltip-placement="top">MCP</abbr> tools exposed by Aspire
resources.

## Synopsis

```bash title="Aspire CLI"
aspire mcp [command] [options]
```

## Description

The `aspire mcp` command lets you discover and call MCP (Model Context Protocol) tools exposed by
resources in a running AppHost. Use it to inspect available tools and invoke them from the terminal.

**Note:** The `aspire mcp` command interacts with tools exposed by running resources. To start the
MCP server used by compatible AI agents, use [`aspire agent mcp`](../aspire-agent-mcp/).

## Options

The following options are available:

- <Include relativePath="reference/cli/includes/option-help.md" />

- <Include relativePath="reference/cli/includes/option-log-level.md" />

- <Include relativePath="reference/cli/includes/option-non-interactive.md" />

- <Include relativePath="reference/cli/includes/option-nologo.md" />

- <Include relativePath="reference/cli/includes/option-banner.md" />

- <Include relativePath="reference/cli/includes/option-wait.md" />

## Commands

The following commands are available:

| Command                                    | Function                                     |
| ------------------------------------------ | -------------------------------------------- |
| [`aspire mcp tools`](../aspire-mcp-tools/) | List MCP tools exposed by running resources. |
| [`aspire mcp call`](../aspire-mcp-call/)   | Call an MCP tool on a running resource.      |

## Examples

- List MCP tools exposed by the current AppHost:

  ```bash title="Aspire CLI"
  aspire mcp tools
  ```

- Call a tool on a running resource:

  ```bash title="Aspire CLI"
  aspire mcp call myresource mytool
  ```

## See also

- [aspire mcp tools](../aspire-mcp-tools/)
- [aspire mcp call](../aspire-mcp-call/)
- [aspire agent mcp](../aspire-agent-mcp/)
