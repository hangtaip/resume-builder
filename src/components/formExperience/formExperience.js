import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import styles from "./formExperience.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faRectangleXmark } from "@fortawesome/free-solid-svg-icons";
// import yaml from "../../data/data.yaml";
import eventManager from "../../js/eventManager.js";
import objectRegistry from "../../js/objectRegistry.js";

export default class FormExperience extends HTMLElement {
  static observedAttributes = ["data-values"];

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
    this.dataValues;
    library.add(faRectangleXmark);
  }

  render() {
    const dom = `
     <div class="container">
        <fieldset>
           <legend>Experiences</legend>
           <div class="view">
              <button class="clickable add-btn" type="button" title="Add experience">Add</button>
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
          const newExp = new DOMParser()
            .parseFromString(DOMPurify.sanitize(dom), "text/html")
            .body.querySelector("div.container");
          this.shadowRoot.querySelector("fieldset .view").append(newExp);

          this.setValueRequestDetail();
          this.publishCustomEvent(this.customEventData);
          break;
        case elem.classList.contains("add-desc-btn"):
          const domDesc = this.customInputDescription();
          const newDesc = new DOMParser()
            .parseFromString(DOMPurify.sanitize(domDesc), "text/html")
            .body.querySelector("custom-textarea");
          this.shadowRoot.querySelector("fieldset.desc").append(newDesc); 
          break;
        case elem.classList.contains("delete-btn"):
          if (elem.closest("fieldset.desc")) {
            if (
              elem.closest("fieldset.desc").querySelectorAll("custom-textarea")
                .length > 1
            ) {
              elem.closest("custom-textarea").classList.add("removing");
            }
            // elem.closest("fieldset.desc").querySelectorAll("custom-textarea").length <= 1
            // || elem.closest("custom-textarea").remove();
          } else {
            if (
              this.shadowRoot.querySelectorAll(".container.list").length > 1
            ) {
              elem.closest(".container.list").classList.add("removing");
            }
            // this.shadowRoot.querySelectorAll(".container.list").length <= 1
            // || elem.closest(".container.list").remove();
          }
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
        case elem.matches(".container.list.removing"):
          elem.remove();
          this.setValueRequestDetail();
          this.publishCustomEvent(this.customEventData);
          break;
        case elem.matches("custom-textarea.removing"):
          elem.remove();
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
      const existingInputs =
        this.shadowRoot.querySelectorAll(".container.list");

      Object.values(event.detail.data.owner.exp).forEach((exp, i) => {
        if (existingInputs[i]) {
          return Object.keys(exp).map((key) => {
            if (this.shadowRoot.querySelector(`input[data-attr="${key}"]`)) {
              this.shadowRoot.querySelector(`input[data-attr="${key}"`).value =
                exp[key];
            }

            if (key == "desc") {
              this.shadowRoot.querySelector("custom-textarea").dataset.values =
                JSON.stringify(exp[key]);
            }
          });
        }
        inputs += this.customInput(exp);
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
    const existingInputs = this.shadowRoot.querySelectorAll(".container.list");
    Object.values(yaml.owner.exp).forEach((exp, i) => {
      // inputs += this.customInput(`["${skill.name}","${skill.color}"]`);
      if (existingInputs[i]) {
        return Object.keys(exp).map((key) => {
          if (this.shadowRoot.querySelector(`input[data-attr="${key}"]`)) {
            this.shadowRoot.querySelector(`input[data-attr="${key}"`).value =
              exp[key];
          }

          if (key == "desc") {
            this.shadowRoot.querySelector("custom-textarea").dataset.values =
              JSON.stringify(exp[key]);
          }
        });
      }
      inputs += this.customInput(exp);
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
     <div class="container list transitionable">
        <div class="form-group">
          <div class="form-group-item">
            <label for="hf_exp_org">Organisation</label>
            <input type="text" title="organisation" placeholder="ABC Restaurant" id="hf_exp_org" data-width="20" data-attr="org" 
            ${data.org && data.org.length > 0 ? `value="${data.org}"` : ""}
          >
          </div>
          <div class="form-group-item">
            <label for="hf_exp_pos">Position</label>
            <input type="text" title="position" placeholder="Waiter" id="hf_exp_pos" data-width="20" data-attr="pos" 
            ${data.pos && data.pos.length > 0 ? `value="${data.pos}"` : ""}
            >
          </div>
          <div class="form-group-item">
            <fieldset class="duration">
              <legend>Duration</legend>
                <div class="form-group">
                  <div class="form-group-item">
                    <label for="hf_exp_tl_from">From</label>
                    <input type="month" title="duration" placeholder="01/2024" id="hf_exp_tl" data-width="10" data-attr="tl_from" 
                    ${data.tl_from && data.tl_from.length > 0 ? `value="${data.tl_from}"` : ""}
                  >
                  </div>
                  <div class="form-group-item">
                    <label for="hf_exp_tl">To</label>
                    <input type="month" title="duration" placeholder="12/2024" id="hf_exp_tl" data-width="10" data-attr="tl_to" 
                    ${data.tl_to && data.tl_to.length > 0 ? `value="${data.tl_to}"` : ""}
                    >
                </div>
              </div>
            </fieldset>
          </div>
          <div class="form-group-item">
            <fieldset class="desc">
              <legend>Description</legend>
              ${this.customInputDescription(data.desc)} 
            </fieldset>
          </div>
        </div>
        <button class="clickable delete-btn" type="button" title="Remove experiecnce">${xMark.node[0].outerHTML}</button>
     </div>
    `;
    {
      /* <button class="clickable add-desc-btn" type="button" title="Add description">Add</button> */
    }
    // return `
    //  <button class="clickable add-btn" type="button" title="Add education">Add</button>
    //
    //   <custom-input
    //      title="experience"
    //      data-input-type='["text", "text", "month", "text"]'
    //      data-title='["organisation", "position", "duration", "description"]'
    //      data-placeholder='["ABC Restaurant", "Waiter", "01/2024-12/2024", "Learn table etiquette"]'
    //      data-id='["hf_exp_org", "hf_exp_pos", "hf_exp_tl", "hff_exp_desc"]'
    //    />
    //      <label for="hf_exp_org" slot="label_0">Organisation</label>
    //      <label for="hf_exp_pos" slot="label_1">Position</label>
    //      <label for="hf_exp_tl" slot="label_2">Duration</label>
    //      <label for="hf_exp_desc" slot="label_3">Description</label>
    //      <button class="clickable delete-btn" type="button" title="Remove education" slot="button_3">${xMark.node[0].outerHTML}</button>
    //    </custom-input>
    // `;
  }

  customInputDescription(data = "") {
    const xMark = icon(faRectangleXmark, {
      classes: ["fa-xMark", "icon"],
    });

    return `
      <custom-textarea
        title="description"
        ${Object.entries(data).length > 1 ? `data-values='${JSON.stringify(data).replace(/'/g, "&#39;")}'` : ""}
        class="transitionable"
        data-title='["description"]'
        data-attr='["desc"]'
        data-placeholder='["Learn table etiquette"]'
        data-id='["hf_exp_desc"]'
      >
      </custom-textarea>
    `;

    {
      /* <button class="clickable delete-btn" type="button" title="Remove description">${xMark.node[0].outerHTML}</button> */
    }
  }

  setValueRequestDetail() {
    this.customEventData.await = false;
    this.customEventData.eventName = "valueRequest";
    this.customEventData.details = { [this.tagName.toLowerCase()]: this.shadowRoot.querySelectorAll(".container.list > .form-group") };
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

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "data-values":
        const values = JSON.parse(newValue || "{}");
        let input;
        Object.entries(values).forEach((value) => {
          input = this.shadowRoot.querySelector(
            `input[data-attr="${value[0]}"]`,
          );
          if (input) {
            switch (input.type) {
              case "text":
                input.value = value[1];
                break;
              case "color":
                const hexColor = `#${value[1].toString().replace(/^#/, "")}`;
                input.value = hexColor;
                break;
            }
          }
        });

        break;
    }
  }
}

registerCustomElement("form-experience", FormExperience);
