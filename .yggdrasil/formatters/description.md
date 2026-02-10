# Output Formatters

Transform `ContextPackage` into output strings. Two formats: markdown (human/agent readable) and JSON (programmatic).

Formatters are pure functions: `ContextPackage → string`. No side effects, no I/O.
