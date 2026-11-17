import { describe, expect, it } from 'vitest';
import { mapCountryResponse } from '../mapCountryResponse';

describe('mapCountryResponse', () => {
  it('maps the API country fields into the application model', () => {
    const country = mapCountryResponse({
      name: 'Japan',
      nativeName: '日本',
      alpha2Code: 'JP',
      alpha3Code: 'JPN',
      flag: '🇯🇵',
      flags: { svg: 'https://countries.dev/flags/jp.svg' },
      capital: 'Tokyo',
      region: 'Asia',
      subregion: 'Eastern Asia',
      population: 125000000,
      area: 377975,
      borders: [],
      languages: [{ iso639_1: 'ja', name: 'Japanese', nativeName: '日本語' }],
      currencies: [{ code: 'JPY', name: 'Japanese yen', symbol: '¥' }],
    });

    expect(country).toEqual({
      id: 'JPN',
      name: 'Japan',
      nativeName: '日本',
      flagEmoji: '🇯🇵',
      flagUrl: 'https://countries.dev/flags/jp.svg',
      capital: 'Tokyo',
      region: 'Asia',
      subregion: 'Eastern Asia',
      population: 125000000,
      area: 377975,
      borders: [],
      languages: [{ code: 'ja', name: 'Japanese', nativeName: '日本語' }],
      currencies: [{ code: 'JPY', name: 'Japanese yen', symbol: '¥' }],
    });
  });

  it('supports API responses with capital arrays and missing optional values', () => {
    const country = mapCountryResponse({
      name: { common: 'Exampleland' },
      alpha2Code: 'EX',
      capital: ['Example City'],
    });

    expect(country).toMatchObject({
      id: 'EX',
      name: 'Exampleland',
      flagEmoji: '🇪🇽',
      capital: 'Example City',
      borders: [],
      languages: [],
      currencies: [],
    });
    expect(country.population).toBeUndefined();
  });

  it('maps legacy language and currency dictionaries', () => {
    const country = mapCountryResponse({
      name: 'Legacy Republic',
      languages: { en: 'English' },
      currencies: { USD: { name: 'US dollar', symbol: '$' } },
    });

    expect(country.languages).toEqual([{ code: 'en', name: 'English' }]);
    expect(country.currencies).toEqual([{ code: 'USD', name: 'US dollar', symbol: '$' }]);
  });

  it('throws when the raw country is not an object with a name', () => {
    expect(() => mapCountryResponse(null)).toThrow(TypeError);
    expect(() => mapCountryResponse({ capital: 'Nowhere' })).toThrow(
      'Country response does not contain a valid name.',
    );
  });
});
