import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import styles from "./customInput.shadow.scss";
import { registry } from "../../js/functionRegistry.js";

export default class CustomInput extends HTMLElement {
  static observedAttributes = ["data-event", "data-values"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.listener;
    this.dataID = JSON.parse(this.dataset.id || "[]");
    this.inputCount = this.dataID.length || "1";
    this.placeHolder = JSON.parse(this.dataset.placeholder || '["Enter text"]');
    this.type = JSON.parse(this.dataset.inputType || "[]");
    this.title = this.getAttribute("title") || ["Custom Input"];
    this.dataAttr = JSON.parse(this.dataset.attr || "{}");
    this.dataFormGroupItem = JSON.parse(this.dataset.formGroupItem || "{}");
    this.dataClass = JSON.parse(this.dataset.class || "{}");
    this.dataTitle = JSON.parse(this.dataset.title || "{}");
    this.dataWidth = JSON.parse(this.dataset.width || "{}");
    this.dataValues = JSON.parse(this.dataset.values || "{}");
    this.dataEvent;
  }

  async render() {
    const dom = `
         <div class="container">
            <div class="form-group">
            ${Array.from({ length: this.inputCount }, (_, i) => {
              return `
                <div class="form-group-item ${this.dataFormGroupItem.length > 0 ? ` ${this.dataFormGroupItem[i]}` : ""}">
                  <slot name="label_${i}"></slot>
                  <input 
                     ${this.dataTitle.length > 0 ? `title="${this.dataTitle[i]}"` : 'title="field"'}
                     ${this.type.length == 0 || (this.type.length > 0 && this.type[i] == "text") ? `placeholder="${this.placeHolder[i]}"` : ""}
                     ${this.type.length > 0 ? `type="${this.type[i]}"` : 'type="text"'} 
                     ${this.dataClass.length > 0 ? `class="${this.dataClass[i]}"` : ""} 
                     ${this.dataID.length > 0 ? `id="${this.dataID[i]}_${i}"` : ""} 
                     ${this.dataAttr.length > 0 ? `data-attr="${this.dataAttr[i]}"` : ""}
                     ${this.dataWidth.length > 0 ? `data-width="${this.dataWidth[i]}"` : ""}
                  >
                </div> 
               `;
            }).join("")}
            </div>
            <slot class="other"></slot>
         </div>
         `;

    this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);

    if (Object.entries(this.dataValues).length > 0) {
      const inputs = this.shadowRoot.querySelectorAll("input"); 
      inputs.forEach(input => {
        switch (input.type) {
          case "text":
            input.value = this.dataValues[input.dataset.attr];
            break;
          case "color":
            const hexColor = `#${this.dataValues[input.dataset.attr].toString().replace(/^#/, "")}`;
            input.value = hexColor;
            break;
        }
        
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  styling() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles.toString());
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  setupEventListener() {
    this.listener = new Listener(this);
    Object.values(JSON.parse(this.dataEvent)).forEach((obj) => {
      const getNode = new Function(`return ${obj.target}`).bind(this);
      const node = getNode();
      const getContext = new Function(`return ${obj.context}`).bind(this);
      const context = getContext();
      this.listener.setDelegates(node);
      context.addEventListener(obj.event, this.listener);

      // TODO: add name matching when attachTo
      registry.attachTo(obj.event, obj.name, this);
    });
    // this.listener.setDelegates(this);
    // this.listener.setDelegates(this.shadowRoot.querySelector(".upload-img"));
    // this.shadowRoot.querySelector(".upload-img").addEventListener("change", this.listener);
  }

  handleClick(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      let elem = event.target.closest(".clickable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      switch (true) {
        case elem.classList.contains("upload-btn"):
          break;
      }
    } else {
      console.log("external");
    }
  }


  // handleChange(event, delegated) {
  //   const isDOM = delegated instanceof Listener;
  //
  //   if (isDOM) {
  //     let elem = event.target.closest(".changeable");
  //
  //     if (!elem) return;
  //     if (!this.shadowRoot.contains(elem)) return;
  //
  //     switch (true) {
  //       case elem.classList.contains("upload-img"):
  //         let reader;
  //
  //         if (elem.files && elem.files[0]) {
  //           reader = new FileReader();
  //
  //           reader.onload = (e) => {
  //             this.closest("pimage").querySelector("img").src = e.target.result;
  //           };
  //           reader.readAsDataURL(this.shadowRoot.querySelector(".upload-img").files[0]);
  //         }
  //         break;
  //     }
  //   }
  // }

  getInputValue() {
    return this.shadowRoot.querySelector("input")?.value;
  }

  async connectedCallback() {
    await this.render();
    this.styling();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "data-event":
        this.dataEvent = newValue;
        this.setupEventListener();
        break;
      case "data-values":
        const values = JSON.parse(newValue || "{}");
        let input;
        Object.entries(values).forEach(value => {
          input = this.shadowRoot.querySelector(`input[data-attr="${value[0]}"]`);
          if (input) {
            switch(input.type) {
              case "text":
                input.value = value[1]
                break;
              case "color":
                const hexColor = `#${value[1].toString().replace(/^#/, "")}`;
                input.value = hexColor;
                break;
            }
          };
        });

        break;
    }
  }
}

registerCustomElement("custom-input", CustomInput);
