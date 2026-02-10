import { describe, it, expect } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDriftState, writeDriftState } from '../../../src/io/drift-state-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, '../../fixtures/sample-project/.yggdrasil');

describe('drift-state-store', () => {
  it('reads existing drift state', async () => {
    const state = await readDriftState(FIXTURE_DIR);

    expect(state.entries).toBeDefined();
    expect(state.entries['auth/login-service']).toBeDefined();
    expect(state.entries['auth/login-service']?.path).toBe('src/auth/login.service.ts');
    expect(state.entries['auth/login-service']?.hash).toMatch(/^sha256:/);
    expect(state.entries['orders/order-service']).toBeDefined();
    expect(state.entries['users/user-repo']).toBeDefined();
    expect(state.entries['users/missing-service']).toBeDefined();
  });

  it('returns empty entries when file does not exist', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-drift');
    await mkdir(tmpDir, { recursive: true });
    // No .drift-state file

    const state = await readDriftState(tmpDir);

    expect(state.entries).toEqual({});

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('writeDriftState creates/updates file correctly', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-drift-write');
    await mkdir(tmpDir, { recursive: true });

    const state = {
      entries: {
        'test/node': {
          path: 'src/test.ts',
          hash: 'sha256:abc123',
          materialized_at: '2026-02-10T12:00:00Z',
        },
      },
    };

    await writeDriftState(tmpDir, state);

    const content = await readFile(path.join(tmpDir, '.drift-state'), 'utf-8');
    expect(content).toContain('# .yggdrasil/.drift-state (auto-generated');
    expect(content).toContain('test/node');
    expect(content).toContain('src/test.ts');
    expect(content).toContain('sha256:abc123');

    const readBack = await readDriftState(tmpDir);
    expect(readBack.entries['test/node']).toEqual(state.entries['test/node']);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('handles drift state with empty entries', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-drift-empty');
    await mkdir(tmpDir, { recursive: true });
    await writeFile(path.join(tmpDir, '.drift-state'), '# generated\nentries: {}\n', 'utf-8');

    const state = await readDriftState(tmpDir);
    expect(state.entries).toEqual({});

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('handles drift-state file with no entries key', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-drift-no-entries');
    await mkdir(tmpDir, { recursive: true });
    await writeFile(
      path.join(tmpDir, '.drift-state'),
      '# just a comment, no entries key\nsome_other_field: true\n',
      'utf-8',
    );

    const state = await readDriftState(tmpDir);
    expect(state.entries).toEqual({});

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('handles completely empty drift-state file', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-drift-empty-file');
    await mkdir(tmpDir, { recursive: true });
    await writeFile(path.join(tmpDir, '.drift-state'), '', 'utf-8');

    const state = await readDriftState(tmpDir);
    expect(state.entries).toEqual({});

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('reads multi-file hash format (hash as object)', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-drift-multi');
    await mkdir(tmpDir, { recursive: true });
    await writeFile(
      path.join(tmpDir, '.drift-state'),
      `entries:
  multi/multi-svc:
    path:
      - src/a.ts
      - src/b.ts
    hash:
      src/a.ts: sha256:aaa111
      src/b.ts: sha256:bbb222
    materialized_at: "2026-02-10T12:00:00Z"
`,
      'utf-8',
    );

    const state = await readDriftState(tmpDir);
    const entry = state.entries['multi/multi-svc'];
    expect(entry).toBeDefined();
    expect(typeof entry.hash).toBe('object');
    expect(entry.hash).toEqual({
      'src/a.ts': 'sha256:aaa111',
      'src/b.ts': 'sha256:bbb222',
    });
    expect(entry.path).toEqual(['src/a.ts', 'src/b.ts']);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('write and read roundtrip with multi-file hash', async () => {
    const tmpDir = path.join(__dirname, '../../fixtures/tmp-drift-roundtrip');
    await mkdir(tmpDir, { recursive: true });

    const state = {
      entries: {
        'multi/svc': {
          path: ['src/a.ts', 'src/b.ts'] as string | string[],
          hash: {
            'src/a.ts': 'sha256:aaa',
            'src/b.ts': 'sha256:bbb',
          } as string | Record<string, string>,
          materialized_at: '2026-02-10T12:00:00Z',
        },
      },
    };

    await writeDriftState(tmpDir, state);
    const readBack = await readDriftState(tmpDir);
    expect(readBack.entries['multi/svc'].hash).toEqual(state.entries['multi/svc'].hash);

    await rm(tmpDir, { recursive: true, force: true });
  });
});
