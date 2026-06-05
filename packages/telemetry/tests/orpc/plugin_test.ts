import { assertEquals } from '@std/assert';
import { ErrorHandlingPlugin, type GenericHandlerOptions, TracingPlugin } from '../../orpc.ts';

Deno.test('TracingPlugin registers both root and client interceptors', () => {
  const handlerOptions: GenericHandlerOptions = {};

  new TracingPlugin({ serviceName: 'users' }).init(handlerOptions);

  assertEquals(handlerOptions.rootInterceptors?.length, 1);
  assertEquals(handlerOptions.clientInterceptors?.length, 1);
});

Deno.test('ErrorHandlingPlugin registers a client interceptor', () => {
  const handlerOptions: GenericHandlerOptions = {};

  new ErrorHandlingPlugin({ serviceName: 'users' }).init(handlerOptions);

  assertEquals(handlerOptions.clientInterceptors?.length, 1);
});
