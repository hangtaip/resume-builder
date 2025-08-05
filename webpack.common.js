const path = require("path");
const yaml = require("yamljs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    app: path.resolve(__dirname, "src/js/index.js"),
  },
  module: {
    rules: [
      {
        test: /\.yaml$/i,
        type: "json",
        parser: {
          parse: yaml.parse,
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|otf|ttf|woff|woff2)$/i,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 4 * 1024,
          }
        },
      },
      {
        test: /\.svg$/i,
        loader: "svg-inline-loader",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Resume Builder",
      // favicon: `${path.resolve(__dirname, "src")}/favicon.ico`, 
    }),
    new CopyPlugin({
      patterns: [
        { from: "src/assets", to: "assets" },
        // { from: `${path.resolve(__dirname, "src")}/favicon.ico`, to: 'favicon.ico' },
        //{ from: 'node_modules/@fortawesome', to: 'assets/@fortawesome' },
      ],
    }),
  ],
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
    },
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].bundle.js",
    chunkFilename: "[name].[contenthash].chunk.js",
    clean: true,
  },
};
