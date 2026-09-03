import {
  installPartialNavigationCoordinator,
  KeyedPartial,
  type KeyedPartialProps,
  type PartialNavigationCoordinator,
  type RouteChange,
} from '@netscript/fresh/navigation';
import type { ComponentChild } from 'preact';

const install: () => PartialNavigationCoordinator = installPartialNavigationCoordinator;
declare const navigation: PartialNavigationCoordinator;

navigation.navigate('/orders');
const unsubscribe: () => void = navigation.subscribe((change: RouteChange) => {
  const route: URL = change.url;
  const kind: 'push' | 'replace' | 'pop' = change.kind;
  const state: unknown = change.state;
  void route;
  void kind;
  void state;
});

const props: KeyedPartialProps = {
  name: 'order-summary',
  mode: 'replace',
  children: 'Loading order',
};
const boundary: ComponentChild = KeyedPartial(props);

unsubscribe();
void navigation.dispose();
void install;
void boundary;
