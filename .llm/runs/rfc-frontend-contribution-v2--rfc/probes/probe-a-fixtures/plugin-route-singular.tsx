/** @jsxImportSource npm:preact@^10.29.2 */
import { type Context, page, type PageProps } from 'jsr:@fresh/core@^2.3.3';

export const handler = (ctx: Context<Record<string, unknown>>) => {
  return page({ mode: 'singular-handler', pathname: ctx.url.pathname });
};

export default function PluginSingularPage({
  data,
}: PageProps<{ mode: string; pathname: string }>) {
  return (
    <div data-plugin-singular='true'>
      {data.mode}:{data.pathname}
    </div>
  );
}
