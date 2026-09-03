import { installPartialNavigationCoordinator } from '../../../src/runtime/navigation/mod.ts';

const navigation = installPartialNavigationCoordinator();
const routeEvents: string[] = [];

navigation.subscribe(({ kind, url }) => {
  routeEvents.push(`${kind}:${url.pathname}${url.search}`);
});

Object.assign(globalThis, {
  __partialNavigation: navigation,
  __partialNavigationEvents: routeEvents,
});
