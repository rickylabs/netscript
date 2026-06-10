import type { TriggerEvent, TriggerId } from '../domain/mod.ts';

/** Ingress request passed to trigger ingress adapters. */
export type TriggerIngressRequest = Readonly<{
  triggerId: TriggerId;
  request: Request;
}>;

/** Fast ack response returned by ingress adapters. */
export type TriggerIngressResponse = Readonly<{
  status: 202;
  event?: TriggerEvent;
  acceptedAt: string;
}>;

/** Fast ack-then-process ingress boundary. */
export interface TriggerIngressPort {
  /** Accept an inbound trigger request for asynchronous processing. */
  accept(request: TriggerIngressRequest): Promise<TriggerIngressResponse>;
}
