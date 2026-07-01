/**
 * @module
 * Stable runtime entrypoints for `@netscript/fresh-ui`.
 *
 * Copy-based registry components and islands intentionally remain on
 * workspace-local deep paths so applications can own and evolve them
 * after copy. This root entrypoint exposes only the supported helper
 * utilities that are safe to consume as package runtime dependencies.
 */

export {
  Icon,
  ICON_PATHS,
  type IconName,
  type IconProps,
  type IconSize,
  type IconSvgAttributes,
  type IconSvgAttributeValue,
  type PrimitiveChild,
  type PrimitiveChildren,
  type PrimitiveNode,
  type VisuallyHiddenStyle,
} from './primitives.tsx';
export {
  DATA_GRID_CELL_VARIANTS,
  DataGrid,
  type DataGridCellVariant,
  type DataGridColumn,
  type DataGridNode,
  type DataGridProps,
  type DataGridRenderable,
  type DataGridRow,
} from './src/presentation/data-grid.tsx';
export {
  getToast,
  REGISTRY_TOAST_QUERY_KEYS,
  type RegistryToast,
  type RegistryToastType,
  stripToastFromUrl,
  withToast,
} from './registry/lib/toast.ts';
export { cn } from './registry/lib/cn.ts';
