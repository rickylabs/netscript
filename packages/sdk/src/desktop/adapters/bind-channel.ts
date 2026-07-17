import {
  DEFAULT_DESKTOP_RPC_BINDING,
  DESKTOP_BIND_ERROR_NAMES,
  DESKTOP_BIND_OPERATIONS,
  DESKTOP_BIND_RESULT_STATUSES,
  DESKTOP_PORT_CLOSE_REASONS,
} from '../domain/constants.ts';
import type {
  CreateDesktopBindClientPortOptions,
  DesktopBindAcceptedResult,
  DesktopBindClientPort,
  DesktopBindClosedResult,
  DesktopBindHandlerResult,
  DesktopBindingErrorShape,
  DesktopBindingInvoke,
  DesktopBindServerPort,
  DesktopPortCloseResult,
  DesktopRpcFrame,
} from '../domain/types.ts';

const ACCEPTED_RESULT: DesktopBindAcceptedResult = {
  status: DESKTOP_BIND_RESULT_STATUSES.ACCEPTED,
};

const CLOSED_RESULT: DesktopBindClosedResult = {
  status: DESKTOP_BIND_RESULT_STATUSES.CLOSED,
};

/** Error thrown when a named Deno Desktop webview binding cannot be resolved. */
export class DesktopBindingUnavailableError extends Error {
  /** Create an unavailable-binding error. */
  constructor(bindingName: string) {
    super(`Deno Desktop binding "${bindingName}" is unavailable`);
    this.name = DESKTOP_BIND_ERROR_NAMES.UNAVAILABLE;
  }
}

/** Error thrown when a bind-channel call violates the SDK protocol. */
export class DesktopBindingProtocolError extends Error {
  /** Create a bind-protocol error. */
  constructor(message: string) {
    super(message);
    this.name = DESKTOP_BIND_ERROR_NAMES.PROTOCOL;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isDesktopBindingErrorShape(value: unknown): value is DesktopBindingErrorShape {
  return isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.message === 'string' &&
    (value.stack === undefined || typeof value.stack === 'string');
}

function isDesktopRpcFrame(value: unknown): value is DesktopRpcFrame {
  return typeof value === 'string' || value instanceof Uint8Array;
}

function isClosedResult(value: unknown): value is DesktopBindClosedResult {
  return isRecord(value) && value.status === DESKTOP_BIND_RESULT_STATUSES.CLOSED;
}

function validateBindingName(bindingName: string): string {
  if (bindingName.trim().length === 0) {
    throw new TypeError('Desktop binding name must not be empty');
  }
  return bindingName;
}

/** Rehydrate Deno Desktop's plain cross-realm error shape as an `Error`. */
export function normalizeDesktopBindingError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (isDesktopBindingErrorShape(value)) {
    const error = new Error(value.message);
    error.name = value.name;
    if (value.stack !== undefined) {
      error.stack = value.stack;
    }
    return error;
  }
  return new Error('Deno Desktop binding failed', { cause: value });
}

/** Resolve a named function from Deno Desktop's dynamic webview `bindings` proxy. */
export function resolveDesktopBindingInvoke(bindingName: string): DesktopBindingInvoke {
  const resolvedName = validateBindingName(bindingName);
  const bindings: unknown = Reflect.get(globalThis, 'bindings');
  if (!isRecord(bindings)) {
    throw new DesktopBindingUnavailableError(resolvedName);
  }
  const binding: unknown = Reflect.get(bindings, resolvedName);
  if (typeof binding !== 'function') {
    throw new DesktopBindingUnavailableError(resolvedName);
  }

  return async (operation, payload): Promise<unknown> => {
    const args: readonly unknown[] = payload === undefined ? [operation] : [operation, payload];
    const result: unknown = Reflect.apply(binding, bindings, args);
    return await Promise.resolve(result);
  };
}

/** Create the webview MessagePort endpoint backed by one Deno Desktop binding. */
export function createDesktopBindClientPort(
  options: CreateDesktopBindClientPortOptions = {},
): DesktopBindClientPort {
  const bindingName = validateBindingName(options.bindingName ?? DEFAULT_DESKTOP_RPC_BINDING);
  const invoke = options.invoke ?? resolveDesktopBindingInvoke(bindingName);
  const channel = new MessageChannel();
  const closedState = Promise.withResolvers<DesktopPortCloseResult>();
  let isClosed = false;
  let sendQueue: Promise<void> = Promise.resolve();

  const stop = (result: DesktopPortCloseResult): void => {
    if (isClosed) {
      return;
    }
    isClosed = true;
    channel.port1.dispatchEvent(new Event('close'));
    channel.port1.close();
    channel.port2.close();
    closedState.resolve(result);
  };

  const fail = (value: unknown): void => {
    stop({
      reason: DESKTOP_PORT_CLOSE_REASONS.TRANSPORT_ERROR,
      error: normalizeDesktopBindingError(value),
    });
  };

  channel.port2.addEventListener('message', (event): void => {
    if (isClosed) {
      return;
    }
    if (!isDesktopRpcFrame(event.data)) {
      fail(new DesktopBindingProtocolError('oRPC posted a non-string/binary Desktop frame'));
      return;
    }
    sendQueue = sendQueue
      .then(async (): Promise<void> => {
        await invoke(DESKTOP_BIND_OPERATIONS.SEND, event.data);
      })
      .catch((error: unknown): void => {
        fail(error);
      });
  });

  const receive = async (): Promise<void> => {
    while (!isClosed) {
      try {
        const result = await invoke(DESKTOP_BIND_OPERATIONS.RECEIVE);
        if (isClosed) {
          return;
        }
        if (isClosedResult(result)) {
          stop({ reason: DESKTOP_PORT_CLOSE_REASONS.CLOSED });
          return;
        }
        if (!isDesktopRpcFrame(result)) {
          throw new DesktopBindingProtocolError(
            'Desktop receive returned a non-string/binary frame',
          );
        }
        channel.port2.postMessage(result);
      } catch (error) {
        fail(error);
        return;
      }
    }
  };

  channel.port1.start();
  channel.port2.start();
  receive().catch(fail);

  return {
    port: channel.port1,
    closed: closedState.promise,
    async close(): Promise<void> {
      if (isClosed) {
        return;
      }
      try {
        await invoke(DESKTOP_BIND_OPERATIONS.CLOSE);
        stop({ reason: DESKTOP_PORT_CLOSE_REASONS.CLOSED });
      } catch (error) {
        fail(error);
      }
    },
  };
}

/** Create one isolated runtime MessagePort and its Deno Desktop bind handler. */
export function createDesktopBindServerPort(): DesktopBindServerPort {
  const channel = new MessageChannel();
  const frames: DesktopRpcFrame[] = [];
  let receiveWaiter: PromiseWithResolvers<DesktopBindHandlerResult> | undefined;
  let failure: Error | undefined;
  let isClosed = false;

  const stop = (error?: Error): void => {
    if (isClosed) {
      return;
    }
    isClosed = true;
    failure = error;
    channel.port1.dispatchEvent(new Event('close'));
    channel.port1.close();
    channel.port2.close();
    if (receiveWaiter !== undefined) {
      if (error === undefined) {
        receiveWaiter.resolve(CLOSED_RESULT);
      } else {
        receiveWaiter.reject(error);
      }
      receiveWaiter = undefined;
    }
  };

  channel.port2.addEventListener('message', (event): void => {
    if (isClosed) {
      return;
    }
    if (!isDesktopRpcFrame(event.data)) {
      stop(new DesktopBindingProtocolError('oRPC posted a non-string/binary Desktop frame'));
      return;
    }
    if (receiveWaiter !== undefined) {
      receiveWaiter.resolve(event.data);
      receiveWaiter = undefined;
      return;
    }
    frames.push(event.data);
  });

  channel.port1.start();
  channel.port2.start();

  return {
    port: channel.port1,
    async handler(operation: unknown, payload?: unknown): Promise<DesktopBindHandlerResult> {
      if (failure !== undefined) {
        throw failure;
      }

      if (operation === DESKTOP_BIND_OPERATIONS.SEND) {
        if (isClosed) {
          return CLOSED_RESULT;
        }
        if (!isDesktopRpcFrame(payload)) {
          throw new DesktopBindingProtocolError(
            'Desktop send requires a string or Uint8Array frame',
          );
        }
        channel.port2.postMessage(payload);
        return ACCEPTED_RESULT;
      }

      if (operation === DESKTOP_BIND_OPERATIONS.RECEIVE) {
        const frame = frames.shift();
        if (frame !== undefined) {
          return frame;
        }
        if (isClosed) {
          return CLOSED_RESULT;
        }
        if (receiveWaiter !== undefined) {
          throw new DesktopBindingProtocolError('Desktop receive is already pending');
        }
        receiveWaiter = Promise.withResolvers<DesktopBindHandlerResult>();
        return await receiveWaiter.promise;
      }

      if (operation === DESKTOP_BIND_OPERATIONS.CLOSE) {
        stop();
        return CLOSED_RESULT;
      }

      throw new DesktopBindingProtocolError(`Unknown Desktop bind operation: ${String(operation)}`);
    },
    close(): void {
      stop();
    },
  };
}
