import type { Country, CountryCurrency, CountryLanguage } from '../types/country';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : {};
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getCountryName(value: unknown): string | undefined {
  if (typeof value === 'string') return asOptionalString(value);
  return asOptionalString(asRecord(value).common);
}

function getCapital(value: unknown): string | undefined {
  if (typeof value === 'string') return asOptionalString(value);
  if (Array.isArray(value)) return asOptionalString(value[0]);
  return undefined;
}

function getFlagEmoji(raw: UnknownRecord, alpha2Code: string | undefined): string {
  const flag = asOptionalString(raw.flag);
  if (flag && !/^https?:\/\//i.test(flag)) return flag;

  if (alpha2Code && /^[A-Z]{2}$/i.test(alpha2Code)) {
    return [...alpha2Code.toUpperCase()]
      .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
      .join('');
  }

  return '🌐';
}

function getFlagUrl(raw: UnknownRecord): string | undefined {
  const flags = asRecord(raw.flags);
  return (
    asOptionalString(flags.svg) ??
    asOptionalString(flags.png) ??
    (typeof raw.flag === 'string' && /^https?:\/\//i.test(raw.flag) ? raw.flag : undefined)
  );
}

function mapLanguages(value: unknown): CountryLanguage[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const language = asRecord(item);
      const name = asOptionalString(language.name);
      if (!name) return [];

      return [
        {
          code: asOptionalString(language.iso639_1) ?? asOptionalString(language.iso639_2) ?? '',
          name,
          nativeName: asOptionalString(language.nativeName),
        },
      ];
    });
  }

  return Object.entries(asRecord(value)).map(([code, name]) => ({
    code,
    name: String(name),
  }));
}

function mapCurrencies(value: unknown): CountryCurrency[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const currency = asRecord(item);
      const name = asOptionalString(currency.name);
      if (!name) return [];

      return [
        {
          code: asOptionalString(currency.code) ?? '',
          name,
          symbol: asOptionalString(currency.symbol),
        },
      ];
    });
  }

  return Object.entries(asRecord(value)).flatMap(([code, item]) => {
    const currency = asRecord(item);
    const name = asOptionalString(currency.name);
    return name ? [{ code, name, symbol: asOptionalString(currency.symbol) }] : [];
  });
}

export function mapCountryResponse(rawValue: unknown): Country {
  if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) {
    throw new TypeError('Country response must be an object.');
  }

  const raw = asRecord(rawValue);
  const name = getCountryName(raw.name);
  if (!name) throw new TypeError('Country response does not contain a valid name.');

  const alpha2Code = asOptionalString(raw.alpha2Code) ?? asOptionalString(raw.cca2);
  const alpha3Code = asOptionalString(raw.alpha3Code) ?? asOptionalString(raw.cca3);
  const borders = Array.isArray(raw.borders)
    ? raw.borders.filter((border): border is string => typeof border === 'string')
    : [];

  return {
    id: alpha3Code ?? alpha2Code ?? name.toLowerCase(),
    name,
    nativeName: asOptionalString(raw.nativeName),
    flagEmoji: getFlagEmoji(raw, alpha2Code),
    flagUrl: getFlagUrl(raw),
    capital: getCapital(raw.capital),
    region: asOptionalString(raw.region),
    subregion: asOptionalString(raw.subregion),
    population: asOptionalNumber(raw.population),
    area: asOptionalNumber(raw.area),
    borders,
    languages: mapLanguages(raw.languages),
    currencies: mapCurrencies(raw.currencies),
  };
}
