using System.Reflection;
using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Microsoft.Extensions.Logging.Abstractions;

// This is an installed-SDK capability diagnostic. It never starts the application or a database.
try
{
    var assembly = typeof(DistributedApplication).Assembly;
    var version = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;
    Require(version?.StartsWith("13.5.3+", StringComparison.Ordinal) == true, "pinned SDK identity");
    Console.WriteLine("SDK: Aspire.Hosting 13.5.3");

    // Generated in memory, never printed, persisted, or used by any live resource.
    var syntheticPassword = Guid.NewGuid().ToString("N");
    var builder = DistributedApplication.CreateBuilder(new DistributedApplicationOptions
    {
        Args = [],
        DisableDashboard = true,
    });
    var password = builder.AddParameter("probe-password", syntheticPassword, secret: true);
    Require(password.Resource.Secret, "parameter is secret");
    var expression = ReferenceExpression.Create($"Username=probe;Password={password};Database=probe");
    var connection = builder.AddConnectionString("probe-db", expression);
    var consumer = builder.AddExecutable("probe-consumer", "unused", Directory.GetCurrentDirectory())
        .WithEnvironment("DIRECT_SECRET", password)
        .WithEnvironment("DATABASE_URL", expression)
        .WithEnvironment("POSTGRES_URI", expression)
        .WithEnvironment("PROBE_DB_URI", expression)
        .WithReference(connection);

    var configuration = await ExecutionConfigurationBuilder.Create(consumer.Resource)
        .WithEnvironmentVariablesConfig()
        .BuildAsync(builder.ExecutionContext, NullLogger.Instance);
    Require(configuration.Exception is null, "runtime environment resolves without errors");
    var environment = configuration.EnvironmentVariables.ToDictionary(pair => pair.Key, pair => pair.Value);
    Require(environment["DIRECT_SECRET"] == syntheticPassword, "direct runtime binding retains credential");

    // Invoke the installed implementation, rather than copying its exact-equality algorithm.
    var target = assembly.GetType("Aspire.Hosting.Backchannel.AuxiliaryBackchannelRpcTarget", throwOnError: true)!;
    var method = target.GetMethod("RedactIfSecretValue", BindingFlags.NonPublic | BindingFlags.Static,
        null, [typeof(string), typeof(HashSet<string>)], null)
        ?? throw new InvalidOperationException("pinned redactor method missing");
    var secretValues = new HashSet<string>(StringComparer.Ordinal)
    {
        await password.Resource.GetValueAsync(CancellationToken.None)
            ?? throw new InvalidOperationException("resolved parameter missing"),
    };
    string? Redact(string? value) => (string?)method.Invoke(null, [value, secretValues]);
    bool ContainsCredential(string? value) => value?.Contains(syntheticPassword, StringComparison.Ordinal) == true;

    Require(Redact(environment["DIRECT_SECRET"]) is null, "direct secret is masked by pinned redactor");
    Require(Redact(null) is null, "null remains null");
    Require(Redact("clean-value") == "clean-value", "clean value is preserved");
    Require(!ContainsCredential("clean-value"), "clean byte-scan control");
    Require(ContainsCredential("planted-prefix" + syntheticPassword + "planted-suffix"),
        "hostile plaintext byte-scan control");

    // The pinned collector enumerates secret ParameterResource instances, not connection resources.
    Require(connection.Resource.GetType() == typeof(ConnectionStringResource), "expression overload resource type");
    Require(!builder.Resources.OfType<ParameterResource>().Any(resource => resource.Name == connection.Resource.Name),
        "composed resource is outside secret-parameter collection");

    var masked = 0;
    string[] composedBindings = ["DATABASE_URL", "POSTGRES_URI", "PROBE_DB_URI", "ConnectionStrings__probe-db"];
    foreach (var name in composedBindings)
    {
        Require(environment.TryGetValue(name, out var resolved) && ContainsCredential(resolved),
            $"runtime composed binding retains credential: {name}");
        if (ContainsCredential(Redact(resolved)))
        {
            Console.WriteLine($"EXPOSED: {name}");
        }
        else
        {
            masked++;
            Console.WriteLine($"MASKED: {name}");
        }
    }

    Console.WriteLine("VALID: all diagnostic controls passed; exit zero is not a masking acceptance pass.");
    Console.WriteLine(masked == 0 ? "CAPABILITY: BLOCKED" : "CAPABILITY: CAPABLE");
    return 0;
}
catch
{
    // Never print exception details: resolved credentials or machine paths may be embedded in them.
    Console.WriteLine("CAPABILITY: INVALID — diagnostic setup or control failed; no capability claim.");
    return 1;
}

static void Require(bool condition, string assertion)
{
    if (!condition) throw new InvalidOperationException(assertion);
    Console.WriteLine($"PASS: {assertion}");
}
