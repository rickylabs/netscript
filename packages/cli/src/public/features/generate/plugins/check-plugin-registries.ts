import { join } from '@std/path';
import {
  PLUGIN_SURFACE_GENERATOR,
  PLUGIN_SURFACE_VERSION,
  type PluginAuthoredInput,
  type PluginSurfaceReport,
  type RenderPluginRegistries,
} from '../../../../kernel/domain/plugin-generated-surface.ts';
import type { GeneratedSurfaceDrift } from '../../../../kernel/domain/generated-surface.ts';
import type { GeneratedSourceFormatterPort } from '../../../../kernel/ports/generated-source-formatter-port.ts';
import {
  buildGeneratedOutputs,
  generatedContentDigest,
  inspectGeneratedOutputs,
} from '../../../../kernel/adapters/service/generated-surface-inventory.ts';
import {
  readInspectionFile,
  rejectInspectionLinks,
} from '../../../../kernel/adapters/service/generated-surface-reader.ts';
import { canonicalizePluginOutputs, isPluginOutputPath } from './plugin-registry-renderer.ts';

/** Check the shared plugin renderer's canonical bytes without invoking a project writer. */
export async function checkPluginRegistries(
  projectRoot: string,
  render: RenderPluginRegistries,
  formatter: GeneratedSourceFormatterPort,
): Promise<PluginSurfaceReport> {
  const base = { version: PLUGIN_SURFACE_VERSION, generator: PLUGIN_SURFACE_GENERATOR } as const;
  try {
    await rejectInspectionLinks(projectRoot, '.netscript/generated');
    const inputs: PluginAuthoredInput[] = [];
    const authorities = [
      'appsettings.json',
      'deno.json',
      'netscript.config.ts',
      'netscript.config.js',
      'netscript.config.mjs',
    ];
    const selectedInputs = new Set<string>();
    const addInput = async (path: string) => {
      if (selectedInputs.has(path)) return;
      const bytes = await readInspectionFile(projectRoot, path);
      if (!bytes) {
        if (path === 'appsettings.json' || path === 'deno.json') {
          throw new Error('Missing authored authority.');
        }
        return;
      }
      selectedInputs.add(path);
      inputs.push({
        generator: PLUGIN_SURFACE_GENERATOR,
        path,
        ownership: 'authored',
        digest: await generatedContentDigest(bytes),
      });
    };
    for (const path of authorities) await addInput(path);
    const surface = await render(projectRoot);
    const rendered = surface.registries;
    for (const registry of rendered) {
      for (const path of registry.sourceFiles) await addInput(path);
    }
    const files = await canonicalizePluginOutputs(projectRoot, rendered, formatter);
    const outputs = await buildGeneratedOutputs(
      files.map((file) => ({
        ...file,
        generator: `${PLUGIN_SURFACE_GENERATOR}:${file.plugin}`,
      })),
      isPluginOutputPath,
    );
    const drift: GeneratedSurfaceDrift[] = await inspectGeneratedOutputs(projectRoot, outputs);
    const selected = new Set(outputs.map((entry) => entry.path));
    for (const path of await registryLeaves(projectRoot)) {
      if (!selected.has(path)) drift.push({ path, kind: 'extra' });
    }
    return {
      ...base,
      inputs,
      producers: surface.producers,
      outputs,
      drift,
      status: drift.length ? 'drift' : 'current',
      exitCode: drift.length ? 1 : 0,
    };
  } catch (error) {
    return {
      ...base,
      producers: [],
      inputs: [],
      outputs: [],
      status: 'inspection-failure',
      exitCode: 1,
      drift: [{
        path: PLUGIN_SURFACE_GENERATOR,
        kind: 'inspection-failure',
        message: error instanceof Error ? error.message : String(error),
      }],
    };
  }
}

async function registryLeaves(projectRoot: string): Promise<readonly string[]> {
  const pending = ['.netscript/generated'];
  const leaves: string[] = [];
  let count = 0;
  while (pending.length) {
    const path = pending.pop()!;
    await rejectInspectionLinks(projectRoot, path);
    try {
      for await (const entry of Deno.readDir(join(projectRoot, path))) {
        if (++count > 4096) throw new Error('Plugin registry scan capacity exceeded.');
        // The plugin SDK emitter also writes axis registries beside these producer directories.
        if (
          path === '.netscript/generated' &&
          (!entry.name.startsWith('plugin-') || (!entry.isDirectory && !entry.isSymlink))
        ) continue;
        const child = `${path}/${entry.name}`;
        if (entry.isSymlink) throw new Error('Linked registry has no generated ownership.');
        if (entry.isDirectory) pending.push(child);
        else leaves.push(child);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return leaves.sort();
}
