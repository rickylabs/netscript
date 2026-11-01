import type {
  UiRegistryCatalogPort,
  UiRegistryItemSummary,
} from '../ports/ui-registry-catalog-port.ts';

/** Lazily read the shipped Fresh UI catalog and its exact embedded copy bytes. */
export class FreshUiRegistryCatalog implements UiRegistryCatalogPort {
  /** Return metadata without loading component implementation modules or executing source. */
  async list(): Promise<readonly UiRegistryItemSummary[]> {
    const { freshUiRegistryJson } = await import('@netscript/fresh-ui/registry');
    return freshUiRegistryJson.items.map(({ name, type, title, description }) => ({
      name,
      type,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    }));
  }

  /** Build one portable item using the same publisher as ui:build. */
  async view(reference: string): Promise<Readonly<Record<string, unknown>> | undefined> {
    const { freshUiRegistryJson, FRESH_UI_REGISTRY_CONTENT } = await import(
      '@netscript/fresh-ui/registry'
    );
    const item = freshUiRegistryJson.items.find((entry) => entry.name === reference);
    if (!item) return undefined;
    const { buildRegistry } = await import('@netscript/fresh-ui/registry-v2');
    const result = await buildRegistry({
      registry: { ...freshUiRegistryJson, items: [item] },
      readSource: (path) => {
        const packagePath = path.startsWith('packages/fresh-ui/')
          ? path.slice('packages/fresh-ui/'.length)
          : `../../${path}`;
        const content = FRESH_UI_REGISTRY_CONTENT[path] ?? FRESH_UI_REGISTRY_CONTENT[packagePath];
        if (content === undefined) throw new Error('Registry copy bytes are unavailable.');
        return Promise.resolve(content);
      },
    });
    const payload = result[`${item.name}.json`];
    if (!payload) throw new Error('Registry publisher omitted the requested item.');
    return JSON.parse(payload) as Record<string, unknown>;
  }
}
