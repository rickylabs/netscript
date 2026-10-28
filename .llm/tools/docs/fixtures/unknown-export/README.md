# Unknown JSR export regression

An otherwise tolerated type error must not conceal an unreadable module-graph failure.

```ts
const knownTypeError: string = 1;
```

```ts
import 'jsr:@std/assert@1/not-an-export';
```
