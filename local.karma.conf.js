module.exports = function(config) {
  config.set({
    logLevel: config.LOG_INFO,

    reporters: ['spec'],

    singleRun : false,
    autoWatch : true,

    frameworks: [
      'mocha',
      'browserify'
    ],

    files: [
      { pattern: 'src/**/*', included: false },
      { pattern: 'spec/*', included: false },
      'src/index.js',
      'spec/index.js'
    ],

    preprocessors: {
      'src/index.js': ['browserify'],
      'spec/index.js': ['browserify']
    },

    //browserify: {
      //debug: true
    //},

    // Line comment browsers you're currently not interested in
    // PhantomJS is always good to have
    browsers: [
      //'Firefox',
      //'Chrome',
      'PhantomJS'
    ]

  });
};
