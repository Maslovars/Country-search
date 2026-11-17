import { afterEach, describe, expect, it, vi } from 'vitest';
import { debounce } from '../debounce';

afterEach(() => {
  vi.useRealTimers();
});

describe('debounce', () => {
  it('calls the callback only after the delay has elapsed', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('first');
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');
  });

  it('resets the timer and keeps only the latest arguments', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('sp');
    vi.advanceTimersByTime(200);
    debounced('spa');
    vi.advanceTimersByTime(200);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('spa');
  });

  it('supports cancelling a scheduled call', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('canada');
    debounced.cancel();
    vi.advanceTimersByTime(500);

    expect(callback).not.toHaveBeenCalled();
  });

  it('can flush a pending call immediately', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 300);

    debounced('japan');
    debounced.flush();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('japan');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects a negative delay', () => {
    expect(() => debounce(() => undefined, -1)).toThrow(RangeError);
  });
});
