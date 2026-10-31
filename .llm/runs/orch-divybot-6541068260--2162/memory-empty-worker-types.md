# Empty generated workers objects need explicit entries value typing

With zero jobs, GeneratedJobDefinitionRegistry becomes an empty object type; Object.entries
infers unknown for values and generated toRegisterJobInput(definition) fails TS2345 under Deno
2.9.7. Both runtime-registry-generator.ts and registry-compiler.ts must emit
Object.entries<RegisterJobInput>(jobDefinitionsById). Dynamic imports only transpile and miss it;
regression tests must type-check both generated outputs with checkGeneratedFiles.
