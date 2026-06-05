/**
 * @module templates/aspire/template-rendering_test
 *
 * Template rendering tests for Aspire `.template` files.
 * Verifies that each template renders with sample variables and produces
 * structurally valid output.
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
import { MemoryFileSystemAdapter } from '../../adapters/scaffold/memory-fs.ts';
import { StringTemplateAdapter } from '../../adapters/scaffold/template-adapter.ts';

const apphostCsprojTemplate =
  '<Project Sdk="Aspire.AppHost.Sdk/{{aspireVersion}}">\r\n\r\n  <PropertyGroup>\r\n    <OutputType>Exe</OutputType>\r\n    <TargetFramework>net10.0</TargetFramework>\r\n    <Nullable>enable</Nullable>\r\n    <ImplicitUsings>enable</ImplicitUsings>\r\n    <UserSecretsId>{{userSecretsId}}</UserSecretsId>\r\n  </PropertyGroup>\r\n\r\n  <ItemGroup>\r\n    <PackageReference Include="CommunityToolkit.Aspire.Hosting.Deno" Version="{{denoHostingVersion}}" />\r\n  </ItemGroup>\r\n\r\n  <ItemGroup>\r\n    <ProjectReference Include="../ServiceDefaults/ServiceDefaults.csproj" IsAspireProjectResource="false" />\r\n  </ItemGroup>\r\n\r\n</Project>\r\n';
const programCsTemplate =
  'var builder = DistributedApplication.CreateBuilder(args);\r\n\r\nbuilder.AddDenoApp("{{appName}}", "main.ts", permissionFlags: ["--allow-all"])\r\n    .WithWorkingDirectory(Path.Combine(builder.AppHostDirectory, "..", "..", "apps", "{{appName}}"))\r\n    .WithHttpEndpoint(port: {{appPort}}, env: "PORT")\r\n    .WithExternalHttpEndpoints();\r\n\r\nbuilder.Build().Run();\r\n';
const serviceDefaultsCsprojTemplate =
  '<Project Sdk="Microsoft.NET.Sdk">\r\n  <PropertyGroup>\r\n    <TargetFramework>net10.0</TargetFramework>\r\n    <Nullable>enable</Nullable>\r\n    <ImplicitUsings>enable</ImplicitUsings>\r\n  </PropertyGroup>\r\n\r\n  <ItemGroup>\r\n    <PackageReference Include="Aspire.Hosting" Version="{{aspireVersion}}" />\r\n    <PackageReference Include="Aspire.Hosting.AppHost" Version="{{aspireVersion}}" />\r\n    <PackageReference Include="Aspire.Hosting.JavaScript" Version="{{aspireVersion}}" />\r\n    <PackageReference Include="Microsoft.Extensions.Http.Resilience" Version="{{extensionsVersion}}" />\r\n    <PackageReference Include="Microsoft.Extensions.ServiceDiscovery" Version="{{extensionsVersion}}" />\r\n    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="{{extensionsVersion}}" />\r\n    <PackageReference Include="Scalar.Aspire" Version="{{scalarVersion}}" />\r\n    <PackageReference Include="Swashbuckle.AspNetCore" Version="{{swashbuckleVersion}}" />\r\n    <PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="{{otelVersion}}" />\r\n    <PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="{{otelVersion}}" />\r\n    <PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="{{otelVersion}}" />\r\n    <PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="{{otelVersion}}" />\r\n    <PackageReference Include="OpenTelemetry.Instrumentation.Runtime" Version="{{otelVersion}}" />\r\n  </ItemGroup>\r\n</Project>\r\n';
const extensionsCsTemplate =
  'using Microsoft.AspNetCore.Builder;\r\nusing Microsoft.Extensions.DependencyInjection;\r\nusing Microsoft.Extensions.Hosting;\r\nusing Microsoft.Extensions.Logging;\r\nusing OpenTelemetry;\r\nusing OpenTelemetry.Metrics;\r\nusing OpenTelemetry.Trace;\r\n\r\nnamespace {{namespace}}.ServiceDefaults;\r\n\r\npublic static class Extensions\r\n{\r\n    public static IHostApplicationBuilder AddServiceDefaults(this IHostApplicationBuilder builder)\r\n    {\r\n        builder.ConfigureOpenTelemetry();\r\n        builder.AddDefaultHealthChecks();\r\n        builder.AddOpenApi();\r\n        builder.Services.AddServiceDiscovery();\r\n        builder.Services.ConfigureHttpClientDefaults(http =>\r\n        {\r\n            http.AddStandardResilienceHandler();\r\n            http.AddServiceDiscovery();\r\n        });\r\n\r\n        return builder;\r\n    }\r\n\r\n    public static IHostApplicationBuilder ConfigureOpenTelemetry(this IHostApplicationBuilder builder)\r\n    {\r\n        builder.Logging.AddOpenTelemetry(logging =>\r\n        {\r\n            logging.IncludeFormattedMessage = true;\r\n            logging.IncludeScopes = true;\r\n        });\r\n\r\n        builder.Services.AddOpenTelemetry()\r\n            .WithMetrics(metrics =>\r\n            {\r\n                metrics\r\n                    .AddAspNetCoreInstrumentation()\r\n                    .AddHttpClientInstrumentation()\r\n                    .AddRuntimeInstrumentation();\r\n            })\r\n            .WithTracing(tracing =>\r\n            {\r\n                tracing\r\n                    .AddAspNetCoreInstrumentation()\r\n                    .AddHttpClientInstrumentation();\r\n            });\r\n\r\n        builder.AddOpenTelemetryExporters();\r\n\r\n        return builder;\r\n    }\r\n\r\n    private static IHostApplicationBuilder AddOpenTelemetryExporters(this IHostApplicationBuilder builder)\r\n    {\r\n        var useOtlpExporter = !string.IsNullOrWhiteSpace(\r\n            builder.Configuration[NetScriptTelemetryDefaults.OtlpEndpointEnvironmentVariable]);\r\n\r\n        if (useOtlpExporter)\r\n        {\r\n            builder.Services.AddOpenTelemetry().UseOtlpExporter();\r\n        }\r\n\r\n        return builder;\r\n    }\r\n\r\n    public static IHostApplicationBuilder AddDefaultHealthChecks(this IHostApplicationBuilder builder)\r\n    {\r\n        builder.Services.AddHealthChecks()\r\n            .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());\r\n\r\n        return builder;\r\n    }\r\n\r\n    public static IHostApplicationBuilder AddOpenApi(\r\n        this IHostApplicationBuilder builder,\r\n        string? title = null,\r\n        string? description = null)\r\n    {\r\n        var applicationName = builder.GetApplicationName();\r\n        builder.Services.AddEndpointsApiExplorer();\r\n        builder.Services.AddSwaggerGen(c =>\r\n        {\r\n            c.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo\r\n            {\r\n                Title = title ?? $"{applicationName} API",\r\n                Version = "v1",\r\n                Description = description ?? $"{applicationName} service API"\r\n            });\r\n        });\r\n\r\n        return builder;\r\n    }\r\n\r\n    public static WebApplication MapDefaultEndpoints(this WebApplication app)\r\n    {\r\n        // Health checks\r\n        app.MapHealthChecks("/health");\r\n        app.MapHealthChecks("/alive");\r\n\r\n        // OpenAPI/Swagger in development\r\n        if (app.Environment.IsDevelopment())\r\n        {\r\n            var applicationName = app.GetApplicationName();\r\n            app.UseSwagger();\r\n            app.UseSwaggerUI(c =>\r\n            {\r\n                c.SwaggerEndpoint("/swagger/v1/swagger.json", $"{applicationName} API v1");\r\n                c.RoutePrefix = "swagger";\r\n            });\r\n        }\r\n\r\n        return app;\r\n    }\r\n\r\n    private static string GetApplicationName(this IHostApplicationBuilder builder)\r\n    {\r\n        return string.IsNullOrWhiteSpace(builder.Environment.ApplicationName)\r\n            ? "NetScript"\r\n            : builder.Environment.ApplicationName;\r\n    }\r\n\r\n    private static string GetApplicationName(this WebApplication app)\r\n    {\r\n        return string.IsNullOrWhiteSpace(app.Environment.ApplicationName)\r\n            ? "NetScript"\r\n            : app.Environment.ApplicationName;\r\n    }\r\n}\r\n';
const telemetryDefaultsCsTemplate =
  'namespace {{namespace}}.ServiceDefaults;\r\n\r\npublic static class NetScriptTelemetryDefaults\r\n{\r\n    public const string AllowUnsecuredTransportEnvironmentVariable = "ASPIRE_ALLOW_UNSECURED_TRANSPORT";\r\n\r\n    public const string DashboardOtlpHttpEndpointEnvironmentVariable = "ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL";\r\n\r\n    public const string DefaultOtlpEndpoint = "http://localhost:4318";\r\n\r\n    public const string OtlpEndpointEnvironmentVariable = "OTEL_EXPORTER_OTLP_ENDPOINT";\r\n}\r\n';
const launchSettingsTemplate =
  '{\r\n  "$schema": "https://json.schemastore.org/launchsettings.json",\r\n  "profiles": {\r\n    "https": {\r\n      "commandName": "Project",\r\n      "dotnetRunMessages": true,\r\n      "launchBrowser": true,\r\n      "applicationUrl": "https://localhost:17000;http://localhost:15000",\r\n      "environmentVariables": {\r\n        "ASPNETCORE_ENVIRONMENT": "Development",\r\n        "DOTNET_ENVIRONMENT": "Development",\r\n        "ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL": "http://localhost:4318",\r\n        "ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL": "https://localhost:22222",\r\n        "ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS": "true"\r\n      }\r\n    },\r\n    "http": {\r\n      "commandName": "Project",\r\n      "dotnetRunMessages": true,\r\n      "launchBrowser": true,\r\n      "applicationUrl": "http://localhost:15000",\r\n      "environmentVariables": {\r\n        "ASPNETCORE_ENVIRONMENT": "Development",\r\n        "DOTNET_ENVIRONMENT": "Development",\r\n        "ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL": "http://localhost:4318",\r\n        "ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL": "http://localhost:20000",\r\n        "ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS": "true"\r\n      }\r\n    },\r\n    "no-dashboard": {\r\n      "commandName": "Project",\r\n      "dotnetRunMessages": true,\r\n      "launchBrowser": false,\r\n      "applicationUrl": "http://localhost:15000",\r\n      "environmentVariables": {\r\n        "ASPNETCORE_ENVIRONMENT": "Development",\r\n        "DOTNET_ENVIRONMENT": "Development",\r\n        "ASPIRE_ALLOW_UNSECURED_TRANSPORT": "true",\r\n        "DOTNET_ASPIRE_SHOW_DASHBOARD": "false",\r\n        "ASPNETCORE_URLS": "http://localhost:15000"\r\n      }\r\n    }\r\n  }\r\n}\r\n';

const SAMPLE_VARS: Record<string, string> = {
  name: 'test-project',
  namespace: 'NetScript.TestProject',
  appName: 'dashboard',
  appPort: '8000',
  aspireVersion: '13.2.2',
  extensionsVersion: '10.0.0',
  otelVersion: '1.14.0',
  scalarVersion: '0.7.3',
  swashbuckleVersion: '10.0.1',
  userSecretsId: 'aspire-test-abc123',
  nugetReference: '<PackageReference Include="NetScript.Aspire.Hosting" Version="1.0.0" />',
  denoHostingVersion: '13.1.0',
};

function makeAdapter(): StringTemplateAdapter {
  return new StringTemplateAdapter(new MemoryFileSystemAdapter());
}

describe('Aspire template rendering', () => {
  it('AppHost.csproj renders with valid XML structure', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(apphostCsprojTemplate, SAMPLE_VARS);
    assertStringIncludes(output, '<Project');
    assertStringIncludes(output, '</Project>');
    assertStringIncludes(output, '13.2.2');
    assertStringIncludes(output, 'aspire-test-abc123');
    assertStringIncludes(output, 'CommunityToolkit.Aspire.Hosting.Deno');
  });

  it('Program.cs renders with app name and port', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(programCsTemplate, SAMPLE_VARS);
    assertStringIncludes(output, 'AddDenoApp');
    assertStringIncludes(output, 'dashboard');
    assertStringIncludes(output, '8000');
    assertStringIncludes(output, '.Build()');
    assertStringIncludes(output, '.Run()');
  });

  it('ServiceDefaults.csproj renders with version variables', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(serviceDefaultsCsprojTemplate, SAMPLE_VARS);
    assertStringIncludes(output, '<Project');
    assertStringIncludes(output, '13.2.2');
    assertStringIncludes(output, '1.14.0'); // OTEL version
    assertStringIncludes(output, 'OpenTelemetry');
  });

  it('Extensions.cs renders with namespace substitution', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(extensionsCsTemplate, SAMPLE_VARS);
    assertStringIncludes(output, 'namespace NetScript.TestProject.ServiceDefaults');
    assertStringIncludes(output, 'AddServiceDefaults');
    assertStringIncludes(output, 'ConfigureOpenTelemetry');
    assertStringIncludes(output, 'AddDefaultHealthChecks');
  });

  it('NetScriptTelemetryDefaults.cs renders with namespace', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(telemetryDefaultsCsTemplate, SAMPLE_VARS);
    assertStringIncludes(output, 'namespace NetScript.TestProject.ServiceDefaults');
    assertStringIncludes(output, 'OtlpEndpointEnvironmentVariable');
  });

  it('launchSettings.json renders as valid JSON', async () => {
    const adapter = makeAdapter();
    const output = await adapter.render(launchSettingsTemplate, SAMPLE_VARS);
    // Should be parseable JSON
    const config = JSON.parse(output);
    assert(config.profiles, 'should have profiles');
    assert(config.profiles.https, 'should have https profile');
    assert(config.profiles.http, 'should have http profile');
    assert(config.profiles['no-dashboard'], 'should have no-dashboard profile');
  });
});
