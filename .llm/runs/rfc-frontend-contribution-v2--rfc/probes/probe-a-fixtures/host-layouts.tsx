/** @jsxImportSource npm:preact@^10.29.2 */
import type { PageProps } from 'jsr:@fresh/core@^2.3.3';
import { Partial } from 'jsr:@fresh/core@^2.3.3/runtime';

export function HostRootLayout({ Component }: PageProps<unknown, Record<string, unknown>>) {
  return (
    <div data-host-root-layout='true'>
      <Component />
    </div>
  );
}

export function PartialAwareHostRootLayout({
  Component,
  isPartial,
}: PageProps<unknown, Record<string, unknown>>) {
  if (isPartial) {
    return <Component />;
  }
  return (
    <div data-host-root-layout='true'>
      <Component />
    </div>
  );
}

export function NaiveShellPluginsLayout({ Component }: PageProps<unknown, Record<string, unknown>>) {
  return (
    <div data-persistent-shell='true'>
      <aside data-shell-chrome='true'>Host Persistent Shell Sidebar</aside>
      <main data-shell-main='true'>
        <Partial name='main'>
          <Component />
        </Partial>
      </main>
    </div>
  );
}

export function PartialAwareShellPluginsLayout({
  Component,
  isPartial,
}: PageProps<unknown, Record<string, unknown>>) {
  if (isPartial) {
    return (
      <Partial name='main'>
        <Component />
      </Partial>
    );
  }
  return (
    <div data-persistent-shell='true'>
      <aside data-shell-chrome='true'>Host Persistent Shell Sidebar</aside>
      <main data-shell-main='true'>
        <Partial name='main'>
          <Component />
        </Partial>
      </main>
    </div>
  );
}

export function AntiPatternOuterPartialShellLayout({
  Component,
}: PageProps<unknown, Record<string, unknown>>) {
  return (
    <Partial name='main'>
      <div data-persistent-shell='true'>
        <aside data-shell-chrome='true'>Host Persistent Shell Sidebar</aside>
        <main data-shell-main='true'>
          <Component />
        </main>
      </div>
    </Partial>
  );
}

export function ThrowingLayout(): never {
  throw new Error('host _layout blew up');
}
