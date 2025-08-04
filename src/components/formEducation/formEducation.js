import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import styles from "./formEducation.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
import yaml from "../../data/data.yaml";
import eventManager from "../../js/eventManager.js";
import objectRegistry from "../../js/objectRegistry.js";

export default class FormEducation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.listener;
    this.customEventData = {
      await: false,
      awaitDetail() { return 0 },
      eventName: "handleCustomEvent",
      details: "",
    };
    this.unsubscribe;
    library.add(faRectangleXmark);
  }

  render() {
    const dom = `
         <div class="container">
            <fieldset>
               <legend>Education</legend>
               <div class="view">
                 <button type="button" class="clickable add-btn" title="Add education">Add</button>
                 ${this.customInput()} 
               </div>
            </fieldset>
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
    this.listener.setDelegates(this);
    this.listener.setDelegates(this.shadowRoot.querySelector(".add-btn"));
    this.shadowRoot.addEventListener("click", this.listener);
    this.shadowRoot.addEventListener("transitionend", this.listener);
    // this.shadowRoot.addEventListener("input", this.listener);
    this.unsubscribe = eventManager.subscribe(
      "importDataLoaded",
      this.listener,
    );
  }

  handleClick(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      let elem = event.target.closest(".clickable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      switch (true) {
        case elem.classList.contains("add-btn"):
          const dom = this.customInput();
          const newEdu = new DOMParser()
            .parseFromString(DOMPurify.sanitize(dom), "text/html")
            .body.querySelector("custom-input");

          this.shadowRoot.querySelector("fieldset .view").append(newEdu);
          this.setValueRequestDetail();
          this.publishCustomEvent(this.customEventData);

          break;
        case elem.classList.contains("delete-btn"):
          if (this.shadowRoot.querySelectorAll("custom-input").length > 1) {
            elem.closest("custom-input").classList.add("removing");

            // TODO: create event once instead of every click
            // elem.closest("custom-input").addEventListener("transitionend", () => {
            //   elem.closest("custom-input").remove();
            // }, { once: true });
          }
          // this.shadowRoot.querySelectorAll("custom-input").length <= 1
          //   || elem.closest("custom-input").remove();
          break;
      }
    } else {
      console.log("external");
    }
  }

  handleTransitionend(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      let elem = event.target.closest(".transitionable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      switch (true) {
        case elem.tagName.toLowerCase() == "custom-input":
          if (elem.classList.contains("removing")) {
            elem.remove();
            this.setValueRequestDetail();
            this.publishCustomEvent(this.customEventData);
          }
          break;
      }
    } else {
      console.log("external");
    }
  }

  handleImportDataLoaded(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      let elem = this.shadowRoot.querySelector(".view");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      let inputs = "";
      const existingInputs = this.shadowRoot.querySelectorAll("custom-input");

      // TODO: handle null
      Object.values(event.detail.data.owner.edu).forEach((edu, i) => {
        // inputs += this.customInput(`["${skill.name}","${skill.color}"]`);
        if (existingInputs[i]) {
          return (this.shadowRoot.querySelector("custom-input").dataset.values =
            JSON.stringify(edu));
        }
        inputs += this.customInput(edu);
      });
      const input = new DOMParser().parseFromString(inputs, "text/html");
      const fragments = new DocumentFragment();
      while (input.body.firstChild) {
        fragments.append(input.body.firstChild);
      }

      this.shadowRoot.querySelector(".view").append(fragments);

      this.importComplete();

      this.setValueRequestDetail();
      this.publishCustomEvent(this.customEventData);
    } else {
      console.log("external");
    }
  }

  importComplete() {
    if (objectRegistry.registry.has("formLoaded")) {
      const readyCnt = objectRegistry.get("formLoaded").get("readyCnt") + 1;
      const formCnt = objectRegistry.get("formLoaded").get("formCnt");
      objectRegistry.get("formLoaded").set("readyCnt", readyCnt); 

      if (readyCnt == formCnt) {
        this.customEventData.await = false;
        this.customEventData.awaitDetail = () => {
          return 0;
        };
        this.customEventData.eventName = "stopLoading";
        this.customEventData.details = {};
        this.publishCustomEvent(this.customEventData);
      }
    } else {
      console.warn(`${this.constructor.name}: Please set default state for formLoaded before dispatch importDataLoaded event.`);
    }
  }

  testDataInsert() {
    let inputs = "";
    const existingInputs = this.shadowRoot.querySelectorAll("custom-input");

    Object.values(yaml.owner.edu).forEach((edu, i) => {
      if (existingInputs[i]) {
        return (this.shadowRoot.querySelector("custom-input").dataset.values =
          JSON.stringify(edu));
      }
      inputs += this.customInput(edu);
    });
    const input = new DOMParser().parseFromString(inputs, "text/html");
    const fragments = new DocumentFragment();
    while (input.body.firstChild) {
      fragments.append(input.body.firstChild);
    }

    this.shadowRoot.querySelector(".view").append(fragments);
  }

  customInput(data = "") {
    const xMark = icon(faRectangleXmark, {
      classes: ["fa-xMark", "icon"],
    });

    return `
      <custom-input 
        title="edu" 
        class="transitionable"
        data-title='["field", "uni"]' 
        ${Object.entries(data).length > 1 ? `data-values='${JSON.stringify(data)}'` : ""}
        data-attr='["field", "alma"]'
        data-placeholder='["Certificate in Housemanship", "ABC College"]' 
        data-id='["hf_edu_field", "hf_edu_uni"]'
        data-width='["20","20"]'
     />
        <label for="hf_edu_field" slot="label_0">Field</label>
        <label for="hf_edu_uni" slot="label_1">Institute</label>
        <button class="clickable delete-btn" type="button" title="Remove education">${xMark.node[0].outerHTML}</button> 
     </custom-input>
    `;
  }

  setValueRequestDetail() {
    this.customEventData.await = false;
    this.customEventData.eventName = "valueRequest";
    this.customEventData.details = { "form-education": this.shadowRoot.querySelectorAll("custom-input") }
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

  connectedCallback() {
    this.render();
    this.setValueRequestDetail();
    this.publishCustomEvent(this.customEventData);
    this.styling();
    this.setupEventListener();
    // this.testDataInsert();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }
}

registerCustomElement("form-education", FormEducation);
