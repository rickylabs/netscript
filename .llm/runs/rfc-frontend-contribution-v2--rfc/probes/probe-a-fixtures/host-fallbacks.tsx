/** @jsxImportSource npm:preact@^10.29.2 */
import { page, type PageProps, type RouteConfig } from 'jsr:@fresh/core@^2.3.3';

export const hostNotFoundHandler = () => page(null, { status: 404 });

export function HostNotFoundPage({ url }: PageProps<unknown, Record<string, unknown>>) {
  return (
    <section data-host-404='true'>
      <h1>Host 404</h1>
      <p>{url.pathname}</p>
    </section>
  );
}

export function HostErrorPage({ error }: PageProps<unknown, Record<string, unknown>>) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <section data-host-error='true'>
      <h1>Host Error</h1>
      <p>{message}</p>
    </section>
  );
}

export const isolatedErrorConfig: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export function IsolatedHostErrorPage({ error }: PageProps<unknown, Record<string, unknown>>) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <section data-isolated-host-error='true'>
      <h1>Isolated Host Error</h1>
      <p>{message}</p>
    </section>
  );
}
