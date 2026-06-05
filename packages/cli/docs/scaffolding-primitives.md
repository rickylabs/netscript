# Plugin Scaffolding Primitives

NetScript plugin packages can ship their own scaffolding without copying CLI command internals. The
public entrypoint is:

```ts
import { createPluginScaffoldContext, writePluginScaffoldFiles } from '@netscript/cli/scaffolding';
```

The recommended integration model is:

1. The plugin owns its template registry.
2. The host supplies filesystem and template-rendering adapters.
3. The plugin exposes a small scaffold function that accepts a request and dependencies.
4. The CLI or another host calls that function from a feature-owned command.

## Stable Concepts

Plugin scaffolders should model these concepts explicitly:

- `PluginScaffoldDefinition`: names the files and directories a plugin can render.
- `PluginScaffoldContext`: describes the target path, plugin name, variables, and overwrite mode.
- `PluginScaffoldDependencies`: carries filesystem and template rendering ports.
- `ScaffoldResult`: reports created files, directories, skipped files, and operation count.

## Example Shape

```ts
import {
  createPluginScaffoldContext,
  type PluginScaffoldDefinition,
  StringTemplateAdapter,
  writePluginScaffoldFiles,
} from '@netscript/cli/scaffolding';

const definition: PluginScaffoldDefinition = {
  directories: [{ path: 'src' }],
  templates: [{
    path: 'src/mod.ts',
    content: 'export const pluginName = "{{pluginName}}";\n',
  }],
};

const context = createPluginScaffoldContext({
  targetPath: '/workspace/plugins/audit-log',
  pluginName: 'audit-log',
});

const template = new StringTemplateAdapter(fs);
const result = await writePluginScaffoldFiles(definition, context, { fs, template });
```

## Ownership Rules

Plugin packages should own plugin-specific templates, option validation, and package metadata.
Shared CLI primitives own filesystem access, rendering mechanics, and result reporting. Plugin
packages own plugin-specific templates, defaults, and package metadata.
