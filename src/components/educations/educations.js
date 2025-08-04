import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
// import yaml from "../../data/data.yaml";
import { registerCustomElement } from "../../js/registerComponent.js";
// import styles from "./educations.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import eventManager from "../../js/eventManager.js";
import objectRegistry from "../../js/objectRegistry.js";

export default class UserEducations extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.isReadyPromise = new Promise(resolve => {
      this.resolveReady = resolve;
    });
    this.formRequestPromise = new Promise(resolve => {
      this.resolveFormRequestReady = resolve;
    });
    this.listener;
    this.unsubscribe;
    this.styleType = this.dataset.style || "default";
    this.customEventData = {
      await: false,
      awaitDetail() {
        return 0;
      },
      eventName: "handleCustomEvent",
      details: "",
    };
    this._lastObservedSize = null;
    this._sameSizeFrameCount = 0;
    this._animationFrameId = null;
    this._pendingSize = null;

    this.handleCompleteFormRequest = this.handleCompleteFormRequest.bind(this);
    this.handleTransitionend = this.handleTransitionend.bind(this);
    library.add(faUserGraduate);
  }

  connectedCallback() {
    this.setupEventListener();
    // this.testRender();
    this.render().then(() => {
      this.resolveReady();
    });
    this.styling();
    // this.setupGenericEventListener();
  }

  disconnectedCallback() {
    this.unsubscribe();
    this.abortGenericEventListener(); 
  }

  async render() {
    const i = icon(faUserGraduate, {
      classes: ["fa-user-graduate"],
    });

    const dom = `
      <div class="container">
        <h3 class="header">
          ${i.node[0].outerHTML}
          <span class="title">Education</span>
        </h3> 
      </div>
    `;

    this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);

    const images = this.shadowRoot.querySelectorAll("img");
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { 
        img.onload = resolve; 
        img.onerror = resolve; 
      });
    });

    await Promise.all(imagePromises);
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  appendData(data) {
    const eduDom = Object.values(data).map(edu => {
      return `
        <div class="field-group">
          <div class="card field">
            <span class="body" data-attr="field">${edu.field}</span>
          </div>
          <div class="card field">
            <span class="body" data-attr="uni">${edu.alma}</span>
          </div>
        </div>
      `;
    })
    eduDom.unshift('<div class="body">');
    eduDom.push("</div>");

    const container = new DOMParser().parseFromString(DOMPurify.sanitize(eduDom.join(" ")), "text/html");
    const fragments = new DocumentFragment();
    while (container.body.firstChild) {
      fragments.append(container.body.firstChild);
    }
    this.shadowRoot.querySelector(".container").append(fragments);
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.listener.setDelegates(this);
    this.unsubscribe = eventManager.subscribe("completeFormRequest", this.listener);
  }

 setupGenericEventListener() {
    this.shadowRoot.addEventListener("transitionend", this.listener);
    // resizeObserver.observe(this);
  } 

  abortGenericEventListener() {
    this.shadowRoot.removeEventListener("transitionend", this.listener); 
    // resizeObserver.unobserve(this);
    // stopStabilizationCheck(this);
  }

  async styling() {
    const sheet = new CSSStyleSheet();
    // sheet.replaceSync(styles);
    // sheet.replaceSync(styles.toString());
    // styles.use({ target: this.shadowRoot });
    const style = await import(`./educations-${this.styleType}.shadow.scss`);
    sheet.replaceSync(style.default);
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  async handleCompleteFormRequest(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      this.appendData(event.detail.data.owner.edu);

      if (Object.keys(event.detail.data.owner.edu).length > 1) {
        this.customEventData.await = false;
        this.customEventData.awaitDetail = () => {
          return 0;
        }
        this.customEventData.eventName = "updateEduStyle";
        this.customEventData.details = { data: event.detail.data.owner.edu };
        this.publishCustomEvent(this.customEventData);

        await new Promise(resolve => requestAnimationFrame(() => resolve())).then(() => {
          this.resolveFormRequestReady();
        });
      }
    } else {
      console.log("external");
    }
  } 

  handleTransitionend(event, delegated) {
    // console.log(event);
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
      console.error(`Failed to publish ${data.eventName}:`, err);
    }
  }

  // testRender() {
  //   const i = icon(faUserGraduate, {
  //     classes: ["fa-user-graduate"],
  //   });
  //
  //   const dom = `
  //     <div class="container">
  //       <h3 class="header">
  //         ${i.node[0].outerHTML}
  //         <span class="title">Education</span>
  //       </h3>
  //       <div class="body">
  //         <div class="card field">
  //           <span class="body">${yaml.owner.edu.field}</span>
  //         </div>
  //         <div class="card uni">
  //           <span class="body">${yaml.owner.edu.uni}</span>
  //         </div>
  //       <div>
  //     </div>
  //   `;
  //
  //   this.shadowRoot.innerHTML = DOMPurify.sanitize(dom);
  // }  
}

registerCustomElement("user-educations", UserEducations);
