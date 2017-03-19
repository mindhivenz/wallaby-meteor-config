/* eslint-disable */

// Has to be written without use of Babel / ES2015+

// Taken from: https://github.com/xolvio/automated-testing-best-practices/blob/master/wallaby_server.js

// How to run:
//
// 1. Start your Meteor app and wait until it has built.
// 2. Start Wallaby with this configuration.


var fs = require('fs');
var path = require('path');

module.exports = function(options) {
  if (! options) {
    options = {}
  }
  var meteorPort = options.meteorPort || 3000
  // Only way we can pass data to child processes is through environment
  process.env.NODE_ENV = 'test'
  process.env.ROOT_URL = options.rootUrl || 'http://localhost:' + meteorPort + '/'
  process.env.MONGO_URL = options.mongoUrl || 'mongodb://127.0.0.1:' + (meteorPort + 1) + '/wallaby'
  return config
}

var nodePath = require('child_process')
    .execSync('meteor node -e "process.stdout.write(process.execPath)"', { encoding: 'utf8' });
var relativeAppPath = 'src';  // Note, this is intentionally repeated below


function config(wallaby) {

  process.env.NODE_PATH += path.delimiter +
    path.join(wallaby.localProjectDir, relativeAppPath, '.meteor/local/build/programs/server/node_modules');

  // REVISIT: would have thought with Wallaby changes this wouldn't be needed anymore
  process.env.NODE_PATH += path.delimiter +
    path.join(wallaby.localProjectDir, relativeAppPath, 'node_modules');

  var babelConfig
  if (! fs.existsSync(path.join(wallaby.localProjectDir, '.babelrc'))) {
    babelConfig = {
      presets: [
        'meteor',
        'react'
      ],
      plugins: [
        ['root-import', {
          rootPathPrefix: '/',
          rootPathSuffix: 'src'
        }]
      ]
    }
    var appBabelRcPath = path.join(wallaby.localProjectDir, relativeAppPath, '.babelrc')
    if (fs.existsSync(appBabelRcPath)) {
      var appBabelConfig = JSON.parse(fs.readFileSync(appBabelRcPath));
      for (k in appBabelConfig) {
        if (! Array.isArray(appBabelConfig[k])) {
          throw new Error('Not implemented yet')
        }
        if (! babelConfig[k]) {
          babelConfig[k] = []
        }
        Array.prototype.push.apply(babelConfig[k], appBabelConfig[k])
      }
    }
  }

  var compiler = wallaby.compilers.babel(babelConfig)

  return {
    files: [
      'src/**/*.@(js|jsx)',
      'src/.specs/**/*.js',
      '!src/.specs/**/*.spec.js',
      '!src/**/*.spec.@(js|jsx)',
      '!src/**/*.story.@(js|jsx)',
      '!src/node_modules/**/*',
    ],

    tests: [
      'src/**/*.spec.@(js|jsx)',
      'src/.specs/**/*.spec.js',
      '!src/node_modules/**/*',
    ],

    compilers: {
      'src/**/*.@(js|jsx)': compiler,
      'src/.specs/**/*.js': compiler,
    },

    env: {
      type: 'node',
      runner: nodePath,
    },

    reportConsoleErrorAsError: true,

    testFramework: 'mocha',

    workers: {
      recycle: true,
    },

    debug: false,

    bootstrap: function () {
      var relativeAppPath = 'src';

      wallaby.delayStart();

      process.on('unhandledRejection', function(reason, promise) {
        var exception = reason.stack ? reason.stack.replace(/\(\/.*?\/instrumented\//g, '(') : reason
        console.error('Unhandled promise rejection', exception)
      });

      var path = require('path');
      var appPath = path.resolve(wallaby.localProjectDir, relativeAppPath);
      var serverPath = path.resolve(appPath,
        path.join('.meteor', 'local', 'build', 'programs', 'server')
      );
      process.argv.splice(2, 0, 'program.json');
      try {
        process.chdir(serverPath);
      } catch (error) {
        if (error.message.match(/^ENOENT/)) {
          throw new Error('You need to run the Meteor app before you start Wallaby!');
        } else {
          throw error;
        }
      }

      require('reify/node/runtime')

      //
      // https://github.com/meteor/meteor/blob/devel/tools/static-assets/server/boot.js
      //
      // Modifications:
      // - Only load packages

      var Fiber = require("fibers");
      var fs = require("fs");
      var path = require("path");
      var Future = require("fibers/future");
      var _ = require('underscore');
      var sourcemap_support = require('source-map-support');

      var bootUtils = require(path.resolve(serverPath, './boot-utils.js'));
      var files = require(path.resolve(serverPath, './mini-files.js'));
      var npmRequire = require(path.resolve(serverPath, './npm-require.js')).require;

      // This code is duplicated in tools/main.js.
      var MIN_NODE_VERSION = 'v0.10.41';

      if (require('semver').lt(process.version, MIN_NODE_VERSION)) {
        process.stderr.write(
          'Meteor requires Node ' + MIN_NODE_VERSION + ' or later.\n');
        process.exit(1);
      }

      // read our control files
      var serverJsonPath = path.resolve(process.argv[2]);
      var serverDir = path.dirname(serverJsonPath);
      var serverJson = require(path.resolve(serverPath, "./server-json.js"));
      var configJson =
        JSON.parse(fs.readFileSync(path.resolve(serverDir, 'config.json'), 'utf8'));

      // Set up environment
      __meteor_bootstrap__ = {
        startupHooks: [],
        serverDir: serverDir,
        configJson: configJson };
      __meteor_runtime_config__ = { meteorRelease: configJson.meteorRelease };

      if (!process.env.APP_ID) {
        process.env.APP_ID = configJson.appId;
      }

      // Map from load path to its source map.
      var parsedSourceMaps = {};

      // Read all the source maps into memory once.
      _.each(serverJson.load, function (fileInfo) {
        if (fileInfo.sourceMap) {
          var rawSourceMap = fs.readFileSync(
            path.resolve(serverDir, fileInfo.sourceMap), 'utf8');
          // Parse the source map only once, not each time it's needed. Also remove
          // the anti-XSSI header if it's there.
          var parsedSourceMap = JSON.parse(rawSourceMap.replace(/^\)\]\}'/, ''));
          // source-map-support doesn't ever look at the sourcesContent field, so
          // there's no point in keeping it in memory.
          delete parsedSourceMap.sourcesContent;
          var url;
          if (fileInfo.sourceMapRoot) {
            // Add the specified root to any root that may be in the file.
            parsedSourceMap.sourceRoot = path.join(
              fileInfo.sourceMapRoot, parsedSourceMap.sourceRoot || '');
          }
          parsedSourceMaps[path.resolve(__dirname, fileInfo.path)] = parsedSourceMap;
        }
      });

      var retrieveSourceMap = function (pathForSourceMap) {
        if (_.has(parsedSourceMaps, pathForSourceMap))
          return { map: parsedSourceMaps[pathForSourceMap] };
        return null;
      };

      var origWrapper = sourcemap_support.wrapCallSite;
      var wrapCallSite = function (frame) {
        var frame = origWrapper(frame);
        var wrapGetter = function (name) {
          var origGetter = frame[name];
          frame[name] = function (arg) {
            // replace a custom location domain that we set for better UX in Chrome
            // DevTools (separate domain group) in source maps.
            var source = origGetter(arg);
            if (! source)
              return source;
            return source.replace(/(^|\()meteor:\/\/..app\//, '$1');
          };
        };
        wrapGetter('getScriptNameOrSourceURL');
        wrapGetter('getEvalOrigin');

        return frame;
      };
      sourcemap_support.install({
        // Use the source maps specified in program.json instead of parsing source
        // code for them.
        retrieveSourceMap: retrieveSourceMap,
        // For now, don't fix the source line in uncaught exceptions, because we
        // haven't fixed handleUncaughtExceptions in source-map-support to properly
        // locate the source files.
        handleUncaughtExceptions: false,
        wrapCallSite: wrapCallSite
      });

      // Only enabled by default in development.
      if (process.env.METEOR_SHELL_DIR) {
        require(path.resolve(serverPath, './shell-server.js')).listen(process.env.METEOR_SHELL_DIR);
      }

      // As a replacement to the old keepalives mechanism, check for a running
      // parent every few seconds. Exit if the parent is not running.
      //
      // Two caveats to this strategy:
      // * Doesn't catch the case where the parent is CPU-hogging (but maybe we
      //   don't want to catch that case anyway, since the bundler not yielding
      //   is what caused #2536).
      // * Could be fooled by pid re-use, i.e. if another process comes up and
      //   takes the parent process's place before the child process dies.
      var startCheckForLiveParent = function (parentPid) {
        if (parentPid) {
          if (! bootUtils.validPid(parentPid)) {
            console.error("METEOR_PARENT_PID must be a valid process ID.");
            process.exit(1);
          }

          setInterval(function () {
            try {
              process.kill(parentPid, 0);
            } catch (err) {
              console.error("Parent process is dead! Exiting.");
              process.exit(1);
            }
          }, 3000);
        }
      };


      Fiber(function () {
        _.each(serverJson.load, function (fileInfo) {
          // Modification: Only load packages
          if (fileInfo.path.indexOf('packages/') !== 0) {
            return;
          }

          var code = fs.readFileSync(path.resolve(serverDir, fileInfo.path));
          var nonLocalNodeModulesPaths = [];

          function addNodeModulesPath(path) {
            nonLocalNodeModulesPaths.push(
              files.pathResolve(serverDir, path)
            );
          }

          if (typeof fileInfo.node_modules === "string") {
            addNodeModulesPath(fileInfo.node_modules);
          } else if (fileInfo.node_modules) {
            _.each(fileInfo.node_modules, function (info, path) {
              if (! info.local) {
                addNodeModulesPath(path);
              }
            });
          }

          function statOrNull(path) {
            try {
              return fs.statSync(path);
            } catch (e) {
              return null;
            }
          }

          var Npm = {
            /**
             * @summary Require a package that was specified using
             * `Npm.depends()`.
             * @param  {String} name The name of the package to require.
             * @locus Server
             * @memberOf Npm
             */
            require: function (name) {
              if (nonLocalNodeModulesPaths.length === 0) {
                return require(name);
              }

              var fullPath;

              nonLocalNodeModulesPaths.some(function (nodeModuleBase) {
                var packageBase = files.convertToOSPath(files.pathResolve(
                  nodeModuleBase,
                  name.split("/", 1)[0]
                ));

              if (statOrNull(packageBase)) {
                  return fullPath = files.convertToOSPath(
                    files.pathResolve(nodeModuleBase, name)
                  );
                }
              });

              if (fullPath) {
                return require(fullPath);
              }

              try {
                return require(name);
              } catch (e) {
                // Try to guess the package name so we can print a nice
                // error message
                // fileInfo.path is a standard path, use files.pathSep
                var filePathParts = fileInfo.path.split(files.pathSep);
                var packageName = filePathParts[1].replace(/\.js$/, '');

                // XXX better message
                throw new Error(
                  "Can't find npm module '" + name +
                  "'. Did you forget to call 'Npm.depends' in package.js " +
                  "within the '" + packageName + "' package?");
              }
            }
          };
          var getAsset = function (assetPath, encoding, callback) {
            var fut;
            if (! callback) {
              fut = new Future();
              callback = fut.resolver();
            }
            // This assumes that we've already loaded the meteor package, so meteor
            // itself can't call Assets.get*. (We could change this function so that
            // it doesn't call bindEnvironment if you don't pass a callback if we need
            // to.)
            var _callback = Package.meteor.Meteor.bindEnvironment(function (err, result) {
              if (result && ! encoding)
              // Sadly, this copies in Node 0.10.
                result = new Uint8Array(result);
              callback(err, result);
            }, function (e) {
              console.log("Exception in callback of getAsset", e.stack);
            });

            // Convert a DOS-style path to Unix-style in case the application code was
            // written on Windows.
            assetPath = files.convertToStandardPath(assetPath);

            // Unicode normalize the asset path to prevent string mismatches when
            // using this string elsewhere.
            // TODO: not released yet
            // assetPath = files.unicodeNormalizePath(assetPath);

            if (!fileInfo.assets || !_.has(fileInfo.assets, assetPath)) {
              _callback(new Error("Unknown asset: " + assetPath));
            } else {
              var filePath = path.join(serverDir, fileInfo.assets[assetPath]);
              fs.readFile(files.convertToOSPath(filePath), encoding, _callback);
            }
            if (fut)
              return fut.wait();
          };

          var Assets = {
            getText: function (assetPath, callback) {
              return getAsset(assetPath, "utf8", callback);
            },
            getBinary: function (assetPath, callback) {
              return getAsset(assetPath, undefined, callback);
            },
            /**
             * @summary Get the absolute path to the static server asset. Note that assets are read-only.
             * @locus Server [Not in build plugins]
             * @memberOf Assets
             * @param {String} assetPath The path of the asset, relative to the application's `private` subdirectory.
             */
            absoluteFilePath: function (assetPath) {
              // Unicode normalize the asset path to prevent string mismatches when
              // using this string elsewhere.
              // TODO: not released yet
              // assetPath = files.unicodeNormalizePath(assetPath);

              if (!fileInfo.assets || !_.has(fileInfo.assets, assetPath)) {
                throw new Error("Unknown asset: " + assetPath);
              }

              assetPath = files.convertToStandardPath(assetPath);
              var filePath = path.join(serverDir, fileInfo.assets[assetPath]);
              return files.convertToOSPath(filePath);
            },
          };

          var isModulesRuntime =
            fileInfo.path === "packages/modules-runtime.js";

          var wrapParts = ["(function(Npm,Assets"];
          if (isModulesRuntime) {
            wrapParts.push(",npmRequire");
          }
          // \n is necessary in case final line is a //-comment
          wrapParts.push("){", code, "\n})");
          var wrapped = wrapParts.join("");

          // It is safer to use the absolute path when source map is present as
          // different tooling, such as node-inspector, can get confused on relative
          // urls.

          // fileInfo.path is a standard path, convert it to OS path to join with
          // __dirname
          var fileInfoOSPath = files.convertToOSPath(fileInfo.path);
          var absoluteFilePath = path.resolve(__dirname, fileInfoOSPath);

          var scriptPath =
            parsedSourceMaps[absoluteFilePath] ? absoluteFilePath : fileInfoOSPath;
          // The final 'true' is an undocumented argument to runIn[Foo]Context that
          // causes it to print out a descriptive error message on parse error. It's
          // what require() uses to generate its errors.
          var func = require('vm').runInThisContext(wrapped, scriptPath, true);
          var args = [Npm, Assets];
          if (isModulesRuntime) {
            args.push(npmRequire);
          }
          func.apply(global, args);
        });

        // A lot of boot.js removed

        process.chdir(appPath);
        wallaby.start();
      }).run();
    },
  };
}
