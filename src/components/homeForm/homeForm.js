import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import { loadComponent } from "../../js/helper.js";
import styles from "./homeForm.shadow.scss";

export default class HomeForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.listener;
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
        path: "formEducation/formEducation.js",
        tagName: "form-education",
        folderType: "components",
      },
      {
        path: "formExperience/formExperience.js",
        tagName: "form-experience",
        folderType: "components",
      },
    ];
  }

  async connectedCallback() {
    await this.loadComponents();
    this.render();
    this.styling();
    this.setupEventListener();
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
               <form-education></form-education> 
               <form-skills></form-skills> 
               <form-experience></form-experience> 
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

  handleClick(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      event.preventDefault();
      // this.event();
    } else {
      console.log("external");
    }
  }
}

registerCustomElement("home-form", HomeForm);
