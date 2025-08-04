import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import styles from "./customTextarea.shadow.scss";

export default class CustomTextarea extends HTMLElement {
   static observedAttributes = ["data-values"];
   constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.listener;
      this.dataID = JSON.parse(this.dataset.id || '[]');
      this.inputCount = this.dataID.length || "1";
      this.placeHolder = JSON.parse(this.dataset.placeholder || '["Enter text"]');
      this.title = this.getAttribute("title") || ["Custom Input"];
      this.dataAttr = JSON.parse(this.dataset.attr || "{}");
      this.dataFormGroupItem = JSON.parse(this.dataset.formGroupItem || "{}");
      this.dataClass = JSON.parse(this.dataset.class || "{}"); 
      this.dataTitle = JSON.parse(this.dataset.title || '["field"]');
      this.dataValues = JSON.parse(this.dataset.values || "{}");
   }

   async render() {
      const dom = `
         <div class="container">
            <div class="form-group">
            ${Array.from({length: this.inputCount}, (_, i) => {
               return `
               <div class="form-group-item ${this.dataFormGroupItem.length > 0 ? ` ${this.dataFormGroupItem[i]}` : ""}">
                  <slot name="label_${i}"></slot>
                  <textarea
                     title="${this.dataTitle[i]}"
                     ${this.dataClass.length > 0 ? `class="${this.dataClass[i]}"` : ""}
                     ${this.dataID.length > 0 ? `id="${this.dataID[i]}"` : ""}
                     ${this.dataAttr.length > 0 ? `data-attr="${this.dataAttr[i]}"` : ""}
                  ></textarea>
               </div>
               `
            }).join('')
            }
            </div>
            <slot class="other"></slot>
         </div>
         `;

      this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);

      if (this.dataValues.length > 0) {
         const textarea = this.shadowRoot.querySelector("textarea");
         this.dataValues.map((value, i) => {
            if (i == 0) {
               return textarea.value = `- ${value}`;
            }
            textarea.value = `${textarea.value}\n- ${value}`;
         })
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
   }

   styling() {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(styles.toString());
      this.shadowRoot.adoptedStyleSheets = [sheet];
   }

   setupEventListener() {
      // this.listener = new Listener(this);
      // this.addEventListener("click", this.listener);
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

   async connectedCallback() {
      await this.render();
      this.styling();
      this.setupEventListener();
   }

   attributeChangedCallback(name, oldValue, newValue) {
      switch(name) {
         case "data-values":
            const values = JSON.parse(newValue || "{}");
            let textarea;
            textarea = this.shadowRoot.querySelector("textarea");
            if (textarea) {
               values.map((value, i) => {
                  if (i == 0) {
                     return this.shadowRoot.querySelector("textarea").value = `- ${value}`;
                  }
                  this.shadowRoot.querySelector("textarea").value = `${this.shadowRoot.querySelector("textarea").value}\n- ${value}`;
               })
            }
            
            break;
      }
   }
}

registerCustomElement("custom-textarea", CustomTextarea);
