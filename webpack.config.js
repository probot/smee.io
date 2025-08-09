import { resolve as _resolve, join } from 'node:path'
import autoprefixer from 'autoprefixer'
import { globSync as glob } from 'tinyglobby'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { PurgeCSSPlugin } from 'purgecss-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import CompressionPlugin from 'compression-webpack-plugin'

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
const __dirname = new URL('.', import.meta.url).pathname

/** @type {import('webpack').Configuration} */
const cfg = {
  entry: {
    main: _resolve(__dirname, 'src', 'main.tsx')
  },
  mode: isProd ? 'production' : 'development',
  output: {
    path: join(__dirname, 'public'),
    filename: '[name].min.js',
    publicPath: '/'
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].min.css' })
  ],
  devtool: isProd ? false : 'source-map',
  module: {
    rules: [{
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
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
    modules: ['node_modules', _resolve(__dirname, 'src')],
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat', // Must be below test-utils
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  }
}

if (isProd) {
  cfg.plugins.push(new PurgeCSSPlugin({
    minimize: true,
    moduleExtensions: ['.js', '.jsx'],
    paths: glob([
      join(__dirname, 'src', '**/*.js'),
      join(__dirname, 'public', '*.html')
    ])
  }))
}

if (isProd) {
  cfg.plugins.push(new CompressionPlugin())
}

if (process.env.ANALYZE_BUNDLE) {
  cfg.plugins.push(new BundleAnalyzerPlugin())
}

export default cfg
