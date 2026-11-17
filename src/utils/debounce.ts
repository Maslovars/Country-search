export type DebouncedFunction<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function debounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): DebouncedFunction<Args> {
  if (!Number.isFinite(delay) || delay < 0) {
    throw new RangeError('Debounce delay must be a non-negative finite number.');
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Args | undefined;

  const invoke = (): void => {
    if (lastArgs === undefined) return;

    const args = lastArgs;
    lastArgs = undefined;
    timer = undefined;
    callback(...args);
  };

  const debounced = ((...args: Args): void => {
    if (timer !== undefined) clearTimeout(timer);
    lastArgs = args;
    timer = setTimeout(invoke, delay);
  }) as DebouncedFunction<Args>;

  debounced.cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    lastArgs = undefined;
  };

  debounced.flush = (): void => {
    if (timer === undefined) return;
    clearTimeout(timer);
    invoke();
  };

  return debounced;
}
