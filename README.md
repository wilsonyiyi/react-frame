## 说明
这是一个React项目的架构，主要理清项目目录的设置，构建工具的配置，服务端渲染的配置。

## 启动
```shell
npm run start # 启动项目
```


## 项目目录
```shell
build/              # webpack配置文件，工程脚本文件
  -- webpack.config.client.js # 客户端webpack配置 --> 在dist目录生成入口html文件和打包后的react文件；开发环境配置了webpack-dev-server和热更新
  -- webpack.config.server.js # 服务端webpack配置 --> 执行该文件，将在dist目录生成符合commonjs规范的，包含了app.jsx组件内容的server-entry.js文件
client/             # 应用文件
  -- app.js           # 入口文件
  -- app.jsx          # App组件
  -- server-entry.js  # 导出App组件，提供给服务端渲染使用 
  -- template.html    # 入口html文件
dist/               # 编译后文件
node_modules/       # npm包存储
server/             # 存放后台服务文件
  -- server.js      # 路由、服务、静态文件路径映射
  util/
    -- dev-static.js # 

```

## 代码规范


## Summary
### webpack-dev-server的配置
> 思路：这里的目标是使用webpack插件启动一个本地服务，方便后续开发。

1.修改webpack.config.client.js配置，添加插件指定的内容
```js
const webpack = require('webpack');
const isDev = process.env.NODE_ENV === 'development'

if (isDev) {
  config.entry = {
    app: [
      'react-hot-loader/patch', // 这部分内容用于热更新
      path.join(__dirname, '../client/app.js')
    ]
  }
  config.devServer = {
    host: '0.0.0.0', // 更灵活的指代，可以使用127.0.0.1， localhost， 还可以使用本机ip链接
    port: '8888',
    contentBase: path.join(__dirname, '../dist'), // 告诉服务器从哪里读取内容，服务器将dist作为根目录启动服务
    // hot: true, // 热更新，需要配置热更新的内容才能使用
    overlay: {
      errors: true // 错误时才出现遮罩，提示错误信息
    },
    publicPath: '/public', // 和webpack的output属性统一
    historyApiFallback: {
      index: '/public/index.html' // 404返回的页面
    } 
  }
  // config.plugins.push(new webpack.HotModuleReplacementPlugin()) // 添加插件，用于热更新
}

```

2.将脚本添加至package.json文件script属性下，方便操作。
```js
// 需要先本地安装cross-env，添加环境变量
// --config 指定webpack-dev-server读取的配置文件内容
"dev:client": "cross-env NODE_ENV=development webpack-dev-server --config build/webpack.config.client.js",
```

3.终端执行下面脚本，便启动了一个本地服务
```shell
npm run dev:client # 打开http://localhost:8888即可访问
```

### react-hot-loader 热更新插件的配置
> 所谓热更新，不是类似live-reload之类的自动根据变化自动刷新页面，它适用于多页面开发，但是SPA应用，实现局部更新更适合。
> react-hot-loader + webpack-dev-server可以轻松实现这一功能。

1.修改webpack.config.client.js配置
  - 修改app入口文件，添加'react-hot-loader/patch'模块
  - 将devServer属性里的hot属性设置为true
  - 添加webpack的热模块更新插件

2.修改app.js文件
```js
import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader' // 引入热更新模块, 将组件内容放在AppContainer组件内，当组件内容变化，webpack将自动更新AppContainer组件内的内容
import App from './app.jsx'

const root = document.getElementById('root')
// 定义一个render函数，复用
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    root
  )
}

render(App)

if (module.hot) {
  module.hot.accept('./app.jsx', () => {
    const NextApp = require('./app.jsx').default;
    render(NextApp)
  })
}
```


```js
config.plugins.push(new webpack.HotModuleReplacementPlugin())
```
2.启动项目，修改内容，页面实现热更新

### 服务器端配置
> 服务端生产环境读取dist里已经生成好的文件时简单的，但是开发环境中前端使用webpack-dev-server时，并没有执行build过程，只是在内存中操作，此时该如何获取编译的文件呢？--> 此时，可以走http请求的形式，通过url链接获取到dev-server中的静态资源。这里使用了axios

修改server/server.js文件
```js
const express = require('express');
const ReactServer = require('react-dom/server');
const fs = require('fs');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development'

const app = express()

// 开发环境判断
if (!isDev) {
  // 生产环境
  const serverEntry = require('../dist/server-entry').default;
  const tempalte = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8')
  app.use('/public', express.static(path.join(__dirname, '../dist'))) // 定义静态资源路径
  app.get('*', function (req, res) {
    const appString = ReactServer.renderToString(serverEntry) // 将react组件转换成字符串
    let str = tempalte.replace('<!-- app -->', appString) // 插入html页面
    res.send(str)  // 返回html页面
  })
} else {
  const devStatic = require('./util/dev-static');
  devStatic(app)
}

app.listen(3333, function() {
  console.log('server is listening at http://localhost:3333');
})
```

## Issue
1.执行webpack-dev-server报错
> throw new Error('invalid "instanceof" keyword value ' + c);

webpack-dev-server的[Issue](https://github.com/webpack/webpack-dev-server/issues/1355)里有关于这个的讨论, 暂时采取了其中的一个方法，降级webpack-dev-server版本到2.9.1

