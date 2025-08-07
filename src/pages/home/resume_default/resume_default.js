import DOMPurify from "dompurify";
import Listener from "../../../js/listener.js";
import {
  getRegisteredCustomElements,
  registerCustomElement,
} from "../../../js/registerComponent.js";
// import resizeObserverManager, {
//   resizeObserver,
//   registerResizeObservation,
//   deleteResizeObservation,
//   stopStabilizationCheck,
//   StabilizationState} from "../../../js/resizeObserverManager.js";
import styles from "./resume_default.shadow.scss";
import eventManager from "../../../js/eventManager.js";
import objectRegistry from "../../../js/objectRegistry.js";
import resizeObserverManager, {
  StabilizationState,
} from "../../../js/resizeObserverManager.js";
import { loadComponent } from "../../../js/helper.js";

export default class ResumeDefault extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.isReadyPromise = new Promise(resolve => {
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
    this.infoElement;
    this.skillsElement;
    this.eduElement;
    this.expElement;
    this.completeFormRequestData;
    this.unsubscribe;
    this.compList = [
      {
        path: "home/resume_default/userPic/userPic.js",
        tagName: "user-pic",
        folderType: "pages",
      },
      {
        path: "home/resume_default/details/details.js",
        tagName: "user-details",
        folderType: "pages",
      },
      {
        path: "home/resume_default/skills/skills.js",
        tagName: "user-skills",
        folderType: "pages",
      },
      {
        path: "home/resume_default/educations/educations.js",
        tagName: "user-educations",
        folderType: "pages",
      },
      {
        path: "home/resume_default/experiences/experiences.js",
        tagName: "user-experiences",
        folderType: "pages",
      },
    ];

    this.template = document.createElement("template");
    this.styleToImport = "data-style=default";
    this.template.innerHTML = `
      <div class="container">
        <div class="info" data-attr="info" data-elem-type="component">
          <user-details ${this.styleToImport}></user-details>
        </div>
        <div class="skills" data-attr="skills" data-elem-type="component">
          <user-skills ${this.styleToImport}></user-skills>
        </div>
        <div class="edu" data-attr="edu" data-elem-type="component">
          <user-educations ${this.styleToImport}></user-educations>
        </div>
        <div class="exp" data-attr="exp" data-elem-type="component">
          <user-experiences ${this.styleToImport}></user-experiences>
        </div>
      </div>
    `;
  }

  async connectedCallback() {
    this.setupEventListener();
    await this.loadComponents();
    await this.render();
    this.styling();
    this.setupGenericEventListener();
    this.componentReady();
  }

  disconnectedCallback() {
    this.unsubscribe();
    this.abortGenericEventListener();
  }

  async loadComponents() {
    const compPromises = loadComponent(this.compList);
    await Promise.all(compPromises);
  }

  async render() {
    this.shadowRoot.append(this.template.content.cloneNode(true));
    // const styleToImport = "data-style=default";
    // const dom = `
    //   <div class="container">
    //     <div class="info" data-attr="info" data-elem-type="component">
    //       <user-details ${styleToImport}></user-details>
    //     </div>
    //     <div class="skills" data-attr="skills" data-elem-type="component">
    //       <user-skills ${styleToImport}></user-skills>
    //     </div>
    //     <div class="edu" data-attr="edu" data-elem-type="component">
    //       <user-educations ${styleToImport}></user-educations>
    //     </div>
    //     <div class="exp" data-attr="exp" data-elem-type="component">
    //       <user-experiences ${styleToImport}></user-experiences>
    //     </div>
    //   </div>
    // `;

    // const registeredComponents = getRegisteredCustomElements();

    // DOMPurify.addHook("uponSanitizeElement", (_, data) => {
    //   if (registeredComponents.includes(data.tagName) !== -1) {
    //     data.allowedTags[data.tagName] = true;
    //   }
    // });
    
    // const componentCnt = (dom.match(new RegExp('data-elem-type=["component"]', "g")) || []).length;
    //
    // const componentCnt = this.template.content.querySelectorAll('[data-elem-type="component"]').length;
    // let state = new Map();
    // state.set("componentCnt", componentCnt);
    // state.set("readyCnt", 0);
    // objectRegistry.set("resumeComponentLoaded", state);

    // this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);
    this.infoElement = this.shadowRoot.querySelector(".info");
    this.skillsElement = this.shadowRoot.querySelector(".skills");
    this.eduElement = this.shadowRoot.querySelector(".edu");
    this.expElement = this.shadowRoot.querySelector(".exp");

    await new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  styling() {
    const sheet = new CSSStyleSheet();
    //const cssModule = import('./details.shadow.scss');
    sheet.replaceSync(styles.toString());
    // styles.use({ target: this.shadowRoot });
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.listener.setDelegates(this); 
    this.unsubscribe = eventManager.subscribe(
      ["updateEduStyle", "resizeObserverComplete", "completeFormRequest"],
      this.listener,
    );
  }

  setupGenericEventListener() {  
    this._observedStates = new Map();
    this._observedStates.set(this, new StabilizationState());
    this._observedStates.set(this.infoElement, new StabilizationState());
    this._observedStates.set(this.eduElement, new StabilizationState());

    resizeObserverManager.register(this, this);
    resizeObserverManager.register(this, this.infoElement);
    resizeObserverManager.register(this, this.eduElement);
    // registerResizeObservation(this, this);
    // registerResizeObservation(this, this.eduElement);
  }

  abortGenericEventListener() {
    this._observedStates.forEach((state, element) => {
      resizeObserverManager.stopStabilizationCheck(this, element);
      resizeObserverManager.delete(this, element);
    });
  }

  handleUpdateEduStyle(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      this.shadowRoot
        .querySelector(".container")
        .classList.add("edu-multi-line");
    } else {
      console.log("external");
    }
  }

  handleResizeObserverComplete(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const details = event.detail.stabilizedElements;
      let sizes = {};

      details.forEach((detail) => {
        sizes[detail.id] = detail;
      });

      if (
        sizes[this.constructor.name].width ==
        sizes[this.eduElement.dataset.attr].width
      ) {
        this.eduElement.classList.add("fullWidth");
      } else {
        this.eduElement.classList.remove("fullWidth");
      }

      sizes[this.constructor.name].width ==
      sizes[this.infoElement.dataset.attr].width
        ? this.infoElement.classList.add("fullWidth")
        : this.infoElement.classList.remove("fullWidth");

      this.customEventData.await = false;
      this.customEventData.awaitDetail = () => { return 0; };
      this.customEventData.eventName = "previewVisible";
      this.customEventData.details = {}
      this.publishCustomEvent(this.customEventData);
      this.resolveReady();
    } else {
      console.log("external");
    }
  }

  handleCompleteFormRequest(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      // this.customEventData.await = false;
      // this.customEventData.awaitDetail = () => { return 0; };
      // this.customEventData.eventName = "fillResumeComponent";
      // this.customEventData.details = { data: event.detail.data }
      // this.publishCustomEvent(this.customEventData);
      this.completeFormRequestData = event.detail.data;

      if (Object.values(event.detail.data.owner.skills).length > 9) {
        this.shadowRoot.querySelector(".container").classList.add("all-fullWidth"); 
      }
    } else {
      console.log("external");
    }
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
      this.shadowRoot.querySelector("user-details"),
      this.shadowRoot.querySelector("user-skills"),
      this.shadowRoot.querySelector("user-educations"),
      this.shadowRoot.querySelector("user-experiences"),
    ];

    const validSubComponents = subComponents.filter(comp => comp && typeof comp.isReadyPromise === "object");

    if (validSubComponents.length > 0) {
      await Promise.all(validSubComponents.map(comp => comp.isReadyPromise));
    } else {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    const fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();
    await Promise.all([fontPromise]);

    this.customEventData.await = false;
    this.customEventData.awaitDetail = () => { return 0; };
    this.customEventData.eventName = "fillResumeComponent";
    this.customEventData.details = { data: this.completeFormRequestData }
    this.publishCustomEvent(this.customEventData);

    this.customEventData.await = false;
    this.customEventData.awaitDetail = () => { return 0; };
    this.customEventData.eventName = "resumeRendered";
    this.customEventData.details = {}
    this.publishCustomEvent(this.customEventData);
    this.resolveReady();
  }
}

//customElements.define('resume-home', Home);
registerCustomElement("resume-default", ResumeDefault);
