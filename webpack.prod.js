const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = merge(common, {
  devServer: {
    static: {
      directory: "dist",
    },
    open: "chromium",
  },
  devtool: "source-map",
  mode: "production",
  module: {
    rules: [
      {
        test: /\.shadow.scss$/i,
        exclude: /node_modules/,
        use: [
          "sass-to-string",
          {
            loader: "sass-loader",
            options: {
              api: "modern",
              sassOptions: {
                outputStyle: "compressed",
              },
            },
          },
        ],
      },
      {
        test: /\.((c|sa|sc)ss)$/i,
        exclude: [/\.shadow.scss$/i, /node_modules/],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
            },
          },
          {
            loader: "postcss-loader",
            options: {
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
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      "...",
      new CssMinimizerPlugin(),
    ],
  },
  output: {
    publicPath: "./",
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash].bundle.css",
      chunkFilename: "css/[name].[contenthash].chunk.css",
    }),
    // new BundleAnalyzerPlugin(),
  ],
});
