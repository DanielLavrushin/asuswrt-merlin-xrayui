const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { exec } = require('child_process');

module.exports = {
    entry: './src/app.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'app.js',
    },
    resolve: {
        extensions: ['.ts', '.js', '.vue'],
        alias: {
            vue$: 'vue/dist/vue.esm-browser.js',
            '@': path.resolve('src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    appendTsSuffixTo: [/\.vue$/],
                },
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.css$/,
                use: ['vue-style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new VueLoaderPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/app.html', to: 'xray-ui.asp' },
                { from: 'src/xrayui', to: '[name]' }
            ],
        }),
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
                    console.log('Webpack finished building, running upload script...');

                    exec('node sync.js', (err, stdout, stderr) => {
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
            }
        }
    ],
    mode: 'production',
};