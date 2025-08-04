const path = require('path');
const yaml = require('yamljs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  devtool: 'inline-source-map',
  devServer: {
    static: path.resolve(__dirname, 'dist'), 
    compress: true,
    hot: true,
  },
  entry: './src/js/index.js',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.yaml$/i,
        type: 'json',
        parser: {
          parse: yaml.parse,
        },
      },
      {
        test: /\.((c|sa|sc)ss)$/i,
        use: [
          //process.env.NODE_ENV !== 'production'
          //  ? 'style-loader'
          //  : MiniCssExtractPlugin.loader,
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: { 
              postcssOptions: {
                plugins: [
                  [
                    "postcss-preset-env",
                    {
                      stage: 0,
                    },
                  ],
                ],
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Resume',
    }),
    new MiniCssExtractPlugin({
      filename: './src/styles/dist/[name].[contenthash].css',
      chunkFilename: '[id].css',
    }),
  ],
  optimization: {
    runtimeChunk: 'single',
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  stats: {
    loggingDebug: ['sass-loader'],
  },
}
