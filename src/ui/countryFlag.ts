import type { Country } from '../types/country';
import { createElement } from './dom';

export function createCountryFlag(country: Country, className: string): HTMLSpanElement {
  const flag = createElement('span', `${className} country-flag`);
  flag.setAttribute('role', 'img');
  flag.setAttribute('aria-label', `${country.name} flag`);

  const fallback = createElement('span', 'country-flag__fallback', country.flagEmoji || '🌐');
  fallback.setAttribute('aria-hidden', 'true');

  if (!country.flagUrl) {
    flag.append(fallback);
    return flag;
  }

  const image = createElement('img', 'country-flag__image');
  image.alt = '';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener(
    'error',
    () => {
      image.remove();
      flag.append(fallback);
    },
    { once: true },
  );

  image.src = country.flagUrl;
  flag.append(image);
  return flag;
}
