import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent.js";
import styles from "./loadingBlock.shadow.scss";
import eventManager from "../../js/eventManager.js";
import objectRegistry from "../../js/objectRegistry.js";

export default class LoadingBlock extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.listener;
      this.unsubscribe;
   }

   connectedCallback() {
      this.render();
      this.styling();
      this.setupEventListener();   
   }

   disconnectedCallback() {
      this.unsubscribe();
   }

   render() {
      const dom = `
         <div class="container">
            <div class="lds-default">
               <div></div>
               <div></div>
               <div></div>
               <div></div>
               <div></div>
               <div></div>
               <div></div>
               <div></div>
               <div></div>
               <div></div>
               <div></div>
               <div></div>
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
      this.unsubscribe = eventManager.subscribe(["startLoading", "stopLoading"], this.listener);
   }

   handleStartLoading(event, delegated) {
      const isDOM = delegated instanceof Listener;

      if (isDOM) {
         this.shadowRoot.querySelector(".container").classList.add("visible");
      } else {
         console.log("external");
      }
   } 

   handleStopLoading(event, delegated) {
      const isDOM = delegated instanceof Listener;

      if (isDOM) {
         this.shadowRoot.querySelector(".container").classList.remove("visible");
      } else {
         console.log("external");
      }
   }
}

registerCustomElement("loading-block", LoadingBlock);
