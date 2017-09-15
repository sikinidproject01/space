const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  output: {
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader'
            },
            {
              loader: 'sass-loader'
            }
          ],
          fallback: 'style-loader'
        })
      },
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['./build']),
    new Dotenv({
      path: '.env.prod',
    }),
    // # use it later
    // new webpack.DefinePlugin({
      // 'process.env.BUILD_TYPE': JSON.stringify('phonegap'),
      // 'process.env.BUILD_PLATFORM': JSON.stringify('ios')
    // }),
    new webpack.ExtendedAPIPlugin(),
    new UglifyJSPlugin({
      mangle: {
        except: ['Array','BigInteger','Boolean','Buffer','ECPair','Function','Number','Point']
      }
    }),
    new ExtractTextPlugin({
      filename: 'assets/css/all.[contenthash:8].css',
      allChunks: true,
    })
  ]
});
