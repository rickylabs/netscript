import { join } from '@std/path';
import {
  PLUGIN_SURFACE_GENERATOR,
  PLUGIN_SURFACE_VERSION,
  type PluginAuthoredInput,
  type PluginGeneratedOutput,
  type PluginSurfaceReport,
  type RenderPluginRegistries,
} from '../../../../kernel/domain/plugin-generated-surface.ts';
import type { AspireSurfaceDrift } from '../../../../kernel/domain/aspire-generated-surface.ts';
import type { GeneratedSourceFormatterPort } from '../../../../kernel/ports/generated-source-formatter-port.ts';
import { aspireContentDigest } from '../../../../kernel/adapters/service/aspire-surface-inventory.ts';
import {
  readInspectionFile,
  rejectInspectionLinks,
} from '../../../../kernel/adapters/service/generated-surface-reader.ts';
import { canonicalizePluginOutputs, pluginSurfaceMarker } from './plugin-registry-renderer.ts';

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
        digest: await aspireContentDigest(bytes),
      });
    };
    for (const path of authorities) await addInput(path);
    const rendered = await render(projectRoot);
    for (const registry of rendered) {
      for (const path of registry.sourceFiles) await addInput(path);
    }
    const files = await canonicalizePluginOutputs(projectRoot, rendered, formatter);
    const outputs: PluginGeneratedOutput[] = [];
    const drift: AspireSurfaceDrift[] = [];
    for (const file of files) {
      const digest = await aspireContentDigest(new TextEncoder().encode(file.content));
      outputs.push({
        generator: `${PLUGIN_SURFACE_GENERATOR}:${file.plugin}`,
        path: file.path,
        ownership: 'generated',
        digest,
      });
      const bytes = await readInspectionFile(projectRoot, file.path);
      if (!bytes) {
        drift.push({ path: file.path, kind: 'missing' });
        continue;
      }
      const marker = new TextEncoder().encode(pluginSurfaceMarker(file.plugin));
      if (!marker.every((byte, index) => bytes[index] === byte)) {
        drift.push({ path: file.path, kind: 'ownership' });
      }
      if (await aspireContentDigest(bytes) !== digest) {
        drift.push({ path: file.path, kind: 'bytes' });
      }
    }
    const selected = new Set(outputs.map((entry) => entry.path));
    for (const path of await registryLeaves(projectRoot)) {
      if (!selected.has(path)) drift.push({ path, kind: 'extra' });
    }
    return {
      ...base,
      inputs,
      outputs,
      drift,
      status: drift.length ? 'drift' : 'current',
      exitCode: drift.length ? 1 : 0,
    };
  } catch (error) {
    return {
      ...base,
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
