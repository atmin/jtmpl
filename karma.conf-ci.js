var fs = require('fs');

module.exports = function(config) {

  // Use ENV vars on Travis and sauce.json locally to get credentials
  if (!process.env.SAUCE_USERNAME) {
    if (!fs.existsSync('sauce.json')) {
      console.log('Create a sauce.json with your credentials based on the sauce-sample.json file.');
      process.exit(1);
    } else {
      process.env.SAUCE_USERNAME = require('./sauce').username;
      process.env.SAUCE_ACCESS_KEY = require('./sauce').accessKey;
    }
  }


  // Workaround Sauce Labs concurrency issues
  // Check: https://github.com/karma-runner/karma-sauce-launcher/issues/40
  var batchId = [].reduce.call(
    process.argv,
    function(prev, curr) {
      return (curr && curr.indexOf('--batch-') === 0) ?
        curr.substr(8) : prev;
    },
    null
  );
  var browserConcurrency = 3;

  // Browsers to run on Sauce Labs
  var customLaunchers = {
    'SL_ChromeWin7': {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7'
    },
    'SL_FirefoxWin7': {
      base: 'SauceLabs',
      browserName: 'firefox',
      platform: 'Windows 7'
    },
    'SL_Chrome': {
      base: 'SauceLabs',
      browserName: 'chrome'
    },
    'SL_Firefox': {
      base: 'SauceLabs',
      browserName: 'firefox'
    },
    'SL_IE9': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '9'
    },
    'SL_IE10': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '10'
    },
    'SL_IE11': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '11'
    },
    'SL_Safari': {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.9',
      version: '7'
    },
    'SL_Android': {
      base: 'SauceLabs',
      browserName: 'android',
      platform: 'Linux',
      version: '4.0'
    },
    'SL_AndroidTablet': {
      base: 'SauceLabs',
      browserName: 'android',
      platform: 'Linux',
      version: '4.0',
      'device-type': 'tablet'
    },
    'SL_iPhone7': {
      base: 'SauceLabs',
      browserName: 'iPhone',
      platform: 'OSX 10.9',
      version: '7'
    },
    'SL_iPhone81': {
      base: 'SauceLabs',
      browserName: 'iPhone',
      platform: 'OSX 10.9',
      version: '8.1'
    },
    'SL_iPad7': {
      base: 'SauceLabs',
      browserName: 'iPad',
      platform: 'OSX 10.9',
      version: '7'
    },
    'SL_iPad81': {
      base: 'SauceLabs',
      browserName: 'iPad',
      platform: 'OSX 10.9',
      version: '8.1'
    },
    'SL_Opera12': {
      base: 'SauceLabs',
      browserName: 'opea',
      platform: 'Windows 7',
      version: '12'
    }
  };

  var launchersBatch = [].reduce.call(
    Object.keys(customLaunchers),
    function(launchers, curr, index) {
      if (batchId === null || batchId == Math.ceil(index / browserConcurrency)) {
        launchers[curr] = customLaunchers[curr];
      }
      return launchers;
    },
    {}
  );

  console.log('batchId = ' + batchId);
  console.log('launchersBatch.length = ' + Object.keys(launchersBatch).length);

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [
      'mocha',
      'browserify'
    ],

    files: [
      { pattern: 'src/**/*', included: false },
      { pattern: 'spec/*', included: false },
      'src/main.js',
      'spec/main.js'
    ],

    preprocessors: {
      'src/main.js': ['browserify'],
      'spec/main.js': ['browserify']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'saucelabs'],


    // web server port
    port: 9876,

    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    sauceLabs: {
      testName: 'jtmpl test suite'
    },
    captureTimeout: 90000,
    customLaunchers: launchersBatch,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(launchersBatch),
    singleRun: true
  });
};
