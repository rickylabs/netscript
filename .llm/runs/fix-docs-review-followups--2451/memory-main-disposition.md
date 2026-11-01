# Main already incorporates #2451

At main 6a1d84a, every maintained-source fix from the original PR #2452 is already present through later docs integration. Seven normal-merge conflicts should preserve main's expanded implementation. After resolution, `git diff --name-only origin/main` lists only this run directory. Do not reintroduce the older plaintext dotenv registration, narrower navigation test, duplicate reader browser test or pre-content-pass renderers.

The token source still has the explicit #2450 ownership disposition. Pagefind is still 1.3.0; the prior 1.5.2 experiment did not fix full output reproducibility. Strict and bounded modes must remain distinct.
