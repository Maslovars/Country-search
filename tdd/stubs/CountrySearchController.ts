import type { Country, SearchState } from '../../src/types/country';

interface Options {
  onStateChange: (state: SearchState) => void;
  search?: (query: string, signal: AbortSignal) => Promise<Country[]>;
  debounceMs?: number;
  timeoutMs?: number;
}

export class CountrySearchController {
  constructor(_options: Options) {}

  public handleInput(_value: string): void {}

  public retry(): void {}

  public destroy(): void {}
}
