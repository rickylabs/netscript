export { inspectPlugin } from './inspect-plugin.ts';
export type {
  InspectablePluginManifest,
  InspectablePluginRegistry,
  InspectionReport,
} from './inspect-plugin.ts';
export { inspectWalkerOutput } from './inspect-walker-output.ts';
export { runPluginVerificationCli, verifyPlugin } from './verify-plugin.ts';
export type {
  ExpectedAspire,
  ExpectedContractVersion,
  ExpectedDbSchema,
  ExpectedDependency,
  ExpectedE2eGate,
  ExpectedHelper,
  ExpectedNamed,
  ExpectedRuntimeConfigTopic,
  ExpectedService,
  PluginExpectations,
  PluginVerificationResult,
  VerifiableContractContribution,
  VerifiableContributions,
  VerifiableDbSchemaContribution,
  VerifiableE2eContribution,
  VerifiableNamedContribution,
  VerifiablePluginManifest,
  VerifiableRuntimeConfigContribution,
} from './verify-plugin.ts';
