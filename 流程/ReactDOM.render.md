# ReactDOM.render 函数调用说明

    说明 这里只讨论web端初次调用关于hydrate的全部默认为false|undefinde，不做解释

## ReactDOM.render(element,container,callback)

- element reactElemtn
- container HtmlElemnt
- callback 挂载完成后的回调

**作用:** 渲染挂载的开始

- 检查 container 是否合法

- 调用 legacyRenderSubtreeIntoContainer(null,elemrnt,container,false,callback)

## legacyRenderSubtreeIntoContainer

- parentComponent => null --------------- SSR 专用，父结点
- children => element ------------ 需要渲染的 ReactElemtn
- container => container ---------- HtmlElment
- forceHydrate => false -------------- SSR 专用，通过 Hydrate 这里会是 true
- callBack => callback ----------- 同上

**作用:**根据 container 是否存在 root 区分初始化/更新，创建或获取 fiberRoot，进而启动更新

从 container 取出 \_reactRootContainer 作为 react 的一个根

const root = container.\_reactRootContainer

检查 root 是否存在，如果存在就是 Update，如果不存在就是初始化

**若 root 存在**：

从 root 中取出 fiberRoot

const fiberRoot = root.\_internalRoot

调用 updateContainer(children,fiberRoot,parentComponent,callBack)

    注意：这里 callBack 会通过 getPublicRootInstance() 递归找到 fiberRoot 上第一个非 HTMlElement 结点,并将 callback 绑定在它上边。

    if (typeof callback === 'function') {
      const originalCallback = callback;
      callback = function() {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }

**若 root 不存在**：

调用 legacyCreateRootFromDOMContainer(contaiber,forceHydrate) 初始化 root。
将 root 赋值给 container.\_reactRootContainer,取出 root 中的\_internalRoot 作为 fiberRoot。

调用 updateContainer(children,fiberRoot,parentComponent,callBack)。

    //注意这里调用的时候，是非批量的。因为是初始化的内部挂载，所以需要使用非批量更新
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });

### unbatchedUpdates

- 为当前 excutaionContext 复制
- 结束后 恢复原 excutaionContext ,且如果执行态变为 `NoContext`后
  - 重制 react 渲染时间
  - 刷新处理 callback 的回调

### legacyCreateRootFromDOMContainer

- container --------------- HTMLElement
- forceHydrate ------------ 同上

**作用**：清空 container,创建 root

- 根据 forceHydrate 和 container 上是否已经被标记是一个 ReactContainer 来判断是否需要清空 container（SSR 不需要清空，但是 web 端初始化情况）
- 创建一个 root 结点

shouleHydrate = forceHydrate && isReactContainer(contaiber)?{ hydrate:true }:undefinde

调用 createLegacyRoot(container,shouleHydrate)

#### createLegacyRoot

- container --------------- HTMLElement
- options:shouleHydrate --- 忽略

引入静态变量 LegacyRoot = 0 ，作为 RootTag

调用 new ReactDOMBlockingRoot(container,LegacyRoot,options)

#### ReactDOMBlockingRoot

- container --------------- HTMLElement
- tag --------------------- root 的 tag 表示构建 root 的来源
- options ----------------- 忽略

创建 RootImpl ，赋值给 this.\_internalRoot 也就是 fiberRoot

this.\_internalRoot = createRootImpl(container, tag, options);

    //注意：通过 ReactDOMBlockingRoot 创建的实例会自动实现两个函数 render 和 unmount
    // 渲染根结点
    render(children){
        root = this.\_internalRoot;
        updateContainer(children,root,null,null)
    }
    // 卸载根结点
    unmount(){
        const root = this._internalRoot;
        const container = root.containerInfo;
        updateContainer(null, root, null, () => {
            // 从container中移除 __reactContainer 对应的fiber
            unmarkContainerAsRoot(container);
        });
    }

#### createRootImpl

- container --------------- HTMLElement
- tag --------------------- root 的 tag 表示构建 root 的来源
- options ----------------- 忽略

**作用：**

- 根据 container 创建 root
- 标记 container 作为 root 的 current
- 为 root 容器添加所有监听事件

根据 container 创建 root

    const root = createContainer(container, tag, hydrate, hydrationCallbacks);

标记 container 作为 root 的 current

    // 为 container 字段 添加 __reactContainer 对应的 fiber
    markContainerAsRoot(root.current, container);

为 root 容器添加所有监听事件

    const rootContainerElement = container.nodeType === COMMENT_NODE ? container.parentNode : container;
    // 绑定事件监听，特殊处理selectionchange
    listenToAllSupportedEvents(rootContainerElement);

##### createContainer -> createFiberRoot

- containerInfo --------------- HTMLElement
- tag ------------------------- root 的 tag 表示构建 root 的来源

**作用：**

- 创建 root:FiberRoot

  root = new FiberRootNode(containerInfo,tag)

  -> root.containerInfo = containerInfo

  -> root.tag = tag

- 创建 RootFiber:Fiber

  RootFiber = createHostRootFiber(tag);

  根据 tag 生成一个 mode，web 初始化出来的 mode === NodeMode

  HostRoot = 3; // 表示创建的是 根结点

  调用 createFiber(HostRoot,null,null,mode)

  -> RootFiber.tag = HostRoot

  -> RootFiber.mode = mode

- 形成一个闭环，将 root.current 指向 RootFiber，并将 root 作为 Fiber 的第一个 stateNode

  root.current = RootFiber

  RootFiber.stateNode = root

- 初始化 RootFiber 的 UpdateQueue

  initializeUpdateQueue(RootFiber)

  ->queue.baseState = RootFiber.memoizedState

  ->RootFiber.updateQueus = queue

###### createFiber

- tag ------------------------- fiberRoot 的类型 通过`React.render` 设定的都是 `Legcy`
- penddingProps --------------- 外界数据
- key ------------------------- 唯一表识
- mode ------------------------ 基本都是 ,`Legcy`下全部为 NodeMode

**作用：**
生成一个 FiberNode

FiberNode.tag = tag
FiberNode.penddingProps = penddingProps
FiberNode.mode=mode
FiberNode.key = key
