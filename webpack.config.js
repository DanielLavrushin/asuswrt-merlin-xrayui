const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { exec } = require("child_process");
const webpack = require("webpack");

const isProduction = process.env.NODE_ENV === "production";
console.log(`Building for ${isProduction ? "production" : "development"}...`);
module.exports = {
  entry: "./src/app.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "app.js",
  },
  resolve: {
    extensions: [".ts", ".js", ".vue"],
    alias: {
      vue$: isProduction ? "vue/dist/vue.esm-browser.prod.js" : "vue/dist/vue.esm-browser.js",
      "@": path.resolve("src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.css$/,
        use: ["vue-style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/app.html", to: "xray-ui.asp" },
        { from: "src/xrayui", to: "[name]" },
      ],
    }),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"),
      __VUE_OPTIONS_API__: "true",
      __VUE_PROD_DEVTOOLS__: "false",
    }),
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap("AfterEmitPlugin", (compilation) => {
          console.log("Webpack finished building, running upload script...");

          exec("node sync.js", (err, stdout, stderr) => {
            if (err) {
              console.error(`Error running upload script: ${err}`);
              return;
            }
            console.log(`Upload script output: ${stdout}`);
            if (stderr) {
              console.error(`Upload script error output: ${stderr}`);
            }
          });
        });
      },
    },
  ],
  mode: "production",
};
