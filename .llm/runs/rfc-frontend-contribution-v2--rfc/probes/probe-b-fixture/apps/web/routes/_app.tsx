import { define } from '@app/utils.ts';

export default define.page(function AppShell({ Component }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <title>Probe B Fixture</title>
      </head>
      <body class='app-shell-frame'>
        <main id='app-root'>
          <Component />
        </main>
      </body>
    </html>
  );
});
