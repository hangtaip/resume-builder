const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  devtool: "inline-source-map",
  devServer: {
    compress: true,
    hot: true,
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.shadow.scss$/i,
        exclude: /node_modules/,
        use: [
          // {
          //   loader: "style-loader",
          //   options: {
          //     injectType: "lazyStyleTag",
          //     insert: require.resolve("./src/js/insert-function.js"),
          //   },
          // },
          {
            loader: "to-string-loader",
            options: {
              sourceMap: true,
            },
          },
          {
            loader: "css-loader",
            options: {
              modules: false,
              sourceMap: true,
            },
          },
          {
            loader: "sass-loader",
            options: {
              api: "modern",
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.((c|sa|sc)ss)$/i,
        exclude: [/\.shadow.scss$/i, /node_modules/],
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
              sourceMap: true,
            },
          },
          {
            loader: "sass-loader",
            options: {
              api: "modern",
              sourceMap: true,
            }
          }
        ],
      },
    ],
  },
  stats: {
    loggingDebug: ["sass-loader"],
  },
});
