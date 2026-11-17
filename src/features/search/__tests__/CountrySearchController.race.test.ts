import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountrySearchController } from '../CountrySearchController';
import type { SearchState } from '../../../types/country';

interface PendingFetch {
  signal: AbortSignal;
  aborted: boolean;
  resolve: (countries: unknown[]) => void;
}

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

function createAbortAwareFetchMock(): {
  fetchMock: ReturnType<typeof vi.fn>;
  requests: PendingFetch[];
} {
  const requests: PendingFetch[] = [];
  const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
    const signal = init?.signal;
    if (!(signal instanceof AbortSignal)) {
      throw new Error('The request must receive an AbortSignal.');
    }

    return new Promise<Response>((resolve, reject) => {
      let settled = false;
      const request: PendingFetch = {
        signal,
        aborted: false,
        resolve: (countries) => {
          if (settled) return;
          settled = true;
          signal.removeEventListener('abort', onAbort);
          resolve(
            new Response(JSON.stringify(countries), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        },
      };

      const onAbort = (): void => {
        if (settled) return;
        settled = true;
        request.aborted = true;
        reject(signal.reason ?? new DOMException('The operation was aborted.', 'AbortError'));
      };

      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });

      requests.push(request);
    });
  });

  return { fetchMock, requests };
}

const countryResponse = (name: string, alpha2Code: string, alpha3Code: string) => [
  {
    name,
    alpha2Code,
    alpha3Code,
    capital: `${name} capital`,
    region: 'Test region',
    population: 1000,
    flag: '🏳️',
  },
];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('CountrySearchController request race', () => {
  it('aborts the previous fetch immediately and keeps only the latest response', async () => {
    const { fetchMock, requests } = createAbortAwareFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    const states: SearchState[] = [];
    const controller = new CountrySearchController({
      onStateChange: (state) => states.push(state),
      debounceMs: 300,
      timeoutMs: 5000,
    });

    controller.handleInput('sp');
    await vi.advanceTimersByTimeAsync(300);
    expect(requests).toHaveLength(1);

    controller.handleInput('spain');
    expect(requests[0].signal.aborted).toBe(true);
    expect(requests[0].aborted).toBe(true);

    await vi.advanceTimersByTimeAsync(300);
    expect(requests).toHaveLength(2);

    requests[1].resolve(countryResponse('Spain', 'ES', 'ESP'));
    await flushPromises();

    expect(states.at(-1)).toMatchObject({
      status: 'success',
      query: 'spain',
      countries: [{ name: 'Spain', id: 'ESP' }],
    });

    requests[0].resolve(countryResponse('Singapore', 'SG', 'SGP'));
    await flushPromises();

    expect(states.at(-1)).toMatchObject({
      status: 'success',
      query: 'spain',
      countries: [{ name: 'Spain', id: 'ESP' }],
    });

    controller.destroy();
  });

  it('aborts an active request immediately when the input is cleared', async () => {
    const { fetchMock, requests } = createAbortAwareFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const states: SearchState[] = [];
    const controller = new CountrySearchController({
      onStateChange: (state) => states.push(state),
      debounceMs: 300,
      timeoutMs: 5000,
    });

    controller.handleInput('canada');
    await vi.advanceTimersByTimeAsync(300);
    controller.handleInput('');

    expect(requests[0].signal.aborted).toBe(true);
    expect(states.at(-1)).toEqual({ status: 'idle', query: '', countries: [] });

    controller.destroy();
  });
});
