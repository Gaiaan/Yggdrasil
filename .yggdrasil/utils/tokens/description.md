# TokenEstimator

Estimates token count for context package size tracking.

## Interface

- `estimateTokens(text: string): Promise<number>`

## Behavior

- Primary: uses `js-tiktoken` with `cl100k_base` encoding (GPT-4 tokenizer)
- Fallback: if tiktoken fails to load, uses character-based estimation (1 token ≈ 4 characters)
- Async function due to dynamic import of tiktoken
