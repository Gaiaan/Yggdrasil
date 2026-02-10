import { describe, it, expect, vi } from 'vitest';
import { estimateTokens } from '../../../src/utils/tokens.js';

describe('tokens', () => {
  it('returns a number greater than 0 for non-empty string', async () => {
    const count = await estimateTokens('Hello world');
    expect(count).toBeGreaterThan(0);
    expect(typeof count).toBe('number');
  });

  it('returns 0 for empty string', async () => {
    const count = await estimateTokens('');
    expect(count).toBe(0);
  });

  it('estimates longer text with more tokens', async () => {
    const short = await estimateTokens('Hi');
    const long = await estimateTokens(
      'This is a much longer piece of text that should have more tokens.',
    );
    expect(long).toBeGreaterThan(short);
  });

  it('handles unicode correctly', async () => {
    const count = await estimateTokens('日本語テスト');
    expect(count).toBeGreaterThan(0);
  });

  it('falls back to character-based estimation when tiktoken fails', async () => {
    // Mock js-tiktoken to throw, triggering the fallback path
    vi.doMock('js-tiktoken', () => {
      throw new Error('Module not found');
    });

    // Re-import to get fresh module with mock in effect
    const { estimateTokens: fallbackEstimate } = await import('../../../src/utils/tokens.js');

    // With the mock throwing, the fallback should use Math.ceil(text.length / 4)
    const text = 'abcdefghijklmnop'; // 16 chars → Math.ceil(16/4) = 4
    const count = await fallbackEstimate(text);
    // The fallback returns Math.ceil(text.length / 4)
    expect(count).toBe(4);

    vi.doUnmock('js-tiktoken');
  });
});
