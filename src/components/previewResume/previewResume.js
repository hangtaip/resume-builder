import DOMPurify from "dompurify";
import Listener from "../../js/listener.js";
import ShadowParser from "../../js/shadowParser.js";
import { registerCustomElement } from "../../js/registerComponent.js";
import styles from "./previewResume.shadow.scss";
import { icon, library } from "@fortawesome/fontawesome-svg-core";
import { faSquareXmark } from "@fortawesome/free-solid-svg-icons";
import eventManager from "../../js/eventManager.js";
import objectRegistry from "../../js/objectRegistry.js";
import "../printBtn/printBtn.js";

export default class PreviewResume extends HTMLElement {
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
    this.unsubscribe;
    library.add(faSquareXmark);
  }

  connectedCallback() {
    this.render();
    this.styling();
    this.setupEventListener();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  render() {
    const mark = icon(faSquareXmark, { classes: ["fa-x-mark"] });
    const dom = `
         <div class="container">
            <dialog class="clickable print-dlg visibility-none">
               <button class="clickable cancel-btn" title="cancel" type="button">
                  ${mark.node[0].outerHTML}
               </button>
               <form>
                  <fieldset>
                     <legend>Preview</legend>
                     <article class="printable">
                     </article>
                  </fieldset>
               </form>
               <print-btn></print-btn>
            </dialog>
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
    // this.listener.setDelegates(this.shadowRoot.querySelector(".cancel-btn"));
    // this.listener.setDelegates(
    //   this.shadowRoot.querySelector(`input[type="radio"]`),
    // );
    this.shadowRoot.addEventListener("click", this.listener);
    this.shadowRoot.addEventListener("change", this.listener);
    this.shadowRoot.querySelector("dialog").addEventListener("close", this.listener);
    this.subscribe = eventManager.subscribe(["appendResume", "showPreview", "printResume", "previewVisible"] , this.listener);
  }

  handleClick(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      let elem = event.target.closest(".clickable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      const dialog = this.shadowRoot.querySelector("dialog");

      switch (true) {
        case elem.classList.contains("cancel-btn"):
          dialog.close();
          break;
        case elem.classList.contains("print-dlg"):
          const compStyle = window.getComputedStyle(dialog);

          if (
            event.x < dialog.getBoundingClientRect().left ||
            event.x > dialog.getBoundingClientRect().right ||
            event.y < dialog.getBoundingClientRect().top ||
            event.y > dialog.getBoundingClientRect().bottom
          ) {
            dialog.close();
          }
          break;
      }
    } else {
      console.log("external");
    }
  }

  handleClose(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      this.shadowRoot.querySelector("dialog").classList.add("visibility-none", "closing");
    } else {
      console.log("external");
    }
  }

  handleAppendResume(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const elem = this.shadowRoot.querySelector("article");
      const page = document.createElement(`resume-${event.detail.resumeStyle}`);
      // const page = document.createElement("resume-default");
      page.dataset.templateStyle = event.detail.resumeStyle;
      // const newElem = elem.cloneNode(true);
      const newElem = document.createElement("article");
      newElem.classList.add("printable");
      newElem.append(page);
      elem.parentNode.replaceChild(newElem, elem);

      // setTimeout(() => {
      //   this.shadowRoot.querySelector("dialog").showModal();
      // },100);
    } else { 
      console.log("external"); 
    }
  } 

  handleShowPreview(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      this.shadowRoot.querySelector("dialog").showModal(); 
    } else {
      console.log("external");
    }
  }

  handlePreviewVisible(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const dialog = this.shadowRoot.querySelector("dialog");
      if (!dialog.classList.contains("closing")) {
        dialog.classList.remove("visibility-none");

        this.customEventData.await = false;
        this.customEventData.awaitDetail = () => { return 0; };
        this.customEventData.eventName = "stopLoading";
        this.customEventData.details = {}
        this.publishCustomEvent(this.customEventData);

        return 0;
      } else {
        dialog.classList.remove("closing");
      }
    } else {
      console.log("external");
    }
  }

  handlePrintResume(event, delegated) {
    const isDOM = delegated instanceof Listener;

    if (isDOM) {
      const elem = this.shadowRoot.querySelector(".printable");

      if (!elem) return;
      if (!this.shadowRoot.contains(elem)) return;

      this.setPrint();
 
    } else {
      console.log("external");
    }
  }

  setPrint() {
    const parser = new ShadowParser();
    const content = parser.cloneNode(this.shadowRoot.querySelector("article.printable"));
    const cssRules = [...parser.sheet.cssRules].map(rule => rule.cssText).join("\n");

    const iframe = document.createElement("iframe"); 
    iframe.style.display = "none";
    // iframe.style.height = "100%";
    // iframe.style.width = "100%";
    // iframe.style.position = "absolute";
    // iframe.style.left = "-9999px";
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }

    iframe.contentDocument.write(`
      <!DOCTYPE html>
        <head>
          <title>Print</title>
        </head>
        <body>
        </body>
      </html>
    `);
    iframe.contentDocument.body.appendChild(content);

    // need to include 
    const iframeSheet = new iframe.contentDocument.defaultView.CSSStyleSheet();
    iframeSheet.replaceSync(cssRules);
    iframe.contentDocument.adoptedStyleSheets = [iframeSheet];

    iframe.contentDocument.close();
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

registerCustomElement("preview-resume", PreviewResume);
