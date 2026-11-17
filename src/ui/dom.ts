export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createButton(
  className: string,
  text: string,
  type: 'button' | 'submit' = 'button',
) {
  const button = createElement('button', className, text);
  button.type = type;
  return button;
}
