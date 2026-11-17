import type { SearchErrorKind } from '../types/country';
import { HttpError } from '../services/HttpError';

function hasErrorName(error: unknown, name: string): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === name;
}

export function classifySearchError(error: unknown): SearchErrorKind {
  if (hasErrorName(error, 'AbortError')) return 'aborted';
  if (hasErrorName(error, 'TimeoutError')) return 'timeout';
  if (error instanceof HttpError) return 'http';
  return 'network';
}

export function getSearchErrorMessage(error: unknown): string {
  const kind = classifySearchError(error);

  if (kind === 'timeout') {
    return 'The search took too long. Check your connection and try again.';
  }

  if (kind === 'http' && error instanceof HttpError) {
    return `The server returned an error (${error.status}). Please try again.`;
  }

  if (kind === 'network') {
    return 'Could not connect to the country service. Check your connection and try again.';
  }

  return '';
}
