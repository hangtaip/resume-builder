import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import styles from "./template.shadow.scss";

export default class Template extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.listener;
   }

   render() {
      const dom = `
         <div class="container">
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
         this.event();
      } else {
         console.log("external");
      }
   }

   event() {
      console.log('event');
   }

   connectedCallback() {
      this.render();
      this.styling();
      this.setupEventListener();
   }
}

registerCustomElement("template", Template);
