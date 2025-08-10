import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import styles from "./notFound.shadow.scss";

export default class NotFound extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.listener;
  }

  connectedCallback() {
    this.render();
    this.styling();
    this.setupEventListener();
  }

  render() {
    const dom = `
       <div class="container">
        <div class="not-found-container">
          <h2>404 - Page Not Found</h2>
          <p>Sorry, the page you are looking for does not exist.</p>
          </div>
       </div>
      `;

    this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);
  }

  styling() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles.toString());
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.addEventListener("click", this.listener);
  }

  handleClick(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      event.preventDefault();
    } else {
      console.log("external");
    }
  } 
}

registerCustomElement("not-found", NotFound);
