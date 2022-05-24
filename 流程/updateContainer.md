# 更新流程

## 关于 excutionContext 使用 32 位 2 进制码

- 每一个优先级只关心自己所在位是否为 1 即可。
- 换句话 一个值 能够表示多个状态，且每个状态可以进行提升、降级

## updateContainer

- element ------------ 需要渲染的 ReactElemtn
- container ------------ HtmlElement
- parentComponent ------------ 父结点(SSR 专用 )
- callBack ------------ 回调函数

**内容：**

- 获取事件时间(eventTime)

  `eventTime = requestEventTime()`

- 根据 current 获取 Lane

  `lane = requestUpdateLane(current)`

- 根据 parentComponent 获取 SSR 渲染对应的上下文

  `container.context = getContextForSubtree(parentComponent)`

- 根据 eventTime 、 Lane 创建 Update。

  `const update = createUpdate(eventTime,Line)`

  将更新 element 绑定在 payload 上

  `update.payload = {element}`

  将 callBack 绑定在 updte 上

- 将 update 添加到 current 的 enqueueUpdate

  `current = container.current // 这里就是 RootFiber`

  `enqueueUpdate(current, update);`

- 调度 Fiber 的更新

  `schudleUpdateOnFiber(current,lane,eventTime)`

### Update 对象

```language=javasript
  const update: Update<*> = {
    eventTime,
    lane,
    tag: UpdateState, // UpdateState = 0
    payload: null,
    callback: null,
    next: null,
  };
```

### requestEventTime

**内容：**

- 根据当前事件是否是 React 事件
- `executionContext` 标识当前 Reacr 执行栈 所在阶段
- 判断 executionContext 如果当前处在 React (render|commit)的上下文状态，则获取当前时间
- 如果不在，且 `currentTime !== NoTimestamp`，则说明本次更新是一个原生事件，那么就使用初始化记录的 currentTime 作为启动事件，知道一个 React 事件触发 该函数为止
- 如果是初始化，`currentTime === NoTimestamp` 则使用当前事件，并记录到 currentTime 上。

### requestUpdateLane

- current : fiber

**内容：**

- 根据 Fiber.mode 计算 Fiber 对应的 Lane 优先级
- 因为 通过 Fiber.mode 计算，而通过`ReactDOM.render`创建的 RootFiber 初始化的 tag 都是 Leacy，所以 Fiber.mode 都是 `Nomode`
- 所以默认返回是 `SyncLane`

### enqueueUpdate

- current:Fiber
- update:Update

**内容：**

- 取出 current 的 updateQueue 中的 shared
- 取出 shared.pending => 待执行的 Update
- 如果没有 pendding,则将 Update 赋值给 pendding,并将 Update.next 指向自己

  - `Update.next = Update` => 如果后续再有插入 Update 的时候，就能将自己变为插入 Update 的下一个

- 判断是否有 pendding,如果有就将新增的 Update 替换成当前的，之前的 pendding 变为下一个。
- 这样 第一个 Update 永远是 updatequeue.pending.next。
- 环形链表 u0 -> u0 => u1->u0-u1

```language=javascript
 if (pending === null) {
    // This is the first update. Create a circular list.
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  //
  sharedQueue.pending = update;
```

**_流程描述_**

```language=javascript
// 流程描述
// init
sharedQueue.pending = null

// 第一次 调度 添加 u0

u0.next = u0 //u0 -> u0
sharedQueue.pendding = u0

// pending = u0 当前环形链 u0 -> u0


// 第二次 调度 添加 u1
u1.next = pendding.next // u1 -> u0
pendding.next = update // u0 -> u1
sharedQueue.pendding = u1

// pending = u1 当前环形链 u1 -> u0 -> u1

// 第三次 调度 添加 u2
u2.next = pendding.next // u2 -> u0
pendding.next = update // u1->u0 => u1 -> u2
sharedQueue.pendding = u2

// pending u2 当前环形链 u2->u0->u1->u2
```

## schudleUpdateOnFiber

- fiber :current 对应的 RootFiber
- lane
- eventTime

**内容：**

- 检查是否存在嵌套更新，当前最大的更新数，如果以超过 50 就进行报错

  `checkForNestedUpdates();`

- 开发环境检查 memoComponent、classComponent 是否存在其他更新

  `warnAboutRenderPhaseUpdatesInDEV(fiber)`

- 根据 Update 对应的 Lane,合并 fiber 对应的 Lane 优先级，并向上遍历更新父节点 Lane(合并优先级)，最终返回 FiberRoot 结点

  - `const root = markUpdateLaneFromFiberToRoot(fiber,lane);`

- 标记当前 root 需要更新，更新 root 提升结点上 pendingLanes、suspendedLanes、以及 eventTime

  - `markRootUpdated(root, lane, eventTime);`

- 检查 ProfilerTimer (TODO:不清楚逻辑)

  - 判断当前 fiber.tag = Profiler
  - `onNestedUpdateScheduled(root.memoizedInteractions)`
  - `onNestedUpdateScheduled()`

- 若检查当前执行的 workInProgressRoot 是 root

  - render 时 为空，暂时没有进程中的 Root
  - update TODO 暂时 为 包含

- 判断 `Lane === SyncLane`

  - 判断 `executionContext` 当前是 `LegacyUnbatchedContext` 非批量更新
  - 且 `(executionContext & (RenderContext | CommitContext)) === NoContext` 当前 不是 渲染 或 提交 状态
    - 在根目录上注册挂起的交互，以避免丢失跟踪的交互数据。
      - `schedulePendingInteractions(root, lane)`
    - 处理 遗留 Case ,即 ReactDOM.render 通过 batchUpdate 更新时需要同步执行，但布局更新应该放在 批处理完成后执行
      - 这是不经过调度程序的同步任务的入口点
      - `performSyncWorkOnRoot(root)`
  - 若 当前是 非批量更新 且 当前是 渲染 或 提交 状态 ， 以及 若 当前是批量更新
    - 为 root 调度一个 任务。每个 root 只有一个任务；如果已经安排了一个任务，我们将检查以确保现有任务的优先级与 root 处理的下一级任务的优先级相同。此函数在每次更新时调用，并在退出任务之前调用。
    - `ensureRootIsScheduled(root,eventTime)`

- `Lane !== SyncLane` 时 处理办法 TODO

### markUpdateLaneFromFiberToRoot

- fiber 需要调度的 fiber
- lane 新增的 Update 对应的 Lane

**内容：**

- 更新 根据 update 提供的 Lane ,合并对应 fiber 的 Lane
- 递归向上搜索所有父级(查找渲染路径)，并将每层父级的 childLanes 进行合并
- 通过递归找到 FiberRoot，并将其返回

```language=javascript
 function mergeLane(a,b){
   return a | b;
 }

function markUpdateLaneFromFiberToRoot(){
   node = fiber;
   fiber.lane = mergeLane(fiber.lane,lane);
   // 副本Lane
   fiber.alternate.lane = mergeLane(fiber.alternate.lane,lane);
   const parent = fiber.return;

   while(parent){
     parent.childrenLane =mergeLane(parent.childrenLane,lane);
     // 副本Lane
     parent.alternate.childrenLane =mergeLane(parent.alternate.childrenLane,lane);
     parent = parent.return;
     node = parent;
   }

   // 检查 最终父结点 是 根结点
   if(node.tag === HostRoot){
     return node
   }
   return null;
 }
```

### markRootUpdated

**内容：**

- 根据 update 的 Lane 提升 root.pendingLanes
- 计算升级后的 Lane `higherPriorityLanes = update.Lane -1`
- 根据升级后的 Lane 进行 计算，提升`root.suspendedLanes`(被暂停的)、`root.pingedLanes`(已发送的) 任务级别
- 根据 update.Lane 算出 `eventTime` 对应 `Root.eventTimes`数组所在下标，并更新事件事件为 update 时间

### schedulePendingInteractions

**内容：**

- 将 Lane 与已存在的 `__interactionsRef` 记录在 `root.pendingInteractionMap` 上
- 根据 Lane 计算 `threadID` 并根据 这个 ID 将上边已存在的`__interactionsRef`订阅`onWorkScheduled`

### ensureRootIsScheduled

**内容：**

- 1
