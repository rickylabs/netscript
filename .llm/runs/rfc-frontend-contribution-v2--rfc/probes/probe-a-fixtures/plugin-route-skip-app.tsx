/** @jsxImportSource npm:preact@^10.29.2 */
import type { RouteConfig } from 'jsr:@fresh/core@^2.3.3';

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export const css = ['/assets/bare-fragment.css'];

export default function BareFragmentRoute() {
  return <div data-bare-fragment='true'>bare fragment without shell</div>;
}
