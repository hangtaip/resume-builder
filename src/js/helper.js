export function isNullUndefinedOrEmpty(value) {
  return value == null || (typeof value === "string" && value.trim().length === 0);
}

export function loadComponent(list) {
  if (!list || list.length === 0) {
    console.warn("Please provide an array of an object like { path: path-to-module, tagName: custom-comp, folderType: components }");
    return promises;
  }

  const promises = list.map(componentDetail => {
    const { path, tagName, folderType } = componentDetail;
    let importPromise; 

    switch(folderType) {
      case "components":
        importPromise = import(
          /* webpackChunkNames: "[request]" */
          /* webpackPrefetch: true */
          `../components/${path}`
        );
        break;
      case "pages":
        importPromise = import(
          /* webpackChunkNames: "[request]" */
          /* webpackPrefetch: true */
          `../pages/${path}`
        );
        break;
      default:
        console.error(`Error: unknown folder type ${folderType}`);
        return Promise.reject(new Error(`Invalid folder type: ${folderType}`));
    }

    return importPromise
      .then(() => customElements.whenDefined(tagName))
      .catch((err) => {
        console.error(`Failed to load component module from ${tagName}:`, err);
        throw (err);
      });
  }) 

  console.log(promises);
  return promises;
}
