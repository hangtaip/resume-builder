import eventManager from "./eventManager";

class ResizeObserverManager {
  constructor() {
    this.observedContainer = new Map();
    this.observedContainerInverse = new WeakMap();
    this.stabilizationPromises = new Map();
    this.activePromises = new Map();

    this.resizeObserver = new ResizeObserver(this._handleEntries.bind(this));
    this.eventConfig = {
      eventName: "resizeObserverComplete",
      details: {},
    };

    // console.log("ResizeObserverManager: Initialized singleton.");
  }

  register(component, element) {
    if (!component || !element) {
      console.error(
        `${this.constructor.name}: Both component and element must be provided for registration.`,
      );
      return;
    }

    if ((!component._observedStates) instanceof Map) {
      console.error(
        `${this.constructor.name}: Component ${component.id || component.tagName} does not implement the required properties (_observedStates).`,
        component,
      );
      return;
    }

    if (!this.observedContainer.has(component)) {
      this.observedContainer.set(component, new Set());
    }

    this.observedContainer.get(component).add(element);
    this.observedContainerInverse.set(element, component);
    this.resizeObserver.observe(element);

    if (!this.stabilizationPromises.has(component)) {
      this.stabilizationPromises.set(component, new Map());
    }
  }

  delete(component, element) {
    const observedElementsSet = this.observedContainer.get(component);

    if (observedElementsSet) {
      observedElementsSet.delete(element);
      if (observedElementsSet.size === 0) {
        this.observedContainer.delete(component);
      }
    }

    if (this.observedContainerInverse.has(element)) {
      this.observedContainerInverse.delete(element);
    }

    this.resizeObserver.unobserve(element);

    const promises = this.stabilizationPromises.get(component);
    if (promises) {
      promises.delete(element); 
    }
  }

  deleteAll(component) {
    const observedElementsSet = this.observedContainer.get(component);

    if (observedElementsSet) {
      [...observedElementsSet].forEach((element) => {
        this.delete(component, element);
      });
    }

    this.stabilizationPromises.delete(component);
    this.activePromises.delete(component);
  }

  startStabilizationCheck = (component, target) => {
    const state = component._observedStates.get(target);

    if (state && state.animationFrameId === null) {
      state.animationFrameId = requestAnimationFrame(() =>
        this.checkSizeStability(component, target),
      );
    }
  };

  stopStabilizationCheck = (component, target) => {
    const state = component._observedStates.get(target);

    if (state && state.animationFrameId !== null) {
      cancelAnimationFrame(target.animationFrameId);
      state.animationFrameId = null;
    }
  };

  checkSizeStability = (component, target) => {
    const state = component._observedStates.get(target);

    if (!state) return;

    const currentReact = target.getBoundingClientRect();
    const currentWidth = currentReact.width;
    const currentHeight = currentReact.height;

    if (
      !state.lastObservedSize ||
      Math.round(currentWidth) !== Math.round(state.lastObservedSize.width) ||
      Math.round(currentHeight) !== Math.round(state.lastObservedSize.height)
    ) {
      state.sameSizeFrameCount = 0;
      state.lastObservedSize = { width: currentWidth, height: currentHeight };
    } else {
      state.sameSizeFrameCount++;
    }

    if (state.sameSizeFrameCount >= 5) {
      this.stopStabilizationCheck(component, target);
      state.lastObservedSize = { width: currentWidth, height: currentHeight };
      state.pendingSize = null;

      this.notifyElementStabilized(component, target, {
        width: currentWidth,
        height: currentHeight,
      });
    } else {
      state.animationFrameId = requestAnimationFrame(() =>
        this.checkSizeStability(component, target),
      );
    }
  };

  notifyElementStabilized(component, stabilizedElement, finalSize) {
    const promises = this.stabilizationPromises.get(component);

    if (promises && promises.has(stabilizedElement)) {
      const state = component._observedStates.get(stabilizedElement);
      if (state && state.resolveStabilization) {
        state.resolveStabilization(finalSize);
        state.resolveStabilization = null;
        promises.delete(stabilizedElement);

        if (promises.size === 0) {
          const overallResolve = this.activePromises.get(component);

          if (overallResolve && typeof overallResolve === "function") {
            overallResolve(component);
            this.activePromises.delete(component);
          }
        }
        // this._checkAndPublish(component, finalSize);
      }
    }
  }

  _handleEntries(entries) {
    for (const entry of entries) {
      const componentInstance = this.observedContainerInverse.get(entry.target);

      if (componentInstance) {
        this._initStabilization(componentInstance, entry);
      } else {
        console.warn(
          `${this.constructor.name}: No component instance found for observed element:`,
          entry.target,
        );
      }
    }
  }

  _initStabilization(component, entry) {
    const targetElement = entry.target;
    const { width, height } = entry.contentRect;
    const state = component._observedStates.get(targetElement);

    if (state) {
      state.pendingSize = { width, height };
      state.sameSizeFrameCount = 0; 

      const promises = this.stabilizationPromises.get(component);

      let promise = promises.get(targetElement);

      if (!promise || state.resolveStabilization === null) {
        promise = new Promise((resolve) => {
          state.resolveStabilization = resolve;
        });
        promises.set(targetElement, promise);
      }

      if (!this.activePromises.has(component)) {
        const overallPromise = new Promise((resolve) => {
          this.activePromises.set(component, resolve);
        });

        overallPromise
          .then((resolvedComponent) => {
            const details = Array.from(
              resolvedComponent._observedStates.entries(),
            )
              .filter(([el, state]) => state.lastObservedSize)
              .map(([el, state]) => ({
                element: el,
                id: el.id || el.dataset.attr || el.constructor.name,
                width: Math.round((state.lastObservedSize.width + Number.EPSILON) * 100) / 100,
                height: Math.round((state.lastObservedSize.height + Number.EPSILON) * 100) / 100,
              }));

            this._publishStabilizationComplete(
              resolvedComponent,
              details,
            );

            this.activePromises.delete(resolvedComponent);
          })
          .catch((error) => {
            console.error(
              `${this.constructor.name}: Overall component stabilization promise for ${component.id || component.tagName} failed:`,
              error,
            );
          });
      }

      this.startStabilizationCheck(component, targetElement);
    }
  }

  _checkAndPublish(component, lastStableSize) {
    const promises = this.stabilizationPromises.get(component);
    if (!promises || promises.size === 0) {
      return;
    }

    const promisesArr = Array.from(promises.values());

    Promise.all(promisesArr)
      .then(() => {
        this._publishStabilizationComplete(component, lastStableSize);
        this.stabilizationPromises.delete(component);
      })
      .catch((error) => {
        console.error(
          `ResizeObserverManager: Promise.all for component ${component.id || component.tagName} failed:`,
          error,
        );
      });
  }

  _publishStabilizationComplete(component, stabilizedDetails) {
    const detail = {
      // componentId: component.id || component.tagName,
      // target: component,
      // finalSize: finalSize,
      stabilizedElements: stabilizedDetails,
    };

    const eventDetail = {
      bubbles: true,
      composed: true,
      detail: detail,
    };

    eventManager.publish(this.eventConfig.eventName, eventDetail);
  }
}

export class StabilizationState {
  constructor() {
    this.lastObservedSize = null;
    this.sameSizeFrameCount = 0;
    this.animationFrameId = null;
    this.pendingSize = null;
    this.resolveStabilization = null;
  }
}

// const observedElementToComponentMap = new WeakMap();
//
// const globalCustomEventData = {
//   await: false,
//   awaitDetail() {
//     return 0;
//   },
//   eventName: "resizeObserverComplete",
//   details: "",
// }
//
// const globalPublishCustomEvent = async (data) => {
//   try {
//     if (data.await) {
//       await data.awaitDetail();
//     }
//
//     const eventDetail = {
//       bubbles: true,
//       composed: true,
//       detail: data.details,
//     };
//
//     eventManager.publish(data.eventName, eventDetail);
//   } catch (err) {
//     console.error(`Failed to publish ${data.eventName}:`, err);
//   }
// }
//
// export const registerResizeObservation = (component, element) => {
//   observedElementToComponentMap.set(element, component);
//   resizeObserver.observe(element);
// };
//
// export const  = (element) => {
//   if (observedElementToComponentMap.has(element)) {
//     resizeObserver.unobserve(element);
//     observedElementToComponentMap.delete(element);
//   }
// };
//
// const resizeObserver = new ResizeObserver((entries) => {
//   for (const entry of entries) {
//     const componentInstance = observedElementToComponentMap.get(entry.target);
//
//     if (componentInstance) {
//       _handleObservedResize(componentInstance, entry);
//     } else {
//       console.warn(
//         `ResizeObserver: No component instance or handler found for observed element:`,
//         entry.target,
//       );
//     }
//     // const { width, height } = entry.contentRect;
//     // entry.target._pendingSize = { width, height };
//     // entry.target._sameSizeFrameCount = 0;
//
//     // startStabilizationCheck(entry.target._resizeTargets);
//   }
// });
//
// const _handleObservedResize = (component, entry) => {
//   const targetElement = entry.target;
//   const { width, height } = entry.contentRect;
//   const state = component._observedStates.get(targetElement);
//
//   if (state) {
//     state.pendigSize = { width, height };
//     state.sameSizeFrameCount = 0;
//     startStabilizationCheck(component, targetElement);
//   }
// };
//
// const startStabilizationCheck = (component, target) => {
//   const state = component._observedStates.get(target);
//
//   if (state && state.animationFrameId === null) {
//     state.animationFrameId = requestAnimationFrame(() =>
//       checkSizeStability(component, target),
//     );
//   }
// };
//
// export const stopStabilizationCheck = (component, target) => {
//   const state = component._observedStates.get(target);
//
//   if (state && state.animationFrameId !== null) {
//     cancelAnimationFrame(target.animationFrameId);
//     state.animationFrameId = null;
//   }
// };
//
// const checkSizeStability = (component, target) => {
//   const state = component._observedStates.get(target);
//
//   if (!state) return;
//
//   const currentReact = target.getBoundingClientRect();
//   const currentWidth = currentReact.width;
//   const currentHeight = currentReact.height;
//
//   if (
//     !state.lastObservedSize ||
//     Math.round(currentWidth) !== Math.round(state.lastObservedSize.width) ||
//     Math.round(currentHeight) !== Math.round(state.lastObservedSize.height)
//   ) {
//     state.sameSizeFrameCount = 0;
//     state.lastObservedSize = { width: currentWidth, height: currentHeight };
//   } else {
//     state.sameSizeFrameCount++;
//   }
//
//   if (state.sameSizeFrameCount >= 5) {
//     console.log(target);
//     console.log(currentWidth);
//     stopStabilizationCheck(component, target);
//     state._lastObservedSize = { width: currentWidth, height: currentHeight };
//     state._pendingSize = null;
//   } else {
//     state._animationFrameId = requestAnimationFrame(() =>
//       checkSizeStability(component, target),
//     );
//   }
// };

export default new ResizeObserverManager();
