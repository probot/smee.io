const path = require('path')
const autoprefixer = require('autoprefixer')
const glob = require('glob-all')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { EsbuildPlugin } = require('esbuild-loader')

const isProd = process.env.NODE_ENV === 'production'

const browsers = [
  'last 2 versions',
  'ios_saf >= 8',
  'edge >= 12',
  'chrome >= 49',
  'firefox >= 49',
  '> 1%',
  'not dead'
]

const cfg = {
  entry: {
    main: path.resolve(__dirname, 'src', 'main.js')
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].min.js',
    publicPath: '/'
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].min.css' })
  ],
  devtool: isProd ? 'no' : 'source-map',
  module: {
    rules: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'esbuild-loader',
        options: {
          loader: 'jsx',
          target: 'es2022',
          sourcemap: process.env.NODE_ENV !== 'production'
        }
      }
    }, {
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            sourceMap: true
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [autoprefixer({ overrideBrowserslist: browsers })]
            }
          }
        }, {
          loader: 'sass-loader',
          options: {
            sourceMap: true
          }
        }
      ]
    }]
  },
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'src')],
  }
}

if (isProd) {
  cfg.plugins.push(new PurifyCSSPlugin({
    minimize: true,
    moduleExtensions: ['.js'],
    paths: glob.sync([
      path.join(__dirname, 'src', '**/*.js'),
      path.join(__dirname, 'public', '*.html')
    ])
  }))
}

module.exports = cfg
