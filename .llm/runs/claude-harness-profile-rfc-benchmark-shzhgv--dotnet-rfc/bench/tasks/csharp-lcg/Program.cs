// C# task variants for the dotnet RFC (run 3) — same MINSTD workload and polyglot contract
// as runs 1-2 (argv: n seed; env CORRELATION_ID; result = last JSON line of stdout; VmHWM
// self-report from /proc). ulong arithmetic: intermediates < 2^53, exact vs the JS variants.

using System.Text;

const ulong Mult = 48271;
const ulong Modu = 2147483647;
const ulong AccModu = 1000000007;

static ulong RunLcg(ulong n, ulong seed)
{
    var state = seed;
    ulong acc = 0;
    for (ulong i = 0; i < n; i++)
    {
        state = state * Mult % Modu;
        acc = (acc + state) % AccModu;
    }
    return acc;
}

static long? ReadVmHwmKb()
{
    try
    {
        foreach (var line in File.ReadLines("/proc/self/status"))
        {
            if (!line.StartsWith("VmHWM:", StringComparison.Ordinal)) continue;
            var digits = new StringBuilder();
            foreach (var c in line) if (char.IsAsciiDigit(c)) digits.Append(c);
            return long.Parse(digits.ToString());
        }
        return null;
    }
    catch
    {
        return null;
    }
}

var n = args.Length > 0 && ulong.TryParse(args[0], out var pn) ? pn : 100_000UL;
var seed = args.Length > 1 && ulong.TryParse(args[1], out var ps) ? ps : 42UL;
var acc = RunLcg(n, seed);
var correlationId = Environment.GetEnvironmentVariable("CORRELATION_ID");
var cid = correlationId is null
    ? "null"
    : $"\"{correlationId.Replace("\\", "\\\\").Replace("\"", "\\\"")}\"";
var hwm = ReadVmHwmKb()?.ToString() ?? "null";
Console.WriteLine($"{{\"acc\":{acc},\"n\":{n},\"seed\":{seed},\"correlationId\":{cid},\"vmHwmKb\":{hwm}}}");
