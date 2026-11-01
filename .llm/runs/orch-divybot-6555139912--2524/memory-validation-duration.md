# Validation timing and coverage

The Fresh UI full package task emits one compact wrapper report only at completion.
On this host the 338-result run took 376335 ms; #2503's earlier 333-result run took
398371 ms. Several minutes of CPU work with no incremental stdout is normal.
The generated-scaffold browser matrix takes about three minutes (60 cases, zero skips).
Package check/lint/fmt cover276TSfiles; CSSfmt52. Root formatting excludes CLI entirely;
use this run's source-quality.json (root rules/style without exclusions) for the three
owned test files so the wrapper's coverage refusal cannot hide unchecked CLI tests.
