import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Text, View } from 'react-native';
import { useStreamLiveQueryV1 } from '@netscript/sdk/streams/react';
import type { StreamCollectionBindingV1 } from '@netscript/sdk/streams/collections';
import { createCockpitStream } from './cockpit.ts';
import type { Execution } from './cockpit.ts';
import { streamFetch } from './expo-fetch.ts';
import { proveHermesPrimitives } from './runtime-proof.ts';

const endpoint = process.env.EXPO_PUBLIC_STREAM_URL;

function ExecutionRows({ binding }: { binding: StreamCollectionBindingV1<Execution> }) {
  const result = useStreamLiveQueryV1(binding.collection);
  return (
    <View>
      <Text>{result.error?.message ?? result.status}</Text>
      {result.data.map((execution) => (
        <Text key={execution.id}>{execution.id}: {execution.status}</Text>
      ))}
    </View>
  );
}

function Executions({ url }: { url: string }) {
  const [binding, setBinding] = useState<StreamCollectionBindingV1<Execution>>();
  const [proof, setProof] = useState('Checking Hermes');
  useEffect(() => {
    let active = true;
    const stream = createCockpitStream(url, streamFetch);
    setBinding(stream);
    const fail = (error: unknown) => {
      if (active) setProof(String(error));
    };
    void proveHermesPrimitives().then((checks) => {
      if (active) setProof(checks.join(', '));
    }, fail);
    void stream.done.catch(fail);
    return () => {
      active = false;
      void stream.dispose().catch(() => {});
    };
  }, [url]);
  return (
    <View>
      <Text testID='runtime-proof'>{proof}</Text>
      {binding && <ExecutionRows binding={binding} />}
    </View>
  );
}

export default function App(): ReactElement {
  return endpoint
    ? <Executions url={endpoint} />
    : <Text>Set EXPO_PUBLIC_STREAM_URL to your authenticated stream endpoint.</Text>;
}
