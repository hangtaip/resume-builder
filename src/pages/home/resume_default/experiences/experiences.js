import DOMPurify from "dompurify";
import Listener from "../../../../js/listener.js";
import { isNullUndefinedOrEmpty } from "../../../../js/helper.js";
// import yaml from "../../data/data.yaml";
import { registerCustomElement } from "../../../../js/registerComponent.js";
// import styles from "./experiences.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faLaptopCode } from "@fortawesome/free-solid-svg-icons";
import TraceDom from "../../../../js/traceDom.js";
import eventManager from "../../../../js/eventManager.js";
import objectRegistry from "../../../../js/objectRegistry.js";

export default class UserExperiences extends HTMLElement {
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
    this.customEventData = {
      await: false,
      awaitDetail() {
        return 0;
      },
      eventName: "handleCustomEvent",
      details: "",
    };
    this.styleType = this.dataset.style || "default";
    this.handleFillResumeComponent = this.handleFillResumeComponent.bind(this);
    this.unsubscribe;
    library.add(faLaptopCode);
  }

  connectedCallback() {
    this.setupEventListener();
    this.render().then(() => {
      this.resolveReady();
    });
    this.styling();
    // this.timeline();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  genExpList(exp) {
    return exp.desc
      .map(
        (item) => {
          if (!isNullUndefinedOrEmpty(item)) {
            return ` 
              <li>${item}</li>
            `}
          }
      )
      .join("");
  }

  async render() {
    const i = icon(faLaptopCode, {
      classes: ["fa-laptop-code"],
    });

    const dom = `
        <div class="container">
          <h3 class="header">
            ${i.node[0].outerHTML}
            <span class="title">Experiences</span>
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
    let tl = "";

    const expsDom = Object.values(data).toReversed()
      .map((exp) => {
        if (!isNullUndefinedOrEmpty(exp.tl_from) && !isNullUndefinedOrEmpty(exp.tl_to)) {
          tl = `<span class="tl">${exp.tl_from} - ${exp.tl_to}</span>`;
        } else if (!isNullUndefinedOrEmpty(exp.tl_from) && isNullUndefinedOrEmpty(exp.tl_to)) {
          tl = `<span class="tl">${exp.tl_from} - current</span>`;
        }

        return `
          <div class="card">
            <div class="header">
              <span class="pos">${exp.pos}</span>
              <span class="org">${exp.org}</span>
              ${tl}  
            </div>
            <div class="body">
              <ul>
                ${this.genExpList(exp)}
              </ul>
            </div>
          </div>
        `;
      });

    const container = new DOMParser().parseFromString(DOMPurify.sanitize(expsDom.join(" ")), "text/html");
    const fragments = new DocumentFragment();
    while(container.body.firstChild) {
      fragments.append(container.body.firstChild);
    }
    this.shadowRoot.querySelector(".container").append(fragments);
  }

  async styling() {
    const sheet = new CSSStyleSheet();
    // sheet.replaceSync(styles);
        // sheet.replaceSync(styles.toString());
    // styles.use({target: this.shadowRoot});
    const style = await import(`./experiences-${this.styleType}.shadow.scss`);
    sheet.replaceSync(style.default);

    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  setupEventListener() {
    this.listener = new Listener(this);
    this.listener.setDelegates(this);
    this.unsubscribe = eventManager.subscribe("fillResumeComponent", this.listener);
  }

  async handleFillResumeComponent(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      this.appendData(event.detail.data.owner.exp);

      await new Promise(resolve => requestAnimationFrame(() => resolve())).then(() => {
      this.resolveFormRequestReady();
    });
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

  // timeline() {
  //   const container = this.shadowRoot.querySelector(".container");
  //   const trace = new TraceDom(container);
  //   trace.measure();
  // } 
}

//customElements.define('user-experiences', UserExperiences);
registerCustomElement("user-experiences", UserExperiences);
