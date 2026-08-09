import { createProducerFixture } from './_producer-fixture.ts';

const receipt = createProducerFixture().upsert('execution', { id: 'count-overflow' });
receipt.accepted;
