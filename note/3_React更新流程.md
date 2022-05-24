# 更新路程

## 1、总体流程概览

### Scheduler 整体流程

- 找到更新对应的 FiberRoot 结点 -通过 setState、forceUpdate 调用的 scheudler，只传递 Element 对应的 fiber,这样就需要先找到这个结点所在的 FiberRoot。因此进入调度队列永远都是 FiberRoot，不可能是一个单独的 Fiber,每一次的调度都是对整颗树的遍历。
- 如果符合条件重置 stack
- 重置一些调度中必备的公共变量
- 如果符合条件就请求工作调度

#### Scheduler 开始方法

scheduleUpdateOnFiber()
