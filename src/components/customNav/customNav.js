import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import styles from "./customNav.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import eventManager from "../../js/eventManager.js";

export default class CustomNav extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.listener;
      this.unsubscribe;
      library.add(faBars);
   }

   render() {
      const bars = icon(faBars, {
         classes: ["fa-bars", "icon"],
      }); 

      const dom = `
         <div class="container">
            <nav class="navbar fixedTop clickableToggle">
               <div class="navbar_inner">
                  <div class="navbar_items">
                  <button class="clickable menu-btn" type="button">
                     ${bars.node[0].outerHTML}
                  </button>
                  </div>
                  <div class="navbar_items app_title">
                     Resume Builder
                  </div>
               </div>
               <div class="navbar_sidebar">
                  <custom-aside></custom-aside>
               </div>
               <div class="navbar_backdrop clickable">
               </div>
            </nav>
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
      this.unsubscribe = eventManager.subscribe("toggleNavbar", this.listener);
   }

   handleClick(event, delegated) {
      const isDOM = delegated instanceof Listener;

      if (isDOM) {
         const elem = event.target.closest(".clickable");
         let toggler;
         let customAside;
         let customAsideValues = []

         if (!elem) return;
         if (!this.shadowRoot.contains(elem)) return;

         switch (true) {
            case elem.classList.contains("menu-btn"):
               toggler = event.target.closest(".clickableToggle");
               toggler.classList.add("navbar_sidebar_show"); 
               customAside = this.shadowRoot.querySelector("custom-aside");
               customAsideValues.push("sidebar-visible");
               customAside.dataset.containerClassAdd = JSON.stringify(customAsideValues);
               break;
            case elem.classList.contains("navbar_backdrop"):
               toggler = event.target.closest(".clickableToggle");
               toggler.classList.remove("navbar_sidebar_show"); 
               customAside = this.shadowRoot.querySelector("custom-aside");
               customAsideValues.push("sidebar-visible");
               customAside.dataset.containerClassRemove = JSON.stringify(customAsideValues);
               break;
         }
      } else {
         console.log("external");
      }
   }

   handleToggleNavbar(event, delegated) {
      const isDOM = delegated instanceof Listener;

      if (isDOM) {
         const elem = this.shadowRoot.querySelector(".clickableToggle"); 

         if (!elem) return;
         if (!this.shadowRoot.contains(elem)) return;

         if (elem.classList.contains(event.detail.className)) {
            elem.classList.remove(event.detail.className);
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
      this.unsubscribe();
   }
}

registerCustomElement("custom-nav", CustomNav);
