# Preserve native typed primary bounds

Deno 2.9.7 native key ordering places bigint before number: 9n,10n,9,10. Do not re-filter an
already-native numeric start with compareKeys, which coerces parts to strings and would drop
10 after9. Only exclude exact key equality for a native start, and trust a native end's
exclusivity. Byte-array prefix/key equality must be structural, not array reference equality.
The shared fixture contract uses non-numeric ASCII keys because Redis's persisted codec and
memory's typed order have separate pre-existing limitations; native-specific tests guard against
introducing a new regression while translating the listing contract.
