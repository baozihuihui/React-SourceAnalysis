# React 基础 API

## React.createElement

识别 jsx 的一个闭合标签通过 React.createElement 转换到成一个 React 结点

```language=javascript
React.createElement(名称，属性，标签包含内容(文字，其他标签))
```

- 第一个字段
  string(真实 Dom 元素)|Object(函数结点)
- 第二个字段
  id,key，props 等
- 第三个字段以及以后
  如果标签内容包含其他标签，会将每一个子标签转换成一个 React 结点，放在从第三个字段开始，不是组成数组，而是依次传入。

## ReactElement(元素)

## ReactComponent(组件)

## react-ref(实例)

**组件的实例(真实的 dom 结点或是子组件的实例)**
classComponent 是有实例的
functionComponent 是没有实例的，无法正常注册一个 ref

### 使用方式

#### 1、string ref

```language = html
<p ref="stringRef">span1</p>
```

这样在组件生成后挂载到 this.refs 对象上，可以通过 this.refs.stringRef 拿到这个 P 标签的实例。

#### 2、funtion

```language = html
<p ref={ ele => (this.methodRef = ele )}>span2</p>
```

在注册 ref 时候可以使用一个函数，接收参数 ele 就是这个组件的实例，可以指明挂载的位置，不再挂载在 refs 上。

#### 3、createRef

```language = javascript
this.objectRef = React.createRef(); // { current：null}
<p ref={this.objectRef}>span3</p>
```

在构造函数中通过 React 提供的接口创建一个 ref 对象，并在声明组件时将组件的实例直接赋值给这个对象。可以通过 this.objectRef.current 方式获取实例。

## React.forwarddRef(实例转发)

解决 functionComponent 中提供接收 ref 的方法
因为正常的函数组件是只接收一个参数 props，不再接收其他参数，所以利用 React.forwarddRef 这个接口创建的函数组件会多接收一个参数，用于其他组件绑定该函数组件的实例。

```language = javascript
const TargetComponent = React.forwarddRef((props,ref)=>( <input type="text" ref={ref} ></input> ));
```

### 获取 HOC 封装的，被包装的组件的实例

#### 1、不使用 forwarddRef,在 classComponent 组件中传递 ref,利用 props

```language = javascript
class A extends Component {
    render(){
        return(

        <h1 ref={this.props.refA}>ddd</h1>
        )
    }
}

export default class RefTest extends Component {
    ARef = React.createRef();
    render() {
        return (
            <div>
            <A refA = {this.ARef}></A> // 通过属性的来传递
            </div>
        )
    }
}
```

#### 2、使用 forwardRef 传递，则添加函数组件作为中间件，但实质上还是通过 props 传递

```language=javascript
class A extends Component {
    render(){
        return(
        <h1 ref={this.props.refA}>ddd</h1>
        )
    }
}

const NewA = React.forwardRef((props,ref)=>{
    return (
      <A {...props} refA = {ref}></A> //原理也是通过传递 props
    )
})

export default class RefTest extends Component {
    ARef = React.createRef();
        render() {
            return (
                <div>
                <NewA ref={this.ARef}></NewA> //这种方法 就可以使用 ref
                </div>
            )
    }
}
```

## react-context

隔层组件沟通数据的上下文
childContextType( v17.0 已废弃，不考虑)

React.createContext() 返回一个上下文对象

## react-ConcurrentMode（还在体验中）

可中断式渲染，提供组件给渲染优先级，修改组件优先级，提高用户体验

## react-Suspense

处理 异步组件获取渲染，以及数据异步获取后展示组件(尽量不要使用在控制组件异步获取数据的组件)。

```language=javascript
<Suspense fallback={"loadding data"} >
<A />
<B />
</Suspense>
```

A、B 均为异步组件，这时候组件只显示 loadding data，只有在 A、B 全部加载完成后才会将 A、B 两个组件全部渲染出来
通常搭配 React.lazy(()=>import('./A.js')) 进行异步组件的加载。
如果是异步数据获取的组件，想使用那么在异步数据获取一定要在获取数据的函数中最后 throw promise，获取数据的 then 中一定要调用 reslove();

## React-Hooks

为 functionComponent 提供状态管理,方便使用类似 classComponents 的生命周期

## React.children

### React.children.map

递归分解返回值中数组，将其平铺成一个一维数组

## React.memo

为 functionComponent 提供一个 pureComponent 的更新机会

## React.Fragment

组件 render 返回必须是单结点，但需要返回多结点且不想被无意义结点包围时使用，常用<></>表示

## React.StrictMode

对子结点使用函数进行检查，如果有过期的函数可以进行提醒

## React.cloneElement

根据一个 ReactElement 复制一个新的结点

## React.createFactory

构造创建非 jsx 结点的工厂
