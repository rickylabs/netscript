import { join } from '@std/path';
import type { RenderedPluginRegistry } from '../../../../kernel/domain/plugin-generated-surface.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { readInspectionFile } from '../../../../kernel/adapters/service/generated-surface-reader.ts';
import { pluginSurfaceMarker } from './plugin-registry-renderer.ts';

/** Retire an inactive declared target only when its exact producer owns the existing bytes. */
export async function removeInactivePluginRegistries(
  projectRoot: string,
  registries: readonly RenderedPluginRegistry[],
  fs: FileSystemPort,
): Promise<void> {
  for (const registry of registries) {
    if (registry.content !== null) continue;
    const bytes = await readInspectionFile(projectRoot, registry.path);
    if (!bytes) continue;
    const marker = new TextEncoder().encode(pluginSurfaceMarker(registry.plugin));
    if (marker.every((byte, index) => bytes[index] === byte)) {
      await fs.remove(join(projectRoot, registry.path));
    }
  }
}
