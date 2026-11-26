/** @jsxImportSource npm:preact@^10.29.2 */
import type { PageProps } from 'jsr:@fresh/core@^2.3.3';

export function HostAppWrapper({ Component }: PageProps<unknown, Record<string, unknown>>) {
  return (
    <html lang='en' data-host-app='true'>
      <head>
        <meta charSet='utf-8' />
        <title>Host App</title>
      </head>
      <body f-client-nav={true}>
        <div data-host-app-chrome='true'>
          <Component />
        </div>
      </body>
    </html>
  );
}

export function PartialAwareHostAppWrapper({
  Component,
  isPartial,
}: PageProps<unknown, Record<string, unknown>>) {
  if (isPartial) {
    return <Component />;
  }
  return (
    <html lang='en' data-host-app='true'>
      <head>
        <meta charSet='utf-8' />
        <title>Host App</title>
      </head>
      <body f-client-nav={true}>
        <div data-host-app-chrome='true'>
          <Component />
        </div>
      </body>
    </html>
  );
}

export function ThrowingHostAppWrapper(): never {
  throw new Error('host _app blew up');
}

export default HostAppWrapper;
