import { join } from 'path';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { defaultTsconfigFilename } from '../../configuration/defaults';
import { appendTsExtension } from '../helpers/append-extension';
import { MultiNestCompilerPlugins } from '../plugins/plugins-loader';
import webpack = require('webpack');
import nodeExternals = require('webpack-node-externals');

export const webpackDefaultsFactory = (
  sourceRoot: string,
  relativeSourceRoot: string,
  entryFilename: string,
  isDebugEnabled = false,
  tsConfigFile = defaultTsconfigFilename,
  plugins: MultiNestCompilerPlugins,
): webpack.Configuration => {
  const isPluginRegistered = isAnyPluginRegistered(plugins);
  const webpackConfiguration: webpack.Configuration = {
    entry: appendTsExtension(join(sourceRoot, entryFilename)),
    devtool: isDebugEnabled ? 'inline-source-map' : false,
    target: 'node',
    output: {
      filename: join(relativeSourceRoot, `${entryFilename}.js`),
    },
    ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
    externals: [nodeExternals() as any],
    externalsPresets: { node: true },
    module: {
      rules: [
        {
          test: /.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: !isPluginRegistered,
                configFile: tsConfigFile,
                getCustomTransformers: (program: any) => ({
                  before: plugins.beforeHooks.map((hook: any) => hook(program)),
                  after: plugins.afterHooks.map((hook: any) => hook(program)),
                  afterDeclarations: plugins.afterDeclarationsHooks.map(
                    (hook: any) => hook(program),
                  ),
                }),
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: tsConfigFile,
        }),
      ],
    },
    mode: 'none',
    optimization: {
      nodeEnv: false,
    },
    node: {
      __filename: false,
      __dirname: false,
    },
    plugins: [
      new webpack.IgnorePlugin({
        checkResource(resource: any) {
          const lazyImports = [
            '@nestjs/microservices',
            '@nestjs/microservices/microservices-module',
            '@nestjs/websockets/socket-module',
            'class-validator',
            'class-transformer',
            'class-transformer/storage',
          ];
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource, {
              paths: [process.cwd()],
            });
          } catch (err) {
            return true;
          }
          return false;
        },
      }),
    ],
  };

  if (!isPluginRegistered) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

    webpackConfiguration.plugins!.push(
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: tsConfigFile,
        },
      }),
    );
  }

  return webpackConfiguration;
};

function isAnyPluginRegistered(plugins: MultiNestCompilerPlugins) {
  return (
    (plugins.afterHooks && plugins.afterHooks.length > 0) ||
    (plugins.beforeHooks && plugins.beforeHooks.length > 0) ||
    (plugins.afterDeclarationsHooks &&
      plugins.afterDeclarationsHooks.length > 0)
  );
}
