import { define } from '@app/utils.ts';

const THEME_INIT_SCRIPT =
  `(function(){var t=localStorage.getItem('ns-theme');if(!t){t=matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)})()`;

export default define.page(function AppShell({ Component }) {
  return (
    <html lang='en' data-theme='dark'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta
          name='description'
          content='NetScript starter scaffold with Fresh 2, Aspire orchestration, contracts, and enterprise UI primitives.'
        />
        <title>playground — dashboard</title>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link
          href='https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap'
          rel='stylesheet'
        />
        <script>{THEME_INIT_SCRIPT}</script>
      </head>
      <body f-client-nav>
        <a href='#main-content' class='ns-skip-link'>Skip to main content</a>
        <div id='main-content' tabIndex={-1}>
          <Component />
        </div>
      </body>
    </html>
  );
});
