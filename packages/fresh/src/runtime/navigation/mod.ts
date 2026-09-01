/**
 * Ordered Fresh partial navigation with an explicit browser lifecycle.
 *
 * Imports are inert and safe during SSR. Install the coordinator from client
 * code, retain the returned handle, and await disposal during client cleanup.
 *
 * @example
 * ```ts
 * import { installPartialNavigationCoordinator } from '@netscript/fresh/navigation';
 *
 * const navigation = installPartialNavigationCoordinator();
 * const unsubscribe = navigation.subscribe((change) => {
 *   currentRoute.value = change.url.pathname;
 * });
 * navigation.navigate('/orders');
 *
 * unsubscribe();
 * await navigation.dispose();
 * ```
 *
 * @module
 */

export { installPartialNavigationCoordinator } from './coordinator.ts';
export { KeyedPartial } from './keyed-partial.tsx';
export type {
  ComponentChild,
  ComponentChildren,
  KeyedPartialProps,
  PartialNavigationCoordinator,
  RouteChange,
} from './types.ts';
