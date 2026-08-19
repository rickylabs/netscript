// H4 — Bootsharp attempt: same MINSTD kernel exposed to JS via Bootsharp [Export].
// Numbers cross the boundary as double (JS number); intermediates stay < 2^53 so the
// f64 round-trip is exact (plan L1 continuity).
using Bootsharp;

public static partial class Lcg
{
    public static void Main() { }

    [Export]
    public static double Run(double n, double seed)
    {
        var state = (ulong)seed;
        ulong acc = 0;
        var un = (ulong)n;
        for (ulong i = 0; i < un; i++)
        {
            state = state * 48271UL % 2147483647UL;
            acc = (acc + state) % 1000000007UL;
        }
        return acc;
    }
}
