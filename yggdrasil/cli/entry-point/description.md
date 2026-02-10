# CLI Entry Point

Main entry point (`#!/usr/bin/env node`). Registers all Commander.js commands and calls `program.parse()`.

## Commands Registered

- `init` — initialize graph
- `build-context <node-path>` — build context package
- `resolve-deps` — compute dependency order
- `check` — validate graph
- `drift` — detect code/graph divergence
- `status` — show graph summary
- `affected <node-path>` — reverse dependencies
- `tree` — display graph tree

## Details

- Program name: `ygg`, version: `0.1.0`
- Description: "Yggdrasil — Graph-Driven Software Development CLI"
- Each command is defined in its own file in cli/ and imported here
