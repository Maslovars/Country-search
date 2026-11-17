import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCountries } from '../countryApi';
import { HttpError } from '../HttpError';

const japanResponse = [
  {
    name: 'Japan',
    alpha2Code: 'JP',
    alpha3Code: 'JPN',
    capital: 'Tokyo',
    region: 'Asia',
    population: 125000000,
    flag: '🇯🇵',
    languages: [{ iso639_1: 'ja', name: 'Japanese' }],
    currencies: [{ code: 'JPY', name: 'Japanese yen', symbol: '¥' }],
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchCountries', () => {
  it('requests the encoded country name and maps the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(japanResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    const countries = await searchCountries(' South Korea ', controller.signal);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://countries.dev/name/South%20Korea', {
      method: 'GET',
      signal: controller.signal,
    });
    expect(countries[0]).toMatchObject({ name: 'Japan', capital: 'Tokyo', id: 'JPN' });
  });

  it('returns an empty array for HTTP 404 because it means no matches', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('Country not found', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCountries('not-a-country', new AbortController().signal)).resolves.toEqual(
      [],
    );
  });

  it('throws HttpError for other unsuccessful HTTP statuses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('Server error', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCountries('japan', new AbortController().signal)).rejects.toMatchObject({
      name: 'HttpError',
      status: 503,
    });
    await expect(searchCountries('japan', new AbortController().signal)).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it('does not send a request for an empty query', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCountries('   ', new AbortController().signal)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates network errors', async () => {
    const networkError = new TypeError('Failed to fetch');
    const fetchMock = vi.fn().mockRejectedValue(networkError);
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCountries('japan', new AbortController().signal)).rejects.toBe(networkError);
  });
});
