import { z } from 'zod';

type SchemaLike<TInput, TOutput> = {
  _input: TInput;
  _output: TOutput;
  catch(defaultValue: TOutput): CatchLike<TInput, TOutput>;
};

type CatchLike<TInput, TOutput> = SchemaLike<TInput, TOutput> & { defaultValue: TOutput };

function fallback<TInput, TOutput>(schema: SchemaLike<TInput, TOutput>, defaultValue: TOutput): CatchLike<TInput, TOutput> {
  return schema.catch(defaultValue);
}

const s = z.string();
const c = fallback(s, 'a');
const _x: string = c._output;
