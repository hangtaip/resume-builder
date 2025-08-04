import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent.js";
import ShadowParser from "../../js/shadowParser.js";
import styles from "./printBtn.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faPrint } from "@fortawesome/free-solid-svg-icons";
import eventManager from "../../js/eventManager.js";

export default class PrintBtn extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.dataset.printDisable = true;
    this.listener;
    this.customEventData = {
      await: false,
      awaitDetail() {
        return 0;
      },
      eventName: "handleCustomEvent",
      details: "",
    };
    library.add(faPrint);
  }

  render() {
    const i = icon(faPrint, {
      classes: ["fa-print"],
    });

    const dom = `
      <div class="container">
	  <button type="button" title="Print" class="clickable">
	    ${i.node[0].outerHTML}
	  </button>
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
    this.shadowRoot.addEventListener("click", this.listener);
  }

  handleClick(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const elem = event.target.closest(".clickable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      this.customEventData.await = false;
      this.customEventData.awaitDetail = () => {
	return 0;
      };
      this.customEventData.eventName = "printResume";
      this.customEventData.details = { "" : "" };
      this.publishCustomEvent(this.customEventData);
    } else {
      console.log("external");
    }
  }

  async publishCustomEvent(data) {
    try {
      if (data.await) {
        await data.awaitDetail();
      }

      const eventDetail = {
        bubbles: true,
        composed: true,
        detail: data.details,
      };

      eventManager.publish(data.eventName, eventDetail);
    } catch (err) {
      console.error(`Failed to publish ${data.eventName} : ${err}`);
    }
  }

  print() {
    // window.print();
    const src = this.getHTML(document.getElementsByTagName("resume-home")[0]);
    // const element = document.getElementsByTagName("resume-home")[0];
  }

  getHTML(src) {
    const parser = new ShadowParser();
    const html = parser.cloneNode(src);
    console.log(html);
  }

  connectedCallback() {
    this.render();
    this.styling();
    this.setupEventListener();
  }
}

registerCustomElement("print-btn", PrintBtn);
