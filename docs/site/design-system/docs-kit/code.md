---
layout: layouts/base.vto
templateEngine: [vento, md]
title: Code gallery
description: Code languages, filenames and keyboard tabs in the NetScript design system.
url: /design-system/docs-kit/code/
order: 2
codeTabs: [{"label": "TypeScript", "filename": "src/greeting.ts", "lang": "ts", "code": "// A typed greeting\nexport function greet(name: string): string {\n  return `Hello ${name}`;\n}\nconst ready = true;\nconst count = 42;"}, {"label": "Shell", "filename": "scripts/start.sh", "lang": "sh", "code": "#!/bin/sh\nprintf '%s\\n' 'Hello NetScript'"}, {"label": "JSON", "filename": "deno.json", "lang": "jsonc", "code": "// App configuration\n{ \"tasks\": { \"start\": \"deno run main.ts\" } }"}]
filenameCode: "export interface User {\n  name: string;\n}\nexport const limit = 42;"
---

# Code gallery

Filename blocks and tabs share a header with the language and Copy. Every example remains readable without JavaScript.

## Mixed-language tabs

{{ comp.tabbedCode({ tabs: codeTabs }) }}

## Filename block

{{ comp.codeBlock({ filename: "services/users.contract.ts", lang: "typescript", code: filenameCode }) }}

## Fresh UI source files

Install the application component with `netscript ui:add code-block`. Hydrate it in a Fresh island to enable file selection and clipboard feedback:

```tsx
import { CodeBlock } from '@/components/ui/code-block.tsx';

export default function SourceExample() {
  return <CodeBlock
    tabs={[
      { value: 'contract', label: 'users.contract.ts', lang: 'TypeScript', code: 'export const limit = 42;' },
      { value: 'command', label: 'check.sh', lang: 'Shell', code: 'deno task check' },
    ]}
    lineNumbers
    footer
  />;
}
```

Arrow keys follow the page direction; Home and End select the first and last file. Tab reaches Copy and the native code scroll region. Copy writes the selected file's raw source. Diff rows accept `variant: 'added' | 'removed' | 'highlighted'`; their visible signs supplement color, and the header reports additions and deletions. Without an explicit `code`, copied diff text excludes removed rows. Plain source is escaped; trusted syntax slots can use `CodeBlock.Token` without a bundled parser. `header={false}` preserves file tabs while hiding optional header chrome.

## TypeScript

```tsx
// routes/index.tsx
export function Greeting({ name }: { name: string }) {
  return <p>Hello {name}</p>;
}
```

## Shell

```sh
# scripts/check.sh
printf '%s\n' 'ready'
```

## Python

```python
# scripts/greet.py
class Greeting:
    def say(self, name: str) -> str:
        return f"Hello {name}"
ready = True
count = 42
```

## PowerShell

```powershell
# scripts/check.ps1
$ready = $true
Write-Output "Hello NetScript"
```

## JSON with comments

```jsonc
// deno.json
{ "tasks": { "check": "deno check main.ts" }, "ready": true, "count": 42 }
```

## Markdown

```markdown
# Readable docs

A **strong** statement and a [link](https://example.com).
```

## Environment

```dotenv
# Local app configuration
APP_NAME="NetScript"
READY=true
COUNT=42
```

## YAML

```yaml
# App configuration
name: NetScript
ready: true
count: 42
```

## CSS

```css
/* A content layout */
.content { display: grid; gap: 1rem; }
```

## Diff

```diff
--- before.ts
+++ after.ts
@@ -1 +1 @@
-export const ready = false;
+export const ready = true;
```

## SQL

```sql
-- Find recent users
SELECT name, created_at FROM users WHERE active = true LIMIT 42;
```

## HTML

```html
<article class="content"><h1>Hello NetScript</h1></article>
```

## XML

```xml
<message ready="true">Hello NetScript</message>
```
