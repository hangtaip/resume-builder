import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import {
  getRegisteredCustomElements,
  registerCustomElement,
} from "../../js/registerComponent.js";
import styles from "./home.shadow.scss";
import eventManager from "../../js/eventManager.js";

export default class Home extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.homeForm;
    this.unsubscribe;
  }

  render() {
    const dom = `
      <div class="container">
        <custom-nav></custom-nav>
        <div class="mainWrapper">
          <div class="docWrapper">
            <div class="docRoot">
              <custom-aside class="transitionable"></custom-aside>
              <main>
                <div class="formRoot">
                  <div class="card view transparent transitionable"></div>
                  <div class="card main-bottom"></div>
                </div>
              </main>
            </div>
          </div>
        </div>
        <preview-resume></preview-resume>
        <loading-screen></loading-screen>
      </div>
      `;
    {
      /* <menu-btn></menu-btn> */
    }
    {
      /* <home-form></home-form> */
    }

    const registeredComponents = getRegisteredCustomElements();

    DOMPurify.addHook("uponSanitizeElement", (_, data) => {
      if (registeredComponents.includes(data.tagName) !== -1) {
        data.allowedTags[data.tagName] = true;
      }
    });

    this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);
  }

  styling() {
    const sheet = new CSSStyleSheet();
    if (process.env.NODE_ENV === "production") {
      sheet.replaceSync(styles);
    } else {
      //const cssModule = import('./details.shadow.scss');
      sheet.replaceSync(styles.toString());
      // styles.use({ target: this.shadowRoot });
    }
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.shadowRoot.addEventListener("transitionend", this.listener);
    // homeFormLoaded subscribed from customAside
    // document.addEventListener("homeFormLoaded", this.listener);
    this.unsubscribe = eventManager.subscribe("homeFormLoaded", this.listener);
  }

  handleHomeFormLoaded(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      let elem = this.shadowRoot.querySelector(".view");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;
      if (!event) return;

      this.homeForm = document.createElement(event.detail.elementName);
      this.homeForm?.classList.add("transparent");

      if (elem.hasChildNodes()) {
        elem.classList.add("transparent");
        Array.from(elem.childNodes).forEach((node) =>
          node.classList.add("removing"),
        );
      }

      elem.classList.remove("transparent");
    } else {
      console.log("external");
    }
  }

  handleTransitionend(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      let elem = event.target.closest(".transitionable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      switch (true) {
        case elem.classList.contains("view"):
          if (elem.hasChildNodes()) {
            Array.from(elem.childNodes).forEach((node) => {
              if (node.classList.contains("removing")) {
                node.remove();
              }
            });
          } else {
            elem.append(this.homeForm);
            // ensure dom is inserted
            requestAnimationFrame(() => {
              // ensure browser rendered the changes
              requestAnimationFrame(() => {
                this.homeForm?.classList.remove("transparent");
              });
            });

            // or use settimeout
            // setTimeout(() => {
            //   this.homeForm.classList.remove("transparent");
            // }, 0);
          }
          break;
      }
    } else {
      console.log("external");
    }
  } 

  connectedCallback() {
    this.render();
    this.styling();
    this.setupEventListener();
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }
}

//customElements.define('resume-home', Home);
registerCustomElement("resume-home", Home);
