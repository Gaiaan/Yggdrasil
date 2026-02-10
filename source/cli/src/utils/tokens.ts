/**
 * Estimate token count for a string.
 * Uses js-tiktoken for accuracy (cl100k_base encoding, used by GPT-4/Claude).
 * Falls back to word-based estimation if tiktoken fails.
 */
export async function estimateTokens(text: string): Promise<number> {
  try {
    const { encodingForModel } = await import('js-tiktoken');
    const enc = encodingForModel('gpt-4');
    const tokens = enc.encode(text);
    return tokens.length;
  } catch {
    // Fallback: rough estimate (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }
}
