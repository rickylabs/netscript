import { definePartial } from '../../../src/application/builders/mod.ts';
import type {
  DefinedPartialRoute,
  PartialRouteConfig,
} from '../../../src/application/builders/mod.ts';

type PartialFixtureContext = unknown;
type PartialFixtureRoute = DefinedPartialRoute<PartialFixtureContext>;

const partial: PartialFixtureRoute = definePartial({
  name: 'builder-partial-fixture',
  loader: async () => await Promise.resolve({ label: 'partial-ready' }),
  component: (props: { label: string }) => <span>{props.label}</span>,
});

export const config: PartialRouteConfig = partial.config;
export const handler: PartialFixtureRoute['handler'] = partial.handler;
const defaultPartial: PartialFixtureRoute['default'] = partial.default;
export default defaultPartial;
