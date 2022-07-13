# React V18.0 代码走读

## react代码本地可断点办法
### 拉取 react源码
```
# 拉取代码
git clone https://github.com/facebook/react.git

# 如果拉取速度很慢，可以考虑如下2个方案：

# 1. 使用cnpm代理
git clone https://github.com.cnpmjs.org/facebook/react

# 2. 使用码云的镜像（一天会与react同步一次）
git clone https://gitee.com/mirrors/react.git
```
### 安装依赖
```
# 切入到react源码所在文件夹
cd react

# 安装依赖
yarn
``` 
### 打包react、scheduler、react-dom三个包为dev环境可以使用的cjs包。
```
# 执行打包命令
yarn build react/index,react/jsx,react-dom/index,scheduler --type=NODE
```
### 通过yarn link可以改变项目中依赖包的目录指向
```
cd build/node_modules/react
# 申明react指向
yarn link
cd build/node_modules/react-dom
# 申明react-dom指向
yarn link
```
### 在 project 中关联依赖包
```
# 进入project
cd ./project

# 将项目内的react react-dom指向之前申明的包
yarn link react react-dom
```