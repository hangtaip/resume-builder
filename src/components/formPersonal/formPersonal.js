import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import styles from "./formPersonal.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faImage, faPlus } from "@fortawesome/free-solid-svg-icons";
import { registry } from "../../js/functionRegistry.js";
import eventManager from "../../js/eventManager.js";
import objectRegistry from "../../js/objectRegistry.js";

export default class FormPersonal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = new Map();
    this.isReadyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    this.listener;
    this.customEventData = {
      await: false,
      awaitDetail() {
        return 0;
      },
      eventName: "handleCustomEvent",
      details: "",
    };
    this.unsubscribe;
    library.add(faImage, faPlus);
  }

  async connectedCallback() {
    this.render().then(() => {
      this.resolveReady();
    });
    this.setValueRequestDetail();
    this.publishCustomEvent(this.customEventData);
    this.styling();
    this.setupEventListener();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  async render() {
    const dom = `
         <div class="container">
            <fieldset>
               <legend>Personal Details</legend>
               <div class="view">
                 ${this.customInput()} 
               </div>
            </fieldset>
         </div>
         `;

    this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);
    // await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  customInput() {
    const image = icon(faImage, {
      classes: ["fa-image", "icon"],
    });

    const plus = icon(faPlus, {
      classes: ["fa-plus", "icon"],
    });

    return `
      <custom-input 
         title="Name" 
         data-title='["Name"]' 
         data-attr='["name"]'
         data-placeholder='["Ali"]' 
         data-id='["hf_name"]'
         data-width='["20"]'
      />
         <label for="hf_name" slot="label_0">Name</label>
      </custom-input> 
      <custom-input 
         title="Title" 
         data-title='["Title"]' 
         data-attr='["title"]'
         data-placeholder='["Waiter"]' 
         data-id='["hf_title"]'
         data-width='["20"]'
      />
         <label for="hf_title" slot="label_0">Title</label>
      </custom-input>
      <custom-input 
         title="email" 
         data-title='["email"]' 
         data-attr='["email"]'
         data-placeholder='["ali@emailProvider.com"]' 
         data-id='["hf_email"]'
         data-width='["20"]'
      />
         <label for="hf_email" slot="label_0">Email</label>
      </custom-input>
      <custom-input 
         title="github" 
         data-title='["github"]' 
         data-attr='["github"]'
         data-placeholder='["https://github.com/ali"]' 
         data-id='["hf_github"]'
         data-width='["20"]'
      />
         <label for="hf_github" slot="label_0">Github</label>
      </custom-input>
      <custom-input 
         title="yob" 
         data-title='["yob"]' 
         data-attr='["yob"]'
         data-placeholder='["1993"]' 
         data-id='["hf_yob"]'
         data-width='["20"]'
      />
         <label for="hf_yob" slot="label_0">Year Of Birth</label>
      </custom-input>
      <custom-input 
         title="tel" 
         data-title='["tel"]' 
         data-attr='["tel"]'
         data-placeholder='["012-345-6789/012-3456-7890"]' 
         data-id='["hf_tel"]'
         data-width='["20"]'
      />
         <label for="hf_tel" slot="label_0">Telephone</label>
      </custom-input>
      <custom-input 
         title="country_code" 
         data-title='["country_code"]' 
         data-attr='["country_code"]'
         data-placeholder='["my"]' 
         data-id='["hf_country_code"]'
         data-width='["20"]'
      />
         <label for="hf_country_code" slot="label_0">Country Code</label>
      </custom-input>
      <custom-input 
         title="location" 
         data-title='["location"]' 
         data-attr='["location"]'
         data-placeholder='["Malaysia"]' 
         data-id='["hf_location"]'
         data-width='["20"]'
      />
         <label for="hf_location" slot="label_0">Location</label>
      </custom-input>
      <custom-input 
         title="objective" 
         data-title='["objective"]' 
         data-attr='["seek"]'
         data-placeholder='["Manager"]' 
         data-id='["hf_seek"]'
         data-width='["20"]'
      />
         <label for="hf_seek" slot="label_0">Position Applied</label>
      </custom-input>
      <custom-input 
         title="Motto" 
         data-title='["Motto"]' 
         data-attr='["motto"]'
         data-placeholder='["To live is to serve!"]' 
         data-id='["hf_motto"]'
         data-width='["20"]'
      />
         <label for="hf_motto" slot="label_0">Motto</label>
      </custom-input> 
      <pimage>
        <custom-input
          title="image"
          class="upload-img dropable"
          data-attr='["image"]'
          data-class='["hidden changeable upload-img"]'
          data-title='["image"]'
          data-input-type='["file"]'
          data-id='["hf_image"]'
        />
          <div class="img_block">
             <div class="img_add_block">${plus.node[0].outerHTML}</div>
             <loading-block></loading-block>
             <img alt="upload image" src="https://placehold.co/600x400" class="img-uploaded">
          </div>
          <button type="button" class="clickable upload-btn" title="Upload Image">${image.node[0].outerHTML}</button>
         <label for="hf_image" slot="label_0">Image</label>
        </custom-input>
      </pimage>   
    `;
  }

  styling() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles.toString());
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.listener.setDelegates(this);
    this.listener.setDelegates(this.shadowRoot.querySelector(".upload-btn"));
    this.shadowRoot.addEventListener("click", this.listener);
    // this.shadowRoot.querySelector(".upload-img").dataset.event=`${this.generateUploadEvent()}`;
    this.shadowRoot.querySelector(".upload-img").dataset.event =
      `${this.generateEvents()}`;
    // document.addEventListener("importDataLoaded", this.listener);
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
        case elem.classList.contains("upload-btn"):
          this.shadowRoot
            .querySelector(".upload-img")
            .shadowRoot.querySelector(".upload-img")
            .click();
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

      Array.from(elem.querySelectorAll("custom-input")).forEach((elem) => {
        const key = JSON.parse(elem.dataset.attr)[0];
        elem.dataset.values =
          `{ "${key}": "${event.detail.data.owner[key]}"}` || "";

        if (key == "image") {
          this.shadowRoot.querySelector("img").src =
            event.detail.data.owner[key] || "https://placehold.co/600x400";
        }
      });

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
      // TODO: create a log for debug
      console.warn(
        `${this.constructor.name}: Please set default state for form before dispatch importDataLoaded event.`,
      );
    }
  }

  generateEvents() {
    return JSON.stringify(
      Object.assign(
        this.generateDropEvent(),
        this.generateUploadEvent(),
        this.generateDragoverEvent(),
        this.generateDragleaveEvent(),
      ),
    );
  }

  generateUploadEvent() {
    registry.register("change", "uploadEvent", function (event, delegated) {
      const isDOM = delegated instanceof Listener;

      if (isDOM) {
        let elem = event.target.closest(".changeable");

        if (!elem) return;
        if (!this.shadowRoot.contains(elem)) return;

        switch (true) {
          case elem.classList.contains("upload-img"):
            let reader;

            if (elem.files && elem.files[0]) {
              reader = new FileReader();

              this.querySelector("loading-block").classList.add("visible");
              reader.onload = (e) => {
                this.querySelector("loading-block").classList.remove("visible");
                const otherSlot = this.shadowRoot
                  .querySelector("slot[class=other]")
                  .assignedElements();
                const img = otherSlot.find((elem) =>
                  elem.classList.contains("img_block"),
                );
                img.style.backgroundImage = e.target.result;
                this.closest("pimage").querySelector("img").src =
                  e.target.result;
              };
              reader.readAsDataURL(elem.files[0]);
            }
            break;
        }
      }
    });

    const obj = {
      upload: {
        event: "change",
        name: "uploadEvent",
        "switch-key": "upload-image",
        target: `this.shadowRoot.querySelector(".upload-img")`,
        context: `this.shadowRoot.querySelector(".upload-img")`,
      },
    };
    // return JSON.stringify(obj);
    return obj;
  }

  generateDropEvent() {
    registry.register("drop", "dropEvent", function (event, delegated) {
      const isDOM = delegated instanceof Listener;

      if (isDOM) {
        event.preventDefault();
        let elem = event.target.closest(".dropable");

        if (!elem) return;
        if (!this.contains(elem)) return;

        switch (true) {
          case elem.classList.contains("upload-img"):
            let reader;

            if (event.dataTransfer.items) {
              [...event.dataTransfer.items].forEach((item, i) => {
                reader = new FileReader();
                if (item.kind === "file") {
                  const file = item.getAsFile();
                  this.querySelector(".img_add_block").classList.remove(
                    "visible",
                  );
                  this.querySelector("loading-block").classList.add("visible");

                  reader.onload = (e) => {
                    this.closest("pimage").querySelector("img").src =
                      e.target.result;

                    this.querySelector("loading-block").classList.remove(
                      "visible",
                    );
                  };
                  reader.readAsDataURL(file);

                  // console.log(`...file[${i}].name = ${file.name}`);
                }
              });
            } else {
              [...event.dataTransfer.files].forEach((file, i) => {
                this.querySelector(".img_add_block").classList.remove(
                  "visible",
                );
                this.querySelector("loading-block").classList.add("visible");
                reader.onload = (e) => {
                  this.closest("pimage").querySelector("img").src =
                    e.target.result;
                  this.querySelector("loading-block").classList.remove(
                    "visible",
                  );
                };
                reader.readAsDataURL(file);
                // console.log(`... file[${i}].name = ${file.name}`);
              });
            }

            break;
        }
      }
    });

    const obj = {
      drop: {
        event: "drop",
        name: "dropEvent",
        "switch-key": "upload-image",
        target: `this.shadowRoot.querySelector(".upload-img")`,
        context: `this`,
      },
    };

    // return JSON.stringify(obj);
    return obj;
  }

  generateDragoverEvent() {
    registry.register("dragover", "dragoverEvent", function (event, delegated) {
      const isDOM = delegated instanceof Listener;

      if (isDOM) {
        let elem = event.target.closest(".dropable");

        if (!elem) return;
        if (!this.contains(elem)) return;

        this.querySelector(".img_add_block").classList.add("visible");

        event.preventDefault();
        // switch (true) {
        //   case elem.classList.contains("upload-img"):
        //     event.preventDefault();
        //     break;
        // }
      }
    });

    const obj = {
      dragover: {
        event: "dragover",
        name: "dragoverEvent",
        "switch-key": "upload-image",
        target: `this.shadowRoot.querySelector(".upload-img")`,
        context: `this`,
      },
    };

    // return JSON.stringify(obj);
    return obj;
  }

  generateDragleaveEvent() {
    registry.register(
      "dragleave",
      "dragleaveEvent",
      function (event, delegated) {
        const isDOM = delegated instanceof Listener;

        if (isDOM) {
          let elem = event.target.closest(".dropable");

          if (!elem) return;
          if (!this.contains(elem)) return;

          this.querySelector(".img_add_block").classList.remove("visible");

          event.preventDefault();
        }
      },
    );

    const obj = {
      dragleave: {
        event: "dragleave",
        name: "dragleaveEvent",
        "switch-key": "upload-image",
        target: `this.shadowRoot.querySelector(".upload-img")`,
        context: `this`,
      },
    };

    // return JSON.stringify(obj);
    return obj;
  }

  setValueRequestDetail() {
    this.customEventData.await = false;
    this.customEventData.eventName = "valueRequest";
    this.customEventData.details = {
      [this.tagName.toLowerCase()]:
        this.shadowRoot.querySelectorAll("custom-input"),
    };
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

registerCustomElement("form-personal", FormPersonal);
