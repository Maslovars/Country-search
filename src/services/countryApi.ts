import { COUNTRIES_API_URL } from '../config';
import { mapCountryResponse } from '../mappers/mapCountryResponse';
import type { Country } from '../types/country';
import { HttpError } from './HttpError';

export async function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const url = `${COUNTRIES_API_URL}/name/${encodeURIComponent(normalizedQuery)}`;
  const response = await fetch(url, { method: 'GET', signal });

  if (response.status === 404) return [];
  if (!response.ok) {
    throw new HttpError(response.status, `Country search failed with HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new TypeError('Country search response must be an array.');
  }

  return payload.map(mapCountryResponse);
}
