using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

// Model inspection only: never Build, Run, allocate endpoints, or start resources.
var builder = DistributedApplication.CreateBuilder(args);
var postgres = builder.AddPostgres("image-inspection");
if (!postgres.Resource.TryGetContainerImageName(out var image))
{
    throw new InvalidOperationException("Pinned PostgreSQL integration omitted its container image");
}
Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(new { image }));
