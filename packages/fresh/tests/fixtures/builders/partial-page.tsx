import { definePartial } from '../../../builders/mod.ts';

const partial = definePartial({
  name: 'builder-partial-fixture',
  loader: async () => await Promise.resolve({ label: 'partial-ready' }),
  component: (props: { label: string }) => <span>{props.label}</span>,
});

export const config = partial.config;
export const handler = partial.handler;
export default partial.default;
