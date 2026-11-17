import type { Country, SearchState } from '../types/country';
import { CountrySearchController } from '../features/search/CountrySearchController';
import { createButton, createElement } from './dom';
import { createCountryFlag } from './countryFlag';

const numberFormatter = new Intl.NumberFormat('en-US');

function formatPopulation(population: number | undefined): string {
  return population === undefined
    ? 'Population unavailable'
    : `${numberFormatter.format(population)} people`;
}

function appendDetailRow(container: HTMLElement, label: string, value: string): void {
  const row = createElement('div', 'detail-row');
  row.append(createElement('dt', 'detail-row__label', label));
  row.append(createElement('dd', 'detail-row__value', value));
  container.append(row);
}

function getCurrencyText(country: Country): string {
  return country.currencies.length > 0
    ? country.currencies
        .map((currency) =>
          [currency.name, currency.code, currency.symbol].filter(Boolean).join(' · '),
        )
        .join(', ')
    : 'Not available';
}

function getLanguageText(country: Country): string {
  return country.languages.length > 0
    ? country.languages.map((language) => language.name).join(', ')
    : 'Not available';
}

function showCountryDetails(country: Country): void {
  const overlay = createElement('div', 'modal-overlay');
  overlay.setAttribute('role', 'presentation');

  const dialog = createElement('section', 'country-modal');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'country-modal-title');

  const closeButton = createButton('icon-button modal-close', '×');
  closeButton.setAttribute('aria-label', 'Close country details');
  closeButton.addEventListener('click', () => overlay.remove());

  const heading = createElement('div', 'country-modal__heading');
  const flag = createCountryFlag(country, 'country-modal__flag');
  const headingCopy = createElement('div', 'country-modal__heading-copy');
  const title = createElement('h2', 'country-modal__title', country.name);
  title.id = 'country-modal-title';
  const subtitle = createElement(
    'p',
    'country-modal__subtitle',
    [country.capital, country.region].filter(Boolean).join(' · ') || 'Country profile',
  );
  headingCopy.append(title, subtitle);
  heading.append(flag, headingCopy, closeButton);

  const description = createElement(
    'p',
    'country-modal__description',
    country.subregion
      ? `${country.name} is part of ${country.subregion}.`
      : country.region
        ? `${country.name} is located in ${country.region}.`
        : `Explore key facts about ${country.name}.`,
  );

  const details = createElement('dl', 'country-details');
  appendDetailRow(details, 'Capital', country.capital ?? 'Not available');
  appendDetailRow(details, 'Region', country.region ?? 'Not available');
  appendDetailRow(details, 'Subregion', country.subregion ?? 'Not available');
  appendDetailRow(details, 'Population', formatPopulation(country.population));
  appendDetailRow(
    details,
    'Area',
    country.area === undefined ? 'Not available' : `${numberFormatter.format(country.area)} km²`,
  );
  appendDetailRow(details, 'Languages', getLanguageText(country));
  appendDetailRow(details, 'Currencies', getCurrencyText(country));
  appendDetailRow(
    details,
    'Bordering countries',
    country.borders.length > 0 ? country.borders.join(', ') : 'No land borders listed',
  );

  dialog.append(heading, description, details);
  overlay.append(dialog);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) overlay.remove();
  });
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') overlay.remove();
  });

  document.body.append(overlay);
  closeButton.focus();
}

function createCountryCard(country: Country): HTMLButtonElement {
  const card = createButton('country-card', '');
  card.setAttribute('aria-label', `Show details for ${country.name}`);

  const top = createElement('div', 'country-card__top');
  const flag = createCountryFlag(country, 'country-card__flag');
  const code = createElement('span', 'country-card__code', country.id.toUpperCase());
  top.append(flag, code);

  const name = createElement('h3', 'country-card__name', country.name);
  const capital = createElement(
    'p',
    'country-card__capital',
    country.capital ?? 'Capital unavailable',
  );

  const footer = createElement('div', 'country-card__footer');
  const region = createElement('span', 'country-card__region', country.region ?? 'Other region');
  const population = createElement(
    'span',
    'country-card__population',
    country.population === undefined ? '—' : numberFormatter.format(country.population),
  );
  footer.append(region, population);

  card.append(top, name, capital, footer);
  card.addEventListener('click', () => showCountryDetails(country));
  return card;
}

function renderState(
  state: SearchState,
  resultsHeading: HTMLElement,
  resultsCount: HTMLElement,
  resultsRegion: HTMLElement,
): void {
  resultsRegion.replaceChildren();

  if (state.status === 'idle') {
    resultsHeading.textContent = 'Search results';
    resultsCount.textContent = '';
    const empty = createElement('div', 'empty-state');
    empty.append(
      createElement('span', 'empty-state__symbol', '⌕'),
      createElement('p', 'empty-state__title', 'Search for a country'),
      createElement('p', 'empty-state__copy', 'Enter a country name to see matching places.'),
    );
    resultsRegion.append(empty);
    return;
  }

  if (state.status === 'loading') {
    resultsHeading.textContent = 'Search results';
    resultsCount.textContent = '';
    const loading = createElement('div', 'state-message');
    loading.setAttribute('role', 'status');
    loading.append(createElement('span', 'spinner'), createElement('span', '', 'Searching…'));
    resultsRegion.append(loading);
    return;
  }

  if (state.status === 'empty') {
    resultsHeading.textContent = 'Search results';
    resultsCount.textContent = '0 countries';
    const empty = createElement('div', 'empty-state');
    empty.append(
      createElement('span', 'empty-state__symbol', '⌕'),
      createElement('p', 'empty-state__title', 'No countries found'),
      createElement('p', 'empty-state__copy', `There are no matches for “${state.query}”.`),
    );
    resultsRegion.append(empty);
    return;
  }

  if (state.status === 'error') {
    resultsHeading.textContent = 'Search results';
    resultsCount.textContent = '';
    const error = createElement('div', 'error-state');
    error.setAttribute('role', 'alert');
    error.append(
      createElement('span', 'error-state__symbol', '!'),
      createElement('p', 'error-state__title', 'Search could not be completed'),
      createElement('p', 'error-state__copy', state.message),
    );
    const retryButton = createButton('button button--primary', 'Try again');
    retryButton.addEventListener('click', () => {
      const event = new CustomEvent('country-search-retry');
      resultsRegion.dispatchEvent(event);
    });
    error.append(retryButton);
    resultsRegion.append(error);
    return;
  }

  resultsHeading.textContent = 'Search results';
  resultsCount.textContent = `${state.countries.length} ${state.countries.length === 1 ? 'country' : 'countries'}`;
  const grid = createElement('div', 'country-grid');
  state.countries.forEach((country) => grid.append(createCountryCard(country)));
  resultsRegion.append(grid);
}

export function mountApp(root: HTMLElement = document.body): () => void {
  const page = createElement('div', 'page-shell');
  const topbar = createElement('header', 'topbar');
  const brand = createElement('a', 'brand');
  brand.href = '#top';
  const mark = createElement('span', 'brand__mark', 'AT');
  mark.setAttribute('aria-hidden', 'true');
  const brandName = createElement('span', 'brand__name', 'Atlas');
  brand.append(mark, brandName);
  topbar.append(brand);

  const main = createElement('main', 'main-content');
  main.id = 'top';
  const intro = createElement('section', 'intro');
  intro.append(
    createElement('p', 'eyebrow', 'COUNTRY SEARCH'),
    createElement('h1', 'intro__title', 'Explore the world.'),
    createElement(
      'p',
      'intro__description',
      'Find a country and discover the details that make it unique.',
    ),
  );

  const searchPanel = createElement('section', 'search-panel');
  const form = createElement('form', 'search-form');
  form.setAttribute('role', 'search');
  const input = createElement('input', 'search-input');
  input.type = 'search';
  input.name = 'country';
  input.placeholder = 'Search by country name…';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Search countries by name');
  form.append(input);
  searchPanel.append(form);

  const resultsSection = createElement('section', 'results-section');
  const resultsHeader = createElement('div', 'results-header');
  const resultsHeading = createElement('h2', 'results-header__title', 'Search results');
  const resultsCount = createElement('span', 'results-header__count');
  resultsHeader.append(resultsHeading, resultsCount);
  const resultsRegion = createElement('div', 'results-region');
  resultsRegion.setAttribute('aria-live', 'polite');
  resultsRegion.setAttribute('aria-atomic', 'true');
  resultsSection.append(resultsHeader, resultsRegion);

  const footer = createElement('footer', 'footer');
  footer.append(createElement('span', '', 'Country data provided by countries.dev'));

  main.append(intro, searchPanel, resultsSection);
  page.append(topbar, main, footer);
  root.append(page);

  const controller = new CountrySearchController({
    onStateChange: (state) => renderState(state, resultsHeading, resultsCount, resultsRegion),
  });

  input.addEventListener('input', () => controller.handleInput(input.value));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    controller.handleInput(input.value);
  });
  resultsRegion.addEventListener('country-search-retry', () => controller.retry());

  renderState(
    { status: 'idle', query: '', countries: [] },
    resultsHeading,
    resultsCount,
    resultsRegion,
  );

  return () => {
    controller.destroy();
    page.remove();
  };
}
