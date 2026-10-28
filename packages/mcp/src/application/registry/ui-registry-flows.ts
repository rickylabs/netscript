import { isRecord } from '../../domain/schema.ts';
import type { UiRegistryCatalogPort } from '../../ports/ui-registry-catalog-port.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';

/** Maximum registry metadata entries returned in one MCP page. */
export const UI_REGISTRY_PAGE_LIMIT = 20;

/** Compose the four registry tools over an injected read-only catalog. */
export function createUiRegistryFlows(catalog: UiRegistryCatalogPort): Readonly<
  Record<
    | 'list_registry_items'
    | 'search_registry_items'
    | 'view_registry_item'
    | 'get_registry_add_command',
    ToolFlow
  >
> {
  const page = (search: boolean): ToolFlow => async (input) => {
    const options = isRecord(input) ? input : {};
    const query = search && typeof options.query === 'string' ? options.query.toLowerCase() : '';
    const offset = typeof options.offset === 'number' ? options.offset : 0;
    const limit = typeof options.limit === 'number' ? options.limit : UI_REGISTRY_PAGE_LIMIT;
    try {
      const matches = (await catalog.list()).filter((item) =>
        [item.name, item.type, item.title, item.description].some((value) =>
          value?.toLowerCase().includes(query)
        )
      );
      const items = matches.slice(offset, offset + Math.min(limit, UI_REGISTRY_PAGE_LIMIT));
      const nextOffset = offset + items.length;
      return {
        ok: true,
        value: {
          items,
          total: matches.length,
          ...(nextOffset < matches.length ? { nextOffset } : {}),
        },
      };
    } catch {
      return unavailable();
    }
  };
  return {
    list_registry_items: page(false),
    search_registry_items: page(true),
    view_registry_item: async (input) => {
      const reference = isRecord(input) && typeof input.name === 'string' ? input.name : '';
      try {
        const item = await catalog.view(reference);
        return item ? { ok: true, value: { item } } : {
          ok: false,
          error: { code: 'REGISTRY_ITEM_NOT_FOUND', message: 'Registry item not found.' },
        };
      } catch {
        return unavailable();
      }
    },
    get_registry_add_command: (input) => {
      const name = isRecord(input) && typeof input.name === 'string' ? input.name : '';
      if (!isItemReference(name)) {
        return Promise.resolve({
          ok: false,
          error: {
            code: 'INVALID_ITEM_REFERENCE',
            message: 'Use an item name, @namespace/name, or HTTP(S) URL.',
          },
        });
      }
      return Promise.resolve({ ok: true, value: { command: 'netscript', args: ['ui:add', name] } });
    },
  };
}

function unavailable(): ToolExecutionResult {
  // Catalog exceptions may contain transport credentials; never pass them to MCP clients.
  return {
    ok: false,
    error: { code: 'REGISTRY_UNAVAILABLE', message: 'The UI registry could not be read.' },
  };
}

function isItemReference(value: string): boolean {
  if (/^(?:@[a-zA-Z0-9][\w.-]*\/)?[a-zA-Z0-9][\w.-]*$/.test(value)) return true;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username &&
      !url.password;
  } catch {
    return false;
  }
}
