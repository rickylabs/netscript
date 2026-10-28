import type { UiRegistryCatalogPort, UiRegistryItemSummary } from '@netscript/mcp';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { UiRegistryTransportPort } from '../../../../kernel/ports/ui-registry-port.ts';
import { readUiConfig } from '../../../../kernel/application/ui/v2/config-lock.ts';
import { createUiRegistryClient } from '../../../../kernel/application/ui/v2/registry-client.ts';

/** Share the app's CLI registry configuration and transport with read-only MCP discovery. */
export function createCliUiRegistryCatalog(
  root: string,
  fs: FileSystemPort,
  transport: UiRegistryTransportPort,
): UiRegistryCatalogPort {
  const client = async () => {
    const config = await readUiConfig(root, fs);
    return { config, registry: await createUiRegistryClient(config, { transport }) };
  };
  return {
    list: async (): Promise<readonly UiRegistryItemSummary[]> => {
      const { config, registry } = await client();
      const namespaces = [undefined, ...Object.keys(config.registries)];
      const catalogs = await Promise.all(namespaces.map(async (namespace) => {
        const catalog = await registry.catalog(namespace);
        return catalog.items.map(({ name, type, title, description }) => ({
          name: namespace ? `${namespace}/${name}` : name,
          type,
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
        }));
      }));
      return catalogs.flat();
    },
    view: async (reference) => {
      const { registry } = await client();
      if (!reference.startsWith('@') && !/^(?:https?:|github:)/.test(reference)) {
        if (!(await registry.catalog()).items.some((item) => item.name === reference)) {
          return undefined;
        }
      }
      const resolved = await registry.item(reference);
      return { ...resolved.item, files: resolved.files };
    },
  };
}
