# Plan

1. Fail generic OpenHands closed unless its route is MiniMax M3, DeepSeek V4 Flash 0731, or Qwen
   3.8 Max.
2. Keep MiniMax for PLAN-EVAL, select DeepSeek for small/simple IMPL-EVAL, and select Qwen for
   broader/complex IMPL-EVAL.
3. Prove the policy with focused tests and all three dry-run dispatch contracts.
4. Open a draft PR, run one bounded DeepSeek live smoke from the branch, then update the repository
   default only after the branch workflow proves healthy.

