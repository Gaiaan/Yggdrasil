# Phase 01 — CLI Project Setup

## Goal

Initialize the `@gaiaan/yggdrasil-cli` npm package in `source/cli/` with TypeScript, build tooling, test framework, and linter configuration.

## Prerequisites

- Phase 00 complete (repo infrastructure exists)

---

## Step 1: Create `source/cli/package.json`

```json
{
  "name": "@gaiaan/yggdrasil-cli",
  "version": "0.1.0",
  "description": "Yggdrasil — Graph-Driven Software Development CLI",
  "type": "module",
  "bin": {
    "ygg": "./dist/bin.js"
  },
  "files": [
    "dist/",
    "templates/"
  ],
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "yggdrasil",
    "graph",
    "ai",
    "code-generation",
    "architecture",
    "cli"
  ],
  "author": "Gaiaan",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/gaiaan/yggdrasil.git",
    "directory": "source/cli"
  },
  "dependencies": {
    "commander": "^13.0.0",
    "yaml": "^2.7.0",
    "chalk": "^5.4.0",
    "js-tiktoken": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsup": "^8.4.0",
    "vitest": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "prettier": "^3.4.0",
    "@types/node": "^22.0.0"
  }
}
```

**IMPORTANT:** Do NOT hardcode exact patch versions. Use `^` ranges as shown. Run `npm install` to resolve actual latest versions into package-lock.json.

---

## Step 2: Create `source/cli/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## Step 3: Create `source/cli/tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bin.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  // Copy templates to dist
  onSuccess: 'cp -r src/templates dist/templates 2>/dev/null || true',
});
```

---

## Step 4: Create `source/cli/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/bin.ts', 'src/templates/**'],
    },
  },
});
```

---

## Step 5: Create `source/cli/eslint.config.js`

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.*'],
  }
);
```

---

## Step 6: Create `source/cli/.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## Step 7: Create entry point `source/cli/src/bin.ts`

```typescript
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('ygg')
  .description('Yggdrasil — Graph-Driven Software Development CLI')
  .version('0.1.0');

// Commands will be registered here in later phases:
// registerInitCommand(program);
// registerBuildContextCommand(program);
// registerResolveDepsCommand(program);
// registerCheckCommand(program);
// registerDriftCommand(program);
// registerStatusCommand(program);
// registerAffectedCommand(program);
// registerTreeCommand(program);

program.parse();
```

---

## Step 8: Create placeholder directories

Create the following empty directories (with `.gitkeep` if needed):

```
source/cli/src/cli/
source/cli/src/core/
source/cli/src/io/
source/cli/src/model/
source/cli/src/formatters/
source/cli/src/templates/commands/
source/cli/src/templates/adapters/
source/cli/src/utils/
source/cli/tests/unit/
source/cli/tests/integration/
source/cli/tests/e2e/
source/cli/tests/fixtures/
```

---

## Step 9: Create `source/cli/README.md`

```markdown
# @gaiaan/yggdrasil-cli

CLI toolset for graph-driven software development. Provides mechanical operations on an architectural graph: building context packages, resolving dependencies, validating consistency, detecting drift.

## Installation

```bash
npm install -g @gaiaan/yggdrasil-cli
```

## Usage

```bash
ygg init --agent cursor          # Initialize graph + install agent commands
ygg build-context auth/login     # Build context package for a node
ygg resolve-deps --changed       # Get materialization order for changed nodes
ygg check                        # Validate graph consistency
ygg drift                        # Detect code/graph divergence
ygg status                       # Show graph summary
ygg affected auth/auth-api       # Show dependents of a node
ygg tree                         # Display graph as tree
```

## Development

```bash
npm install          # Install dependencies
npm run build        # Build to dist/
npm test             # Run tests
npm run dev          # Watch mode build
npm run lint         # Run linter
npm run typecheck    # Type check without emit
```

## Architecture

See `documentation/v2/` in the repository root for the full specification.
```

---

## Step 10: Install dependencies and verify

Run these commands in `source/cli/`:

```bash
npm install
npm run build
npm run typecheck
```

Expected results:
- `npm install` creates `node_modules/` and `package-lock.json`
- `npm run build` produces `dist/bin.js` (may have warnings about empty imports — ok at this stage)
- `npm run typecheck` passes with no errors

Test the binary:

```bash
node dist/bin.js --version
# Output: 0.1.0

node dist/bin.js --help
# Output: Usage: ygg [options] [command] ...
```

---

## Verification

```bash
cd source/cli
npm run build && node dist/bin.js --version
npm run typecheck
npm run lint
```

All three commands must succeed.

## Acceptance Criteria

- [ ] `package.json` exists with correct name, bin, scripts, dependencies
- [ ] `tsconfig.json` exists with strict mode, ESM, Node22 target
- [ ] `tsup.config.ts` exists and builds to `dist/`
- [ ] `vitest.config.ts` exists
- [ ] `eslint.config.js` exists
- [ ] `src/bin.ts` exists and is executable (`node dist/bin.js --help` works)
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` succeeds
- [ ] `npm run lint` succeeds (no errors)
- [ ] Directory structure matches `_context.md` layout
