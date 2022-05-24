function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  // If a component has string refs, we will assign a different object later.
  this.refs = emptyObject;
  // We initialize the default updater but the real one gets injected by the
  // renderer.
  this.updater = updater || ReactNoopUpdateQueue;
}

// 类组件和函数组件的type都是一个function ,通过这个字段进行区分。类组件需要继承Component
Component.prototype.isReactComponent = {};
