import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import { registerCustomElement } from "../../js/registerComponent";
import { loadComponent } from "../../js/helper.js";
import styles from "./customAside.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import {
  faFileArrowUp,
  faFileArrowDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import selectIcon from "../../assets/imgs/icons/done_outline.svg?raw";
import browseIcon from "../../assets/imgs/icons/browse.svg?raw";
import buildIcon from "../../assets/imgs/icons/build.svg?raw";
import imgNotAvailable from "../../assets/imgs/img_not_available.svg";
import yaml from "js-yaml";
import eventManager from "../../js/eventManager.js";
import dataBase from "../../data/data-base.yaml";
import ShadowParser from "../../js/shadowParser.js";
import objectRegistry from "../../js/objectRegistry.js";

export default class CustomAside extends HTMLElement {
  static observedAttributes = [
    "data-container-class-add",
    "data-container-class-remove",
  ];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.dataset.state;
    this.state = new Map();
    this.listener; 
    this.imgBlob;
    this.parser = new ShadowParser();
    this.customEventData = {
      await: false,
      awaitDetail() {
        return 0;
      },
      eventName: "handleCustomEvent",
      details: "",
    };
    this.formValues = new Map();
    this.componentMap = {
      "home-form": () => import("../../components/homeForm/homeForm.js"),
      // "template-default": () =>
      //   import("../../pages/home/resume_default/resume_default.js"),
      // "template-classic": () =>
      //   import("../../pages/home/resume_classic/resume_classic.js"),
      "getTemplate": (template) =>
        import(`../../pages/home/resume_${template}/resume_${template}.js`),
    };
    this.dataContainerClass = JSON.parse(this.dataset.containerClass || "{}");
    library.add([faFileArrowUp, faFileArrowDown, faXmark]);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "data-container-class-add":
        this.processContainerClass("+", newValue);
        break;
      case "data-container-class-remove":
        this.processContainerClass("-", newValue);
        break;
    }
  }
  async connectedCallback() {
    this.setupEventListener();
    await this.render();
    this.styling();
    this.setupGenericEventListener();
    this.stateManagement();
  } 

  disconnectedCallback() {
    this.unsubscribe();
  }

  async render() {
    const xMark = icon(faXmark, {
      classes: ["fa-xMark", "icon"],
    });

    const dom = `
         <div class="container transitionable${
           this.dataContainerClass.length > 0
             ? ` ${this.dataContainerClass.reduce((p, c) => {
                 return `${p} ${c}`;
               })}`
             : ""
         }"
         >
            <aside class="asideBase">
                <aside-top>
                  <div class="aside_app_title">
                    Resume Builder
                  </div>
                  <button class="clickable close-btn" title="close" type="button">${xMark.node[0].outerHTML}
                  </button>
                </aside-top>
                <btn-group>
                  <button class="clickable template-btn" title="template" type="button" data-target="template">
                     <div class="btn-inner">
                       <div class="aside-item-icon hoverShow">${selectIcon}</div>
                       <div class="aside-item-icon hoverHide">${browseIcon}</div>
                       <div class="aside-item-text" data-text="Template">
                         <span class="textbox">Template</span>
                       </div>
                     </div>
                  </button>
                  <button class="clickable custom-btn" title="custom" type="button" data-target="custom">
                     <div class="btn-inner">
                       <div class="aside-item-icon hoverShow">${selectIcon}</div>
                       <div class="aside-item-icon hoverHide">${buildIcon}</div>
                       <div class="aside_item_text" data-text="Custom">
                         <span class="textbox">Custom</span>
                       </div>
                     </div>
                  </button>
                </btn-group>
                <options>
                  ${await this.setTemplateOptions()}
                  ${this.setCustomOptions()}
                </options> 
            </aside>
         </div>
         `;

    // innerHTML for first render

    this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);

    // document fragmnet for subsequent update
    // const container = new DOMParser().parseFromString(DOMPurify.sanitize(dom), "text/html");
    // const fragments = new DocumentFragment();
    // while (container.body.firstChild) {
    //   fragments.append(container.body.firstChild);
    // }
    // this.shadowRoot.append(fragments);
    //
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  styling() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles.toString());
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  async stateManagement() {
    objectRegistry.set("custom-aside", this.state);
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.listener.setDelegates(this); 
    this.shadowRoot.addEventListener("transitionstart", this.listener);
    this.subscribe = eventManager.subscribe(["valueRequest", "resumeRendered"], this.listener);
  }

  setupGenericEventListener() {
    this.shadowRoot.addEventListener("click", this.listener);
    this.shadowRoot.addEventListener("change", this.listener);
    this.shadowRoot.addEventListener("pointerover", this.listener);
    this.shadowRoot.addEventListener("pointerout", this.listener);
    this.shadowRoot.querySelector(".template-list-buttons").addEventListener("scroll", this.listener);
  }

  async handleClick(event, delegated) {
    const isDOM = delegated instanceof Listener;
    let data;

    if (isDOM) {
      let elem = event.target.closest(".clickable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      switch (true) {
        case elem.classList.contains("template-btn"):
          if (elem.classList.contains("selected")) return;

          this.shadowRoot
            .querySelectorAll("btn-group button")
            .forEach((button) => {
              button.classList.remove("selected");
              this.shadowRoot
                .querySelector(`.${button.dataset.target}-options`)
                .classList.toggle("transparent");
            });
          Array.from(
            this.shadowRoot.querySelectorAll(
              `.options-group:not(.${elem.dataset.target}-options)`,
            ),
          ).map((node) => node.classList.add("transparent"));
          elem.classList.add("selected");

          this.customEventData.await = false;
          this.customEventData.awaitDetail = () => {
            return 0;
          };
          this.customEventData.eventName = "startLoading";
          this.customEventData.details = {};
          this.publishCustomEvent(this.customEventData);

          this.customEventData.await = true;
          this.customEventData.awaitDetail = () => {
            return this.componentMap["home-form"]();
          };
          this.customEventData.eventName = "homeFormLoaded";
          this.customEventData.details = { elementName: "home-form" };
          this.publishCustomEvent(this.customEventData);
          // const page = await import("../../components/homeForm/homeForm.js");
          // const view = document.createElement("home-form");
          // this.shadowRoot.querySelector(".view").append(view);
          // console.log(view);

          this.state.set("btn-group", "template-btn");
          this.stateManagement();
          break;
        case elem.classList.contains("custom-btn"):
          if (elem.classList.contains("selected")) return;
          this.shadowRoot
            .querySelectorAll("btn-group button")
            .forEach((button) => {
              button.classList.remove("selected");
              this.shadowRoot
                .querySelector(`.${button.dataset.target}-options`)
                .classList.toggle("transparent");
            });
          Array.from(
            this.shadowRoot.querySelectorAll(
              `.options-group:not(.${elem.dataset.target}-options)`,
            ),
          ).map((node) => node.classList.add("transparent"));
          elem.classList.add("selected");

          this.state.set("btn-group", "custom-btn");
          this.stateManagement();
          break;
        case elem.classList.contains("upload-btn"):
          this.shadowRoot.querySelector(".upload-file").click();
          break;
        case elem.classList.contains("export-btn"):
          data = structuredClone(this.collectForm());
          data.owner.image = this.imgBlob;
          const yamlStr = yaml.dump(data);
          const blob = new Blob([yamlStr], { type: "text/yaml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");

          a.href = url;
          a.download = "data.yaml";
          a.click();
          URL.revokeObjectURL(url);
          break;
        case elem.classList.contains("close-btn"):
          const customAsideValues = this.dataset.containerClassAdd;
          this.dataset.containerClassRemove = customAsideValues;

          this.customEventData.await = false;
          this.customEventData.awaitDetail = () => {
            return 0;
          };
          this.customEventData.eventName = "toggleNavbar";
          this.customEventData.details = { className: "navbar_sidebar_show" };
          this.publishCustomEvent(this.customEventData);
          break;
        case elem.classList.contains("template-item-btn"):
          data = this.collectForm();

          if (!customElements.get(`resume-${elem.dataset.attr}`)) {
            await this.componentMap["getTemplate"](elem.dataset.attr);
          };
          // this.templateLoaded.push
          // if (elem.classList.contains("selected")) return;

          // TODO: create global store to store click node -> check there and remove
          elem
            .closest(".template-list-buttons")
            .querySelectorAll(".template-list-button button")
            .forEach((button) => {
              button.classList.remove("selected");
            });

          elem.classList.add("selected");
          this.shadowRoot.querySelector(".tooltip").hidePopover(); 

          this.customEventData.await = false;
          this.customEventData.awaitDetail = () => {
            return 0;
          };
          this.customEventData.eventName = "startLoading";
          this.customEventData.details = {};
          this.publishCustomEvent(this.customEventData);
 
          // render resume component
          this.customEventData.await = false;
          this.customEventData.awaitDetail = () => { return 0; };
          this.customEventData.eventName = "appendResume";
          this.customEventData.details = { resumeStyle: elem.dataset.attr };
          this.publishCustomEvent(this.customEventData); 

          // the flow should be: load component -> subscribe -> publish
          // currently, i am publishing -> component loaded -> subscribe
          // fill data
          this.customEventData.await = false;
          this.customEventData.awaitDetail = () => { return 0; };
          this.customEventData.eventName = "completeFormRequest";
          this.customEventData.details = { data: data }
          this.publishCustomEvent(this.customEventData);

          // fill data
          // this.customEventData.await = false;
          // this.customEventData.awaitDetail = () => { return 0; };
          // this.customEventData.eventName = "showPreview";
          // this.customEventData.details = {}
          // this.publishCustomEvent(this.customEventData);

          // const node = document.querySelector("resume-home");
          // const dialog = this.parser.searchNode(node, "tagName", "dialog");
          // dialog.showModal();
          this.state.set("template-list-buttons", `${elem.dataset.attr}-btn`);
          this.stateManagement();
          break;
        default:
          break;
      }
    } else {
      console.log("external");
    }
  }

  handleChange(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      let elem = event.target.closest(".changeable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      switch (true) {
        case elem.classList.contains("upload-file"):
          // TODO: remove this and use components isReady 
          let state = new Map();
          state.set("formCnt", 4);
          state.set("readyCnt", 0);
          objectRegistry.set("formLoaded", state);

          this.customEventData.await = false;
          this.customEventData.awaitDetail = () => {
            return 0;
          };
          this.customEventData.eventName = "startLoading";
          this.customEventData.details = {};
          this.publishCustomEvent(this.customEventData);
 
          let reader;

          if (elem.files && elem.files[0]) {
            reader = new FileReader();

            reader.onload = (e) => {
              const data = yaml.load(e.target.result);

              this.customEventData.await = false;
              this.customEventData.awaitDetail = () => {
                return 0;
              };
              this.customEventData.eventName = "importDataLoaded";
              this.customEventData.details = { data };
              this.publishCustomEvent(this.customEventData); 
            };
            reader.readAsText(elem.files[0]);
            elem.value = null;
          } 
          break;
      }
    } else {
      console.log("external");
    }
  }

  handleValueRequest(event, delegated) {
    const isDOM = delegated instanceof Listener;
    let target;
    let currValue;

    if (isDOM) {
      Object.keys(event.detail).forEach((key) => {
        if (key == "form-personal") {
          event.detail[key].forEach((customInput) => {
            target = customInput.shadowRoot.querySelector("input");
            this.formValues.set(target.dataset.attr, customInput);
          });
        } else if (key == "form-educations") {
          if (
            this.formValues.get("edu")?.length == undefined ||
            event.detail[key].length > this.formValues.get("edu")?.length
          ) {
            event.detail[key].forEach((customInput) => {
              currValue = this.formValues.get("edu") || [];

              if (!currValue.some((value) => value === customInput)) {
                this.formValues.set("edu", [...currValue, customInput]);
              }
            });
          } else if (
            this.formValues.get("edu")?.length > event.detail[key].length
          ) {
            this.formValues.set("edu", []);
            event.detail[key].forEach((customInput) => {
              this.formValues.set("edu", [
                ...this.formValues.get("edu"),
                customInput,
              ]);
            });
          }
        } else if (key == "form-skills") {
          if (
            this.formValues.get("skills")?.length == undefined ||
            event.detail[key].length > this.formValues.get("skills")?.length
          ) {
            event.detail[key].forEach((customInput) => {
              currValue = this.formValues.get("skills") || [];

              if (!currValue.some((value) => value === customInput)) {
                this.formValues.set("skills", [...currValue, customInput]);
              }
            });
          } else if (
            this.formValues.get("skills")?.length > event.detail[key].length
          ) {
            this.formValues.set("skills", []);
            event.detail[key].forEach((customInput) => {
              this.formValues.set("skills", [
                ...this.formValues.get("skills"),
                customInput,
              ]);
            });
          }
        } else if (key == "form-experiences") {
          if (
            this.formValues.get("exp")?.length == undefined ||
            event.detail[key].length > this.formValues.get("exp")?.length
          ) {
            event.detail[key].forEach((customInput) => {
              currValue = this.formValues.get("exp") || [];

              if (!currValue.some((value) => value === customInput)) {
                this.formValues.set("exp", [...currValue, customInput]);
              }
            });
          } else if (
            this.formValues.get("exp")?.length > event.detail[key].length
          ) {
            this.formValues.set("exp", []);
            event.detail[key].forEach((customInput) => {
              this.formValues.set("exp", [
                ...this.formValues.get("exp"),
                customInput,
              ]);
            });
          }
        }
      });
    } else {
      console.log("external");
    }
  }

  handleResumeRendered(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      this.customEventData.await = false;
      this.customEventData.awaitDetail = () => { return 0; };
      this.customEventData.eventName = "showPreview";
      this.customEventData.details = {}
      this.publishCustomEvent(this.customEventData);     
    } else {
      console.log("external");
    }
  }

  handlePointerover(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const elem = event.target.closest(".hoverable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      const tooltip = this.shadowRoot.querySelector(".tooltip");
      tooltip.querySelector("loading-block").classList.add("visible");

      tooltip.style.setProperty("--tooltip-anchor-name", elem.closest(".template-list-button").style.getPropertyValue("--tooltip-anchor-name"));
      tooltip.showPopover({ source: elem });

      tooltip.querySelector("img").src = elem.dataset.src;
      tooltip.querySelector("img").onload = (e) => {
        tooltip.querySelector("loading-block").classList.remove("visible");
      };
      tooltip.querySelector("img").onerror = (e) => {
        tooltip.querySelector("loading-block").classList.remove("visible")
        tooltip.querySelector("img").src = imgNotAvailable;
        tooltip.querySelector("img").alt = "No image found";
      }
    } else {
      console.log("external");
    }
  }

  handlePointerout(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const elem = event.target.closest(".hoverable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      this.shadowRoot.querySelector(`.tooltip`).hidePopover();
    } else {
      console.log("external");
    }
  }

  handleScroll(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const elem = event.target.closest(".scrollable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      const tooltip = this.shadowRoot.querySelector(".tooltip");

      if (tooltip.matches(":popover-open")) {
        tooltip.hidePopover();
      }
      
    } else {
      console.log("external");
    }
  }

  handleTransitionstart(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const elem = event.target.closest(".transitionable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;
      if (event.target != elem) return;

      this.shadowRoot
        .querySelectorAll("btn-group button")
        .forEach((button) => {
          button.classList.remove("selected"); 
        });
 
      objectRegistry.get("custom-aside").forEach((value, key) => {
        switch(key) {
          case "btn-group":
            Array.from(
              this.shadowRoot.querySelectorAll(
                `.options-group:not(.${this.shadowRoot.querySelector(`${key} .${value}`).dataset.target}-options)`,
              ),
            ).map((node) => node.classList.add("transparent"));

            this.shadowRoot.querySelector(`${key} .${value}`).classList.add("selected");
            this.shadowRoot.querySelector(`.${this.shadowRoot.querySelector(`${key} .${value}`).dataset.target}-options`)
                .classList.remove("transparent");
            break;
          case "template-list-buttons":
            // console.log(this.shadowRoot.querySelector(`.${key} .${value}`));
            this.shadowRoot.querySelector(`.${key} .${value}`)
            .closest(".template-list-buttons")
            .querySelectorAll(".template-list-button button")
            .forEach((button) => {
              button.classList.remove("selected");
            });

            this.shadowRoot.querySelector(`.${key} .${value}`).classList.add("selected");
            break;
        }
      });

    } else { 
      console.log("external"); 
    }
  }

  // export form to yaml
  // upload yaml to session storage
  async setTemplateOptions() {
    // TODO:
    // - show template choice
    // - enable 3 save history
    // - print btn
    const arrowUpIcon = icon(faFileArrowUp, {
      classes: ["fa-arrow-up", "icon"],
    });

    const arrowDownIcon = icon(faFileArrowDown, {
      classes: ["fa-arrow-down", "icon"],
    });

    return `
      <div class="options-group template-options transparent">
        <div class="template-options_item">
          <button class="template-item clickable upload-btn" title="Upload" type="button">
            <div class="template-item-icon">${arrowUpIcon.node[0].outerHTML}</div>
            <div class="template-item-text">Upload file</div>
            <input type="file" accept=".yaml,.yml" title="Upload file" class="hidden changeable upload-file"></input>
          </button>
          <button class="template-item clickable export-btn" title="Export" type="button">
            <div class="template-item-icon">${arrowDownIcon.node[0].outerHTML}</div>
            <div class="template-item-text">Export file</div>
          </button>
        </div>
        <div class="template-options-item">
          ${await this.setTemplateList()}
        </div>
      </div>
    `;
  }

  async setTemplateList() {
    const lists = [
      {
        name: "classic",
        // img: "../../pages/home/resume_classic/sample.png",
        // img: () => import(
        //     /* webpackChunkNames: "template-example-[request]" */
        //     /* webpackPrefetch: true */
        //     "../../pages/home/resume_classic/sample.png"
        //   )
        path: "resume_classic/sample.png",
      },
      {
        name: "default",
        // img: "../../assets/imgs/templates/resume_default/sample.png",
        // img: () => import(
        //     /* webpackChunkNames: "template-example-[request]" */
        //     /* webpackPrefetch: true */
        //     "../../pages/home/resume_default/sample.png"
        //   )
        path: "resume_default/sample.png",
      },
      // {
      //   name: "default",
      //   img: "../../assets/imgs/templateImg_default.jpg",
      // },
      // {
      //   name: "default",
      //   img: "../../assets/imgs/templateImg_default.jpg",
      // },
      // {
      //   name: "default",
      //   img: "../../assets/imgs/templateImg_default.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
      // {
      //   name: "classic",
      //   img: "../../assets/imgs/templateImg_classic.jpg",
      // },
    ];


    // const img = await import(
    //   /* webpackChunkNames: "template-example-[request]" */
    //   /* webpackPrefetch: true */
    //   "../../pages/home/resume_default/sample.png"
    // );
    
    // const imgPromises = lists.map(async (list) => {
    //   try {
    //     const imageModule = await list.img();
    //     return imageModule.default;
    //   } catch (error) {
    //     console.warn(`Failed to load image for template "${list.name}". Using fallback.`);
    //     return imgNotAvailable;
    //   }
    // });
    const imgPromises = lists.map(list => this.loadImageWithFallback(list.path));
 
    try {
      const images = await Promise.all(imgPromises);
      // const finalLists = lists.map((list, index) => ({
      //   ...list,
      //   image: images[index],
      // }));
      lists.forEach((list, index) => {
        list.imagePath = images[index];
      });
    } catch (error) {
      console.error("Failed to load one or more images:", error);
    }

    return `
      <div class="template-list">
        <div class="template-list-text">Style</div>
          <div class="template-list-item template-list-buttons scrollable">
            ${lists
              .map((list, index) => {
                return `
                  <div class="template-list-button" style="--tooltip-anchor-name: --anchor-${list.name}-${index}">
                    <button class="clickable hoverable template-item-btn ${list.name}-btn" type="button" title="${list.name}" popovertarget="mypopover" data-attr="${list.name}" data-src="${list.imagePath}">${list.name}
                    </button> 
                  </div>
              `;
              })
              .join("")}
          </div>
        <tooltip class="tooltip" popover="hint">
          <div class="tooltip-group">
            <loading-block></loading-block>
            <img alt="Template Image" src="" loading="lazy">
          </div>
        </tooltip>
      </div>
    `;
  }

  async loadImageWithFallback(path) {
    try {
        const imageModule = await import(/* webpackIgnore: false */ `../../pages/home/${path}`);
        return imageModule.default;
    } catch (error) {
      console.warn(`Could not find image at path "${path}". Using fallback.`);
      return imgNotAvailable;
    }
  }

  setCustomOptions() {
    // TODO:
    // - show field
    return `
      <div class="options-group custom-options transparent">
        <div>I am custom options</div>
      </div>
    `;
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

  processContainerClass(action, classNames) {
    const arr = JSON.parse(classNames).sort();
    const target = this.shadowRoot.querySelector(".container");

    if (action == "+") {
      arr.forEach((className) => target.classList.add(className));
    } else if (action == "-") {
      arr.forEach((className) => target.classList.remove(className));
    }

    // objectRegistry.get("custom-aside").forEach((value, key) => {
    //   console.log(this.shadowRoot.querySelector(key));
    // });
    //
    // this.customEventData.await = false;
    // this.customEventData.awaitDetail = () => { return 0; };
    // this.customEventData.eventName = "customAsideState";
    // this.customEventData.details = { "state": this.state };
    // this.publishCustomEvent(this.customEventData);
  }

  collectForm() {
    const template = structuredClone(dataBase);
    let obj;
    let currNode;

    this.formValues.forEach((value, key) => {
      switch (key) {
        case "edu":
        case "skills":
          obj = {};
          value.map((customInput, i) => {
            obj[i + 1] = {};
            Array.from(
              customInput.shadowRoot.querySelectorAll("input"),
            ).forEach((node) => {
              obj[i + 1][node.dataset.attr] = node.value;
            });
          });
          template.owner[key] = obj;
          break;
        // case "skills":
        //   obj = {};
        //   value.map((customInput, i) => {
        //     obj[i+1] = {};
        //     Array.from(customInput.shadowRoot.querySelectorAll("input")).forEach(node => {
        //       obj[i+1][node.dataset.attr] = node.value;
        //     });
        //   });
        //   template.owner[key] = obj;
        //   break;
        case "exp":
          obj = {};
          let textarea;

          value.map((customInput, i) => {
            obj[i + 1] = {};
            Array.from(
              customInput.querySelectorAll(".form-group-item"),
            ).forEach((node) => {
              if (node.querySelector("input")) {
                currNode = node.querySelector("input");
                obj[i + 1][currNode.dataset.attr] = currNode.value;
              } else if (node.querySelector("custom-textarea")) {
                currNode = node.querySelector("custom-textarea");
                textarea = currNode.shadowRoot.querySelector("textarea");
                obj[i + 1][textarea.dataset.attr] = [];

                textarea.value.split(/[\r\n\t]+/g).forEach((value, ii) => {
                  obj[i + 1][textarea.dataset.attr][ii] = value.slice(2).trim();
                });
              }
            });
          });
          template.owner[key] = obj;
          break;
        default:
          template.owner[key] = value.getInputValue();
          if (key == "image") {
            template.owner[key] = new Blob([JSON.stringify({ data: value.querySelector("img").src}, null, 2)],  { type: "application/json" });
            this.imgBlob = value.querySelector("img").src;
          }
          break;
      }
    });

    return template;
  } 
}

registerCustomElement("custom-aside", CustomAside);
