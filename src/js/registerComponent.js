const customElementRegistry = new Map();

export function registerCustomElement(tagName, elementClass) {
  if (!customElementRegistry.has(tagName)) {
    customElements.define(tagName, elementClass);
    customElementRegistry.set(tagName, elementClass);
  } else {
    console.warn(`Custom element ${tagName} is already registered.`);
  }
}

export function getRegisteredCustomElements() {
  return Array.from(customElementRegistry.keys());
}

export function getCustomElementClass(tagName) {
  return customElementRegistry.get(tagName);
}
