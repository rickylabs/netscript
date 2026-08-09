import type { StreamProducerRandomPort } from '../ports/stream-producer-random-port.ts';

/** System randomness adapter used only for reconnect jitter. */
export class SystemStreamProducerRandom implements StreamProducerRandomPort {
  /** Return the next system random value. */
  next(): number {
    return Math.random();
  }
}
