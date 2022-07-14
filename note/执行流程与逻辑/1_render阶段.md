# render 阶段
`本地文件位置(react-dom-development.js)`

- 开始于`performSyncWorkOnRoot`或`performConcurrentWorkOnRoot`方法的调用。这取决于本次更新是同步更新还是异步更新。
- 从 `rootFiber` 节点 ,深度优先遍历整棵树。并针对 mount、update 两种状态执行不同的逻辑。
- `递` 的开始为 `beginWork` 。
- `归` 的开始为 `completeWork`。

## 如何保证递归
- 递归是交错执行的，不是一直递、或者一直归。 父节点的每一个子节点都会完成自己的递归，才会返回父节点的归，然后才会向上传递。
- 关键函数 `performUnitOfWork`
    - `beginWork`函数会返回下一个待执行的`Fiber`
    - 若存在下一个待执行的`Fiber`，则把它赋值给`workInProgress`。保证`workLoopSync`的while循环继续执行。
    - 若不存在下一个`Fiber`，则进入当前节点的 `completeUnitOfWork`。
    - 当前`Fiber`不存在子节点时，会进入`completeUnitOfWork`，并且去查询是否存在兄弟节点`sibling`。如果存在，则将兄弟节点赋值给`workInProgress`，并结束`completeUnitOfWork`，继续进行`兄弟Fiber`的递归。

## 判断当前 Fiber 是 mount 还是 updtae

- 依赖于`双缓存机制`，每一个`Fiber`都有`alternate`属性。这个属性指向了当前正在`调度器`中的`Fiber树(workInprogress)`中，相对应的当前节点。所以`alternate`属性为空，则说明已在`调度器`执行的`Fiber树`中对应节点不存在，也就是说`当前Fiber节点`是`新增节点`，还未被调度器挂载过。需要执行`mount`流程。

## mount 时的递归策略
### 递 
- `beginWork` 
- 关键函数`reconcileChildren` -> `ChildReconciler(false)`
    - 挂载、构建`新`的`子Fiber`节点,并赋值到`workInProgress.child`;
    - 构建`Fiber`节点，并设置`shouldTrackSideEffects`为`false`,也就是不执行对节点的DOM操作;(因为初始化时只需要将RootFiber进行一次挂在就行(会依次挂载下属所有节点)，不需要对每个节点都加一次DOM操作，造成性能浪费。
### 归 
- `completeWork` 


## update 时的递归策略

### 递 
- `beginWork` 
- 关键函数`reconcileChildren` -> `ChildReconciler(true)`
    - 更新`子Fiber`节点,并赋值到`workInProgress.child`;
     - 构建`Fiber`节点，并设置`shouldTrackSideEffects`为`true`,也就是表明当前节点允许执行DOM操作，因为可能当前节点是需要更新的节点。
### 归 
- `completeWork` 
