import type { ServiceApp } from '@netscript/service';

/** Network address assigned to the running auth service listener. */
export type AuthRunningServiceAddress = Readonly<{
  /** Listener hostname. */
  hostname: string;
  /** Listener port. */
  port: number;
  /** Listener transport. */
  transport: 'tcp' | 'unix';
}>;

/** Mountable fetch surface backing the running auth service. */
export type AuthServiceApp = Readonly<ServiceApp>;

/** Runtime handle returned after the auth service starts. */
export type AuthRunningService = Readonly<{
  /** Mountable service app backing the running listener. */
  app: AuthServiceApp;
  /** Address selected by Deno for the listener. */
  addr: AuthRunningServiceAddress;
  /** Stops the auth service listener and waits for shutdown to finish. */
  stop(): Promise<void>;
}>;
