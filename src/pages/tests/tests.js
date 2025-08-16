import DOMPurify from 'dompurify';
import Listener from "../../js/listener";
import { registerCustomElement } from "../../js/registerComponent.js";
import styles from "./tests.shadow.scss";
import { loadComponent } from '../../js/helper';
import data from "../../data/data.yaml";
import eventManager from '../../js/eventManager.js';

export default class Tests extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.listener;
      this.template = document.createElement("template");
      this.dataset.templateStyle = "classic";
      this.customEventData = {
         await: false,
         awaitDetail() {
           return 0;
         },
         eventName: "handleCustomEvent",
         details: "",
      };
   }

   async connectedCallback() {
      this.setup();
      await this.loadComponents();
      this.render();
   }

   setup() {

      this.compList = [
         {
            path: `home/resume_${this.dataset.templateStyle}/resume_${this.dataset.templateStyle}.js`,
            tagName: `resume-${this.dataset.templateStyle}`,
            folderType: "pages",
         }
      ];

      this.template.innerHTML = `
         <div class="container">
            <resume-${this.dataset.templateStyle} data-template-style="${this.dataset.templateStyle}"></resume-${this.dataset.templateStyle}>
         </div>
      `;
   }

   async loadComponents() {
      const subComponents = [
         customElements.get(`resume-${this.dataset.templateStyle}`),
      ];

      const validSubComponents = subComponents.filter(comp => comp && typeof comp === "function");

      if (validSubComponents.length > 0) {
         await new Promise(resolve => requestAnimationFrame(() => resolve()));
      } else {
         const compPromises = loadComponent(this.compList);
         await Promise.all(compPromises);
      }
   }

   render() {
      this.shadowRoot.append(this.template.content.cloneNode(true));

      this.customEventData.await = false;
       this.customEventData.awaitDetail = () => { return 0; };
       this.customEventData.eventName = "completeFormRequest";
       this.customEventData.details = { data: data }
       this.publishCustomEvent(this.customEventData);
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
}

registerCustomElement("resume-tests", Tests);
