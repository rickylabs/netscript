/** Shared compatibility types for page builders.
 *
 * @module
 */

/** Empty object shape used by page builders without typed state. */
export type EmptyRecord = Record<string, never>;

/** Generic object map used by resources and layer registries. */
export type UnknownRecord = Record<string, unknown>;

/** Layer props keyed by layer id. */
export type PageLayerMap = Record<string, object>;

/** Renderable content accepted by builder-owned components, layouts, and slots. */
export type PageRenderable =
  | null
  | undefined
  | boolean
  | number
  | bigint
  | string
  | {
    readonly type?: unknown;
    readonly props?: unknown;
    readonly key?: unknown;
  }
  | readonly PageRenderable[];

/** Minimal component contract accepted by page and partial builders. */
export interface ComponentLike<TProps extends object> {
  /** Render the component with the provided props. */
  (props: TProps): PageRenderable;
}

/** Fresh route config emitted by framework partial routes. */
export type PartialRouteConfig = import('fresh').RouteConfig;

/** Minimal cache-entry shape accepted by page layer loaders. */
export interface PageCacheEntry<T> {
  /** Cached payload. */
  readonly data: T;
  /** Unix epoch timestamp in milliseconds. */
  readonly cachedAt: number;
}
