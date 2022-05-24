const jsx = <>123</>;
const container = document.getElelemtnById("root");

const ReactDom = new ReactDom();

ReactDom.render(jsx, container);

/**
 *
 * @param {ReactElement} element  ReactDom.render中传入的jsx对象
 * @param {HTMLElement} container Html结点
 * @param {Function} callback     执行完成后的回调
 */
function ReactDom() {
  function render(element, container, callback) {
    // 检查container是否合法
    invariant(
      isValidContainer(container),
      "Target container is not a DOM element."
    );

    return legacyRenderSubtreeIntoContainer(
      null,
      element,
      container,
      false,
      callback
    );
  }
  return { render };
}

/**
 *
 * @param {ReactElement} parentComponent  SSR中传入的父结点
 * @param {ReactElement} children ReactDom.render中传入的jsx对象
 * @param {HTMLElement} container Html结点
 * @param {boolean} forceHydrate  是否SSR
 * @param {Function} callback     执行完成后的回调用
 */
function legacyRenderSubtreeIntoContainer(
  parentComponent,
  children,
  container,
  forceHydrate,
  callback
) {
  // TODO: Without `any` type, Flow says "Property cannot be accessed on any
  // member of intersection type." Whyyyyyy.
  let root = container._reactRootContainer;
  let fiberRoot;
  if (!root) {
    // Initial mount
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate
    );
    fiberRoot = root._internalRoot;
    if (typeof callback === "function") {
      const originalCallback = callback;
      callback = function () {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Initial mount should not be batched.
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else {
    fiberRoot = root._internalRoot;
    if (typeof callback === "function") {
      const originalCallback = callback;
      callback = function () {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Update
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}
