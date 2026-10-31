# Abort regression sensitivity

A generous deadline alone weakens coverage when it exceeds the debounce interval: a non-abortable delay can naturally expire, observe the aborted signal, and return no batch. Set the abort scenario's debounce much longer than the hang guard and verify a mutation removing the Redis queue delay's signal fails both the stream contract and queue unit scenario. Keep ordinary debounce-delivery scenarios unchanged.
