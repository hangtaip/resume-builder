export default function insertIntoTarget(element, options) {
  const parent = options.target || document.head;

  parent.appendChild(element);
}

export function insertStyle(css, shadowRoot) {
  const styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(css);
  shadowRoot.adoptedStyleSheets = [styleSheet];
}
