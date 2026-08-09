import type {
  StreamProducerPort,
  StreamProducerStateSnapshotV1,
  StreamWriteOutcomeV1,
  StreamWriteReceiptV1,
} from '@netscript/plugin-streams-core';
import { MemoryStreamProducer } from '@netscript/plugin-streams-core/testing';

function consumeProducer(producer: StreamProducerPort): void {
  const receipt: StreamWriteReceiptV1 = producer.upsert('execution', { id: 'execution-1' });
  const state: StreamProducerStateSnapshotV1 = producer.state;
  const completion: Promise<StreamWriteOutcomeV1> = receipt.completion;
  const ready: boolean = producer.isReady;
  const closed: boolean = producer.closed;
  const readiness: Promise<void> = producer.waitUntilReady();
  const flush: Promise<void> = producer.flush();
  const stop: Promise<void> = producer.stop();

  void state;
  void completion;
  void ready;
  void closed;
  void readiness;
  void flush;
  void stop;
}

consumeProducer(new MemoryStreamProducer());
