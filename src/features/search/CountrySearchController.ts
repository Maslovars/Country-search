import { SEARCH_DEBOUNCE_MS, SEARCH_TIMEOUT_MS } from '../../config';
import { searchCountries } from '../../services/countryApi';
import type { Country, SearchState } from '../../types/country';
import { classifySearchError, getSearchErrorMessage } from '../../utils/classifySearchError';
import { debounce } from '../../utils/debounce';

interface CountrySearchControllerOptions {
  onStateChange: (state: SearchState) => void;
  search?: (query: string, signal: AbortSignal) => Promise<Country[]>;
  debounceMs?: number;
  timeoutMs?: number;
}
export class CountrySearchController {
  private readonly onStateChange: (state: SearchState) => void;
  private readonly search: (query: string, signal: AbortSignal) => Promise<Country[]>;
  private readonly timeoutMs: number;
  private readonly debouncedSearch: ReturnType<typeof debounce<[string, number]>>;
  private activeController: AbortController | null = null;
  private currentQuery = '';
  private requestVersion = 0;
  private destroyed = false;

  constructor({
    onStateChange,
    search = searchCountries,
    debounceMs = SEARCH_DEBOUNCE_MS,
    timeoutMs = SEARCH_TIMEOUT_MS,
  }: CountrySearchControllerOptions) {
    this.onStateChange = onStateChange;
    this.search = search;
    this.timeoutMs = timeoutMs;
    this.debouncedSearch = debounce<[string, number]>(
      (query, version) => void this.executeSearch(query, version),
      debounceMs,
    );
  }

  public handleInput(value: string): void {
    if (this.destroyed) return;

    const query = value.trim();
    this.currentQuery = query;
    const version = ++this.requestVersion;

    this.cancelActiveRequest();
    this.debouncedSearch.cancel();

    if (!query) {
      this.onStateChange({ status: 'idle', query: '', countries: [] });
      return;
    }

    this.onStateChange({ status: 'loading', query, countries: [] });
    this.debouncedSearch(query, version);
  }

  public retry(): void {
    if (this.destroyed || !this.currentQuery) return;

    const version = ++this.requestVersion;
    this.cancelActiveRequest();
    this.debouncedSearch.cancel();
    this.onStateChange({ status: 'loading', query: this.currentQuery, countries: [] });
    void this.executeSearch(this.currentQuery, version);
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.requestVersion += 1;
    this.debouncedSearch.cancel();
    this.cancelActiveRequest();
  }

  private cancelActiveRequest(): void {
    this.activeController?.abort();
    this.activeController = null;
  }

  private async executeSearch(query: string, version: number): Promise<void> {
    if (this.destroyed || version !== this.requestVersion) return;

    const controller = new AbortController();
    this.activeController = controller;
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const signal = AbortSignal.any([controller.signal, timeoutSignal]);

    try {
      const countries = await this.search(query, signal);
      if (this.destroyed || version !== this.requestVersion) return;

      this.onStateChange(
        countries.length > 0
          ? { status: 'success', query, countries }
          : { status: 'empty', query, countries: [] },
      );
    } catch (error: unknown) {
      if (this.destroyed || version !== this.requestVersion) return;
      if (classifySearchError(error) === 'aborted') return;

      this.onStateChange({
        status: 'error',
        query,
        countries: [],
        message: getSearchErrorMessage(error),
      });
    } finally {
      if (this.activeController === controller) this.activeController = null;
    }
  }
}
