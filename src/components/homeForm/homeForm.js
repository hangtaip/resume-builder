import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import { loadComponent } from "../../js/helper.js";
import styles from "./homeForm.shadow.scss";
import eventManager from "../../js/eventManager.js";

export default class HomeForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.listener;
    this.customEventData = {
      await: false,
      awaitDetail() {
        return 0;
      },
      eventName: "handleCustomEvent",
      details: "",
    };
    this.compList = [
      {
        path: "customInput/customInput.js",
        tagName: "custom-input",
        folderType: "components",
      },
      {
        path: "customTextarea/customTextarea.js",
        tagName: "custom-textarea",
        folderType: "components",
      },
      ,
      {
        path: "formPersonal/formPersonal.js",
        tagName: "form-personal",
        folderType: "components",
      },
      {
        path: "formSkills/formSkills.js",
        tagName: "form-skills",
        folderType: "components",
      },
      {
        path: "formEducations/formEducations.js",
        tagName: "form-educations",
        folderType: "components",
      },
      {
        path: "formExperiences/formExperiences.js",
        tagName: "form-experiences",
        folderType: "components",
      },
    ];
  }

  async connectedCallback() {
    await this.loadComponents();
    this.render();
    this.styling();
    this.setupEventListener();
    this.componentReady();
  }

  async loadComponents() {
    const subComponents = [
      customElements.get("custom-input"),
      customElements.get("custom-textarea"),
      customElements.get("form-personal"),
      customElements.get("form-skills"),
      customElements.get("form-education"),
      customElements.get("form-experience"),
    ];

    const validSubComponents = subComponents.filter(
      (comp) => comp && typeof comp === "function",
    );

    if (validSubComponents.length > 0) {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    } else {
      const compPromises = loadComponent(this.compList);
      await Promise.all(compPromises);
    }
  }

  render() {
    const dom = `
         <div class="container">
            <form>
               <form-personal></form-personal>
               <form-educations></form-educations> 
               <form-skills></form-skills> 
               <form-experiences></form-experiences> 
            </form>
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
    // this.addEventListener("click", this.listener);
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

  async componentReady() {
    const subComponents = [
      this.shadowRoot.querySelector("form-personal"),
      this.shadowRoot.querySelector("form-skills"),
      this.shadowRoot.querySelector("form-educations"),
      this.shadowRoot.querySelector("form-experiences"),
    ];

    const validSubComponents = subComponents.filter(comp => comp && typeof comp.isReadyPromise === "object");

    if (validSubComponents.length > 0) {
      await Promise.all(validSubComponents.map(comp => comp.isReadyPromise));
    } else {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    const fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();
    await Promise.all([fontPromise]);   

    this.shadowRoot.querySelector(".container").classList.add("visible");

    this.customEventData.await = false;
    this.customEventData.awaitDetail = () => {
      return 0;
    };
    this.customEventData.eventName = "stopLoading";
    this.customEventData.details = {};
    this.publishCustomEvent(this.customEventData);
  }
}

registerCustomElement("home-form", HomeForm);
