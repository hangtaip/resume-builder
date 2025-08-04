import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent.js";
import styles from "./userPic.shadow.scss";
import eventManager from "../../js/eventManager.js";

export default class UserPic extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.listener;
    this.styleType = this.dataset.style || "default";
    this.handleCompleteFormRequest = this.handleCompleteFormRequest.bind(this);
    this.unsubscribe;
  }

  render() {
    const dom = `
      <div class="container">
        <div class="pic"></div>
      </div>
    `;

    this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);
  }

  async styling() {
    const sheet = new CSSStyleSheet();
    // sheet.replaceSync(styles);
    // sheet.replaceSync(styles.toString());
    // styles.use({ target: this.shadowRoot });
    sheet.replaceSync(styles.toString());
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.listener.setDelegates(this);
    this.unsubscribe = eventManager.subscribe("completeFormRequest", this.listener);
  }

  handleCompleteFormRequest(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const blob = event.detail.data.owner.image;
      blob.text().then(src => {
        this.shadowRoot.querySelector(".pic").style.backgroundImage = `url(${JSON.parse(src).data})`;
      });

    } else {
      console.log("external");
    }
  }

  connectedCallback() {
    this.setupEventListener();
    this.render();
    this.styling();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }
}

//customElements.define('page-body', Body);
registerCustomElement("user-pic", UserPic);
