import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Country } from '../../types/country';
import { createCountryFlag } from '../countryFlag';

class FakeElement {
  className = '';
  textContent = '';
  src = '';
  alt = '';
  loading = '';
  decoding = '';
  children: FakeElement[] = [];
  attributes = new Map<string, string>();
  listeners = new Map<string, Array<() => void>>();
  parent?: FakeElement;

  constructor(readonly tagName: string) {}

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  append(...nodes: FakeElement[]): void {
    nodes.forEach((node) => {
      node.parent = this;
      this.children.push(node);
    });
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const callbacks = this.listeners.get(type) ?? [];
    callbacks.push(() => {
      if (typeof listener === 'function') {
        listener.call(this as unknown as EventTarget, new Event(type));
      } else {
        listener.handleEvent(new Event(type));
      }
    });
    this.listeners.set(type, callbacks);
  }

  remove(): void {
    if (this.parent) {
      this.parent.children = this.parent.children.filter((child) => child !== this);
    }
  }

  emit(type: string): void {
    this.listeners.get(type)?.forEach((listener) => listener());
  }
}

const japan: Country = {
  id: 'JPN',
  name: 'Japan',
  flagEmoji: '🇯🇵',
  flagUrl: 'https://countries.dev/flags/jp.svg',
  borders: [],
  languages: [],
  currencies: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createCountryFlag', () => {
  it('renders the flag image when a URL is available', () => {
    vi.stubGlobal('document', {
      createElement: (tagName: string) => new FakeElement(tagName),
    });

    const flag = createCountryFlag(japan, 'country-card__flag') as unknown as FakeElement;
    const image = flag.children[0];

    expect(flag.attributes.get('role')).toBe('img');
    expect(flag.attributes.get('aria-label')).toBe('Japan flag');
    expect(image.tagName).toBe('img');
    expect(image.src).toBe(japan.flagUrl);
    expect(image.loading).toBe('lazy');
    expect(image.alt).toBe('');
  });

  it('shows the emoji when the image request fails', () => {
    vi.stubGlobal('document', {
      createElement: (tagName: string) => new FakeElement(tagName),
    });

    const flag = createCountryFlag(japan, 'country-card__flag') as unknown as FakeElement;
    const image = flag.children[0];

    image.emit('error');

    expect(flag.children).toHaveLength(1);
    expect(flag.children[0].className).toBe('country-flag__fallback');
    expect(flag.children[0].textContent).toBe('🇯🇵');
  });

  it('shows the emoji immediately when the image URL is missing', () => {
    vi.stubGlobal('document', {
      createElement: (tagName: string) => new FakeElement(tagName),
    });

    const country = { ...japan, flagUrl: undefined };
    const flag = createCountryFlag(country, 'country-modal__flag') as unknown as FakeElement;

    expect(flag.children).toHaveLength(1);
    expect(flag.children[0].className).toBe('country-flag__fallback');
    expect(flag.children[0].textContent).toBe('🇯🇵');
  });
});
