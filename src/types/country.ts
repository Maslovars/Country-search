export interface CountryLanguage {
  code: string;
  name: string;
  nativeName?: string;
}

export interface CountryCurrency {
  code: string;
  name: string;
  symbol?: string;
}

export interface Country {
  id: string;
  name: string;
  nativeName?: string;
  flagEmoji: string;
  flagUrl?: string;
  capital?: string;
  region?: string;
  subregion?: string;
  population?: number;
  area?: number;
  borders: string[];
  languages: CountryLanguage[];
  currencies: CountryCurrency[];
}

export type SearchState =
  | { status: 'idle'; query: ''; countries: [] }
  | { status: 'loading'; query: string; countries: [] }
  | { status: 'success'; query: string; countries: Country[] }
  | { status: 'empty'; query: string; countries: [] }
  | { status: 'error'; query: string; countries: []; message: string };

export type SearchErrorKind = 'aborted' | 'timeout' | 'http' | 'network';
