import { describe, expect, it } from 'vitest';
import { HttpError } from '../../services/HttpError';
import { classifySearchError, getSearchErrorMessage } from '../classifySearchError';

describe('classifySearchError', () => {
  it('recognizes a user-initiated AbortError separately', () => {
    const error = new DOMException('The operation was aborted.', 'AbortError');

    expect(classifySearchError(error)).toBe('aborted');
    expect(getSearchErrorMessage(error)).toBe('');
  });

  it('recognizes TimeoutError as a real, retryable error', () => {
    const error = new DOMException('The operation timed out.', 'TimeoutError');

    expect(classifySearchError(error)).toBe('timeout');
    expect(getSearchErrorMessage(error)).toContain('took too long');
  });

  it('recognizes HttpError and preserves its status code', () => {
    const error = new HttpError(503);

    expect(classifySearchError(error)).toBe('http');
    expect(getSearchErrorMessage(error)).toContain('503');
  });

  it('treats other thrown values as network errors', () => {
    const error = new TypeError('Failed to fetch');

    expect(classifySearchError(error)).toBe('network');
    expect(getSearchErrorMessage(error)).toContain('connection');
  });
});
