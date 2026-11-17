import type { SearchErrorKind } from '../../src/types/country';

export function classifySearchError(_error: unknown): SearchErrorKind {
  return 'network';
}

export function getSearchErrorMessage(_error: unknown): string {
  return 'Something went wrong.';
}
