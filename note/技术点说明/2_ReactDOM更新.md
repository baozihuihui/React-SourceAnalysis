# 创建、更新的方式

## 1、ReactDOM.render || hydrate(服务端使用渲染是否使用原 Root 结点合并，节省性能)

创建 FiberRoot、RootFiber。
并通过 UpdateContainer 方法为 FiberRoot 这个 Fiber 做三件事

- 1、用 creteUpdate 为 FiberRoot 这个 fiber 结点创建一个 update,并准备当前时间 currentTime(eventTime)以及不同优先级下的过期时间(Lane),以及 payload(也就是更新 element)
- 2、用 enqueueUpdate 方法为 FiberRoot 的 UpdateQueue 添加第一个 Update
- 3、用 scheduleUpdateOnFiber 方法开始执行更新

## 2、setState、forceUpdate

作用：给结点的 Fiber 创建更新

这两种方法唯一的区别:

forceUpdate 在创建一个 Update 的时候 enqueueForceUpdate 中会将通过 createUpdate 方法创建的 Update 的 tag 由‘updateState’变为‘forceUpdate’。
而 React.render 和 setState 都是使用默认的‘updateState’。
之后的操作就与 updateContainer 中对 FiberRoot 做的操作是一致的

## 3、ReactRoot、FiberRoot、Fiber 的说明

### 创建一个 ReactRoot(根结点类)

将根结点类，以及 DOM 结点生成一个 ReactRoot。并区分客户端渲染以及服务端渲染(服务端渲染是需要在客户端渲染时进行合并操作)，区分方式一个是调用
函数不同，一个是 ReactRoot.render，一个是 ReactRoot.hydrate。在后续获取了 DOM 结点后，也会去检查一下根结点的子节点是否是一个 React 结点(通过结点的 data-attribute)
。如果是通过 render 调用的就会将根结点以下的子结点全部移除，hydrate 则会做一个标记，在后续渲染时进行合并。

### 创建 FiberRoot

通过 ReactDOM.render 创建的 FiberRoot,同时也会将这个 DOM 结点生成一个 Fiber(也叫 RootFiber),这个 FiberRoot 的 current 属性会指向 RootFiber。

**注意这里 FiberRoot 与 RootFiber 是不一样的，FiberRoot 的数据结构要比 RootFiber 这一个单一的 Fiber 包含的更多。在定义上 FiberRoot 是所有 Fiber 的根结点，而 RootFiber 实际只是一个 Fiber,是根结点下的第一个子节点。**

一个页面中可以调用多个 ReactDOM.render,这样就会生成多个 RootFiber，但是 FiberRoot 是只有一个的，它通过 current 字段永远指向当前渲染的 RootFiber.

这时候通过 ReactRoot 注册的 \<App />结点生成的 Fiber 就是 RootFiber 的一个子节点。

- 整个应用的起点 => 根结点 \<App />
- 包含应用挂载的目标结点 => 应用真实挂载的 DOM 结点
- 记录整个应用更新过程的各种信息(优先级，更新内容)

### Fiber 是什么

- 对应一个组件需要被处理或者已经处理了，一个组件可以有一个或者多个 Fiber
- 每一个 ReactElement 对应一个 Fiber 对象
- 记录结点的各种状态(classComponent 上的 state 和 props),Fiber 对象更新后才会将数据赋值给 state\props 上。同样 FunctionComponent 也是
- 通过 Fiber 来实现 hooks 的，因为 Fiber 才是数据更新操作的对象。
- 串联整个应用形成树结构，记录每一个结点的数据变化关系。

#### 树结构的数据结构实现方式

Fiber 是一个单链表树，在 Fiber 对象中只会存储第一个子节点(child)，后续的子节点，是作为前一个结点的兄弟结点(slibing)，只存储在子结点中，通过子节点向下传递关联关系。同时每一个子节点都存储他的
父结点(return)，方便在最后一个子节点全部遍历完成后向上返回父结点继续进行遍历。

Fiber 作为一种数据结构，用于代表某些 worker，换句话说，就是一个 work 单元，通过 Fiber 的架构，提供了一种跟踪，调度，暂停和中止工作的便捷方式。

### 双缓存树(double buffer)

Fiber 作为虚拟 dom 并指导最后的渲染变化工作，那么必将记录每个结点的变化。这时候频繁的创建新对象和删除对象是非常消耗内存的，所以 FiberTree 实际上会有两颗树。

- current Fiber Tree 用于描述当前虚拟 dom 结构，也就是上边说的有 RootFiber 作为第一个结点所构成的 Fiber 树
- workInProgress Tree 用于在内存中记录变化后的 dom 结构，用 alternate 字段指向，这棵树是由 RootFiber 初始化复制而来，之后用于构建变化后的 Fiber Tree 并提交给 Render 进行渲染。

这两个缓存树，互相通过 alternate 进行指向

```language=javascript
currentFiber.alternate === workInProgressFiber;
workInProgressFiber.alternate === currentFiber;
```

每次 Render 渲染完成后应用的根结点就会将 current 指向 workInProgress Tree，而 workInprogress Tree 则会在状态变化后构建新的 Fiber Tree。

## 4、Update、UpdateQueue 说明

### UpdateQueue 是一个循环单链表

一个 Update 队列
记录第一个 Update 以及最后一个 Update，并记录下共享 Update(shared:{padding:Update})，里边的 padding 参数用来表示待执行的 Update。

### Update 是什么

用于记录组件状态的改变,变更前后的 state。
存放于 UpdateQueue 中,因为 UpdateQueue 是一个循环单链表，所以用 next 字段指向下一个 Update。
多个 Update 可以同时存在(例如：一个行为中多次调用 setState，会生成多个 update)。
调度时会将 UpdateQueue 中根据优先级计算出的过期时间(以前是 expirationTime)在同一时间内的 Update 进行批量执行,但现在变成了 Lane，用来表示一件事情的优先级。

## 5、 expirationTime 和 Lane 的区别

### expirationTime 模式下

可以在有限时间中 batch 多个高优先级的事情，使用过期时间的方式使被暂停的低优先级事件随着时间线推移而提高优先级，进而保证了所有事件都可被执行到。但是这是一个单线程执行原理，但是当出现时间重叠就无法处理了。

- 例子 1: 点击一个 tab，再点击其他的按钮，会产生多个 Update,实际上是两个并行任务，但是单线程处理模式下，只能挨个执行。
- 例子 2: 如果一个页面有多个组件需要更新，这个会出现多个调度任务，这时候就只能一个一个调度任务去处理。

### Lane 模式下

Lane 本质上就是一个通过数位计算，表示任务等级的模式。但是它提供了一个多调度任务并行的可能性。也就是说多个调度任务中都有高优先级的任务，原先的做法是一个调度一个调度的去处理，现在，我们可以多个调度之间
去并行的选取一些高优先级的一起去做，这样就能在限定时间内的调度从单任务队列变为并行关系。
Lane 通过 32bit 字节的二进制位表示了多个优先级。其次准备了多个 Lanes 批(优先级范围对应的更新等级)，也就是将多个优先级统一到同一个批内，这样可以将同一个批的不同优先级任务优先执行。
