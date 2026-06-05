import { assertEquals, assertExists } from '@std/assert';
import { getToast, REGISTRY_TOAST_QUERY_KEYS, stripToastFromUrl, withToast } from './toast.ts';

Deno.test('withToast appends toast params to a path', () => {
  const result = withToast('/users/42', {
    type: 'success',
    title: 'User created',
    message: 'Directory profile is live.',
  });

  const url = new URL(`https://fresh-ui.netscript.local${result}`);

  assertEquals(url.pathname, '/users/42', 'Expected /users/42 pathname');
  assertEquals(
    url.searchParams.get(REGISTRY_TOAST_QUERY_KEYS.type),
    'success',
    'Expected success toast type',
  );
});

Deno.test('getToast returns undefined when message is missing', () => {
  const toast = getToast(new URL('https://fresh-ui.netscript.local/users/42'));

  assertEquals(toast, undefined, 'Expected no toast when query params are absent');
});

Deno.test('getToast defaults invalid types to info', () => {
  const toast = getToast(
    new URL('https://fresh-ui.netscript.local/users/42?toastMessage=Saved&toastType=invalid'),
  );

  assertExists(toast, 'Expected a toast when message is present');
  assertEquals(toast.type, 'info', 'Expected invalid toast types to fall back to info');
});

Deno.test('stripToastFromUrl removes only toast params and preserves other URL parts', () => {
  const result = stripToastFromUrl(
    new URL(
      'https://fresh-ui.netscript.local/users/42?tab=activity&toastMessage=Saved&toastType=success&toastTitle=User+updated#briefing',
    ),
  );

  assertEquals(
    result,
    '/users/42?tab=activity#briefing',
    'Expected clean URL to preserve non-toast params and hash',
  );
});
