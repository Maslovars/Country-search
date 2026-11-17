export type DebouncedFunction<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
  flush: () => void;
};

export function debounce<Args extends unknown[]>(
  _callback: (...args: Args) => void,
  _delay: number,
): DebouncedFunction<Args> {
  const placeholder = (() => undefined) as DebouncedFunction<Args>;
  placeholder.cancel = () => undefined;
  placeholder.flush = () => undefined;
  return placeholder;
}
