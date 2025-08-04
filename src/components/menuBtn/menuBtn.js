import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import ShadowParser from "../../js/shadowParser.js";
import { registerCustomElement } from "../../js/registerComponent.js";
import styles from "./menuBtn.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faBars } from "@fortawesome/free-solid-svg-icons";

export default class MenuBtn extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.listener;
      library.add(faBars);
   }
   
   render() {
      const i = icon(faBars, {
         classes: ["fa-bars", "icon"],
      });

      const dom = `
         <div class="container">
            <button type="button" title="dialog">
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
      this.addEventListener("click", this.listener);
   }

   handleClick(event, delegated) {
      const isDOM = delegated instanceof Listener;

      if (isDOM) {
         event.preventDefault();
         const parser = new ShadowParser();
         const node = document.querySelector('resume-home');
         const dialog = parser.searchNode(node, 'tagName', 'dialog');
         dialog.showModal();
      } else {
         console.log("external");
      }
   }

   connectedCallback() {
      this.render();
      this.styling();
      this.setupEventListener();
   }
}

registerCustomElement("menu-btn", MenuBtn);
