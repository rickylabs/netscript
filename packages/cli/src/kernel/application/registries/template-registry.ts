import { Manifest, type ManifestEntry } from '../abstracts/manifest.ts';
import { isTemplateKey, TEMPLATE_MANIFEST, type TemplateKey } from '../../assets/manifest.ts';

export interface TemplateValue {
  readonly path: TemplateKey;
  readonly url: URL;
  readonly content?: string;
}

const ASSET_ROOT_URL = new URL('../../assets/', import.meta.url);

export class TemplateRegistry extends Manifest<TemplateKey, TemplateValue> {
  readonly id = 'template-registry';

  readonly #entries = new Map<TemplateKey, TemplateValue>();

  constructor(
    manifest: readonly { readonly key: TemplateKey; readonly path: TemplateKey }[] =
      TEMPLATE_MANIFEST,
  ) {
    super();
    for (const item of manifest) {
      this.register(item.key, {
        path: item.path,
        url: new URL(item.path, ASSET_ROOT_URL),
      });
    }
  }

  register(key: TemplateKey, value: TemplateValue): void {
    this.#entries.set(key, value);
  }

  get(key: TemplateKey): TemplateValue | undefined {
    return this.#entries.get(key);
  }

  entries(): readonly (readonly [TemplateKey, TemplateValue])[] {
    return [...this.#entries.entries()].sort(([left], [right]) => left.localeCompare(right));
  }

  read(key: TemplateKey): Promise<string> {
    const value = this.get(key);
    if (!value?.content) {
      throw new Error(`Template asset is not registered: ${key}`);
    }
    return Promise.resolve(value.content);
  }

  load(_root = ''): Promise<readonly ManifestEntry<TemplateKey, TemplateValue>[]> {
    const entries: ManifestEntry<TemplateKey, TemplateValue>[] = [];
    for (const [key, value] of this.entries()) {
      if (!isTemplateKey(key)) {
        throw new Error(`Template asset key is missing from manifest: ${key}`);
      }
      entries.push({ key, value });
    }
    return Promise.resolve(entries);
  }

  write(
    _root: string,
    _entries: readonly ManifestEntry<TemplateKey, TemplateValue>[],
  ): Promise<void> {
    return Promise.reject(
      new Error('TemplateRegistry is a pure manifest; use the template asset adapter to write.'),
    );
  }
}

export const DEFAULT_TEMPLATE_REGISTRY: TemplateRegistry = new TemplateRegistry();
