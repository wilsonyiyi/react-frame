const path = require('path');
const webpack = require('webpack');
const HTMLPlugin = require('html-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development'

const config = {
  entry: {
    app: path.join(__dirname, '../client/app.js')
  },
  output: {
    filename: '[name].[hash].js',
    path: path.join(__dirname, '../dist'),
    publicPath: '/public'
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        loader: 'babel-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {compact: false},
        exclude: [
          path.join(__dirname, '../node_modules')
        ]
      }
    ]
  },
  plugins: [
    new HTMLPlugin({ // 生成一个html文件，并将output的js脚本自动引入
      template: path.join(__dirname, '../client/template.html') // 指定html文件
    })
  ]
}

if (isDev) {
  config.entry = {
    app: [
      'react-hot-loader/patch',
      path.join(__dirname, '../client/app.js')
    ]
  }
  config.devServer = {
    host: '0.0.0.0', // 更灵活的指代，可以使用127.0.0.1， localhost， 还可以使用本机ip链接
    port: '8888',
    contentBase: path.join(__dirname, '../dist'), // 告诉服务器从哪里读取内容
    hot: true, // 热更新
    overlay: {
      errors: true // 错误时才出现遮罩，提示错误信息
    },
    publicPath: '/public', // 和webpack的路径统一
    historyApiFallback: {
      index: '/public/index.html' // 404返回的页面
    } 
  }
  config.plugins.push(new webpack.HotModuleReplacementPlugin())
}

module.exports = config